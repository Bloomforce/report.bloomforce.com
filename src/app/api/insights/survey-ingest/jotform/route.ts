import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  jotformEnvelope,
  parseJotformPayload,
} from '@/lib/insights/survey-instruments';
import { normalizeJotformSubmission } from '@/lib/insights/jotform-normalize';

export const runtime = 'nodejs';

function authorized(request: Request): boolean {
  const expected = process.env.JOTFORM_WEBHOOK_SECRET;
  if (!expected) return false;
  const header = request.headers.get('x-bloomforce-webhook-secret');
  const query = new URL(request.url).searchParams.get('key');
  return header === expected || query === expected;
}

async function requestPayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    if (body && typeof body === 'object' && 'rawRequest' in body) {
      return parseJotformPayload((body as Record<string, unknown>).rawRequest);
    }
    return parseJotformPayload(body);
  }

  const form = await request.formData();
  return parseJotformPayload(form.get('rawRequest'));
}

async function sha256(payload: Record<string, unknown>): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await requestPayload(request);
    const { formId, submissionId, instrument, submittedAt } = jotformEnvelope(payload);
    const db = supabaseAdmin();

    const { data: existing, error: existingError } = await db
      .from('survey_submissions_raw')
      .select('id,processing_status')
      .eq('provider', 'jotform')
      .eq('provider_submission_id', submissionId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing && !['received', 'error'].includes(existing.processing_status)) {
      return NextResponse.json({ ok: true, duplicate: true, status: existing.processing_status });
    }

    const receivedAt = submittedAt || new Date().toISOString();
    if (existing) {
      const recovered = await normalizeJotformSubmission(
        db,
        existing.id,
        payload,
        instrument,
        submissionId,
        receivedAt,
      );
      return NextResponse.json({ ok: true, duplicate: true, recovered: true, normalization: recovered.status });
    }

    const { data: rawSubmission, error } = await db
      .from('survey_submissions_raw')
      .insert({
        provider: 'jotform',
        provider_form_id: formId,
        provider_submission_id: submissionId,
        instrument_key: instrument.key,
        instrument_version: instrument.version,
        submitted_at: receivedAt,
        payload,
        payload_sha256: await sha256(payload),
        processing_status: 'received',
      })
      .select('id')
      .single();
    if (error) {
      // Concurrent webhook retries are harmless because the database key is
      // unique. Everything else should remain visible as an actual failure.
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      throw error;
    }

    let normalized;
    try {
      normalized = await normalizeJotformSubmission(
        db,
        rawSubmission.id,
        payload,
        instrument,
        submissionId,
        receivedAt,
      );
    } catch (normalizationError) {
      await db
        .from('survey_submissions_raw')
        .update({
          processing_status: 'error',
          processing_error: normalizationError instanceof Error
            ? normalizationError.message
            : String(normalizationError),
          processed_at: new Date().toISOString(),
        })
        .eq('id', rawSubmission.id);
      throw normalizationError;
    }
    return NextResponse.json({ ok: true, queued: true, normalization: normalized.status });
  } catch (error) {
    console.error('[jotform-ingest]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to ingest submission' },
      { status: 400 },
    );
  }
}
