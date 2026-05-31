import { NextResponse } from 'next/server';

const FORM_SUBMIT_EMAIL = 'hello@bloomforce.com';
const NEWSLETTER_FALLBACK_URL = 'https://www.bloomforce.com/api/newsletter';

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }

  return '';
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { firstName, lastName, email, company, role, phone, page } = data;
    if (!firstName || !lastName || !email || !company || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const lead = {
      firstName,
      lastName,
      email,
      company,
      role,
      phone: phone || '',
      page: page || request.headers.get('referer') || 'https://www.bloomforce.com/report',
      source: 'bloomforce-insights-2025',
      timestamp: new Date().toISOString(),
    };

    const deliveries: Array<{ target: string; ok: boolean; status?: number; message?: string }> = [];

    // Forward to CRM webhook if configured.
    const webhookUrl = process.env.CRM_WEBHOOK_URL;
    if (webhookUrl) {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).catch(() => null);
      deliveries.push({
        target: 'crm',
        ok: Boolean(webhookResponse?.ok),
        status: webhookResponse?.status,
      });
    }

    // Fallback inbox capture through FormSubmit, matching the main site setup.
    const formSubmitEndpoint =
      process.env.FORMSUBMIT_REPORT_ENDPOINT ||
      `https://formsubmit.co/ajax/${encodeURIComponent(FORM_SUBMIT_EMAIL)}`;

    if (formSubmitEndpoint) {
      const formSubmitResponse = await fetch(formSubmitEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _subject: '2025 EHR Salary Report access request',
          _template: 'table',
          _captcha: 'false',
          _replyto: email,
          name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          email,
          company,
          role,
          phone: phone || '',
          page: lead.page,
          source: lead.source,
          submitted_at: lead.timestamp,
        }),
      }).catch(() => null);
      const payload = await formSubmitResponse?.json().catch(() => ({}));
      deliveries.push({
        target: 'formsubmit',
        ok: Boolean(formSubmitResponse && formSubmitResponse.status < 400),
        status: formSubmitResponse?.status,
        message: getErrorMessage(payload),
      });
    }

    if (!deliveries.some((delivery) => delivery.ok)) {
      const newsletterResponse = await fetch(
        process.env.NEWSLETTER_FALLBACK_URL || NEWSLETTER_FALLBACK_URL,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            source: 'report_access_request_2025',
            firstName,
            lastName,
            company,
            role,
            phone: phone || '',
            page: lead.page,
          }),
        },
      ).catch(() => null);
      const payload = await newsletterResponse?.json().catch(() => ({}));
      deliveries.push({
        target: 'newsletter',
        ok: Boolean(newsletterResponse && newsletterResponse.status < 400),
        status: newsletterResponse?.status,
        message: getErrorMessage(payload),
      });
    }

    if (!deliveries.some((delivery) => delivery.ok)) {
      return NextResponse.json({ error: 'Lead delivery failed', deliveries }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
