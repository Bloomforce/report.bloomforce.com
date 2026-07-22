import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { deliverLead } from '@/lib/leads';
import { makeUnlockCookie } from '@/lib/unlock';
import {
  compensationBounds,
  normalizedRespondentKey,
} from '@/lib/insights/survey-quality';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'yopmail.com', 'sharklasers.com', 'trashmail.com', 'getnada.com', 'dispostable.com',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { roleFamily, seniority, employerType, region, baseComp, bonusComp, workModel, module, credential, email } = data ?? {};

    if (!roleFamily || !seniority || !employerType || !region || !baseComp || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid work email' }, { status: 400 });
    }
    const domain = String(email).split('@')[1]?.toLowerCase();
    if (!domain || DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json({ error: 'Enter a valid work email' }, { status: 400 });
    }

    const base = Number(baseComp);
    const [lo, hi] = compensationBounds(String(roleFamily));
    if (!Number.isFinite(base) || base < lo || base > hi) {
      return NextResponse.json(
        { error: `Base salary looks off — expected between $${(lo / 1000).toFixed(0)}k and $${(hi / 1000).toFixed(0)}k for this role` },
        { status: 400 },
      );
    }
    const bonus = bonusComp === undefined || bonusComp === null || bonusComp === '' ? null : Number(bonusComp);
    if (bonus !== null && (!Number.isFinite(bonus) || bonus < 0 || bonus > 200000)) {
      return NextResponse.json({ error: 'Bonus looks off — enter the annual dollar amount' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const providerSubmissionId = crypto.randomUUID();
    const respondentKey = await normalizedRespondentKey(email);

    // Rate limit: max 5 codes per email per day
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { count } = await db
      .from('access_codes')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', dayAgo);
    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'Too many requests today — use the code we emailed you' }, { status: 429 });
    }

    const submittedAt = new Date().toISOString();
    const rawPayload = {
      roleFamily,
      seniority,
      employerType,
      region,
      baseComp: base,
      bonusComp: bonus,
      workModel: workModel ?? null,
      module: module ?? null,
      credential: credential ?? null,
      contributedAt: submittedAt,
    };
    const { data: rawSubmission, error: rawError } = await db
      .from('survey_submissions_raw')
      .insert({
        provider: 'bloomforce',
        provider_form_id: 'report-contribution',
        provider_submission_id: providerSubmissionId,
        instrument_key: 'continuous_comp_contribution',
        instrument_version: 1,
        submitted_at: submittedAt,
        payload: rawPayload,
        processing_status: 'normalized',
      })
      .select('id')
      .single();
    if (rawError) {
      console.error('[contribute] raw insert failed', rawError.message);
      return NextResponse.json({ error: 'Something went wrong — try again' }, { status: 500 });
    }

    // Quarantined contribution: access unlocks immediately, while benchmark
    // inclusion waits for the promotion and quality checks.
    const seniorityLevel = String(seniority);
    const roleKey = `${roleFamily}.${seniorityLevel}`;
    const { data: inserted, error: insertError } = await db
      .from('survey_responses')
      .insert({
        role_family: roleFamily,
        seniority_level: seniorityLevel,
        role_key: roleKey,
        region,
        employer_type: employerType,
        work_model: workModel ?? null,
        module: module ?? null,
        credential: credential ?? null,
        base_comp: base,
        bonus_comp: bonus,
        total_comp: base + (bonus ?? 0),
        currency: 'USD',
        source: 'web_contribution',
        status: 'pending',
        verified: false,
        survey_year: new Date().getFullYear(),
        raw: { contributed_at: submittedAt },
        instrument_key: 'continuous_comp_contribution',
        instrument_version: 1,
        provider_submission_id: providerSubmissionId,
        raw_submission_id: rawSubmission.id,
        respondent_key: respondentKey,
        baseline_cohort: 'continuous',
        is_baseline: false,
        validation_notes: [],
      })
      .select('id')
      .single();
    if (insertError) {
      console.error('[contribute] insert failed', insertError.message);
      await db
        .from('survey_submissions_raw')
        .update({ processing_status: 'error', processing_error: insertError.message })
        .eq('id', rawSubmission.id);
      return NextResponse.json({ error: 'Something went wrong — try again' }, { status: 500 });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await db.from('access_codes').insert({
      email,
      code,
      role_interest: roleFamily,
      survey_response_id: inserted.id,
    });

    // Lead fan-out — await it so serverless execution cannot end before CRM delivery.
    const notes = [
      'Insights contribution (tier-2 unlock):',
      `Role family: ${roleFamily} · Level: ${seniorityLevel}`,
      `Region: ${region} · Employer type: ${employerType}${workModel ? ` · ${workModel}` : ''}`,
      'Comp shared: yes (in benchmark quarantine)',
    ].join('\n');
    const leadDelivery = await deliverLead(
      {
        firstName: '',
        lastName: '',
        email,
        company: '',
        role: roleFamily,
        phone: '',
        page: request.headers.get('referer') || 'https://report.bloomforce.com',
        source: 'insights-contribution',
        timestamp: new Date().toISOString(),
        notes,
      },
      request,
    ).catch(() => ({ ok: false, deliveries: [] }));
    console.log(JSON.stringify({
      level: leadDelivery.ok ? 'info' : 'error',
      message: 'Insights contribution lead delivery completed',
      route: '/api/insights/contribute',
      deliveries: leadDelivery.deliveries.map(({ target, ok, status, captureOnly }) => ({
        target,
        ok,
        status,
        captureOnly: Boolean(captureOnly),
      })),
    }));

    // Return-visit code email via Resend (best effort)
    if (process.env.RESEND_API_KEY) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.REPORT_LEAD_FROM_EMAIL || 'Bloomforce <hello@bloomforce.com>',
          to: [email],
          subject: 'Your Bloomforce Insights access code',
          text: [
            'Thanks for adding your data point to the benchmark.',
            '',
            `Your access code for return visits: ${code}`,
            '',
            'It works on report.bloomforce.com for 45 days — enter it under "Already have a code?" to re-open the market detail view.',
            '',
            'No pitch. Just data.',
          ].join('\n'),
        }),
      }).catch(() => {});
    }

    const cookie = makeUnlockCookie(email);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: cookie.maxAge,
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
