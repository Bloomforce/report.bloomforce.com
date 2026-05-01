import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { firstName, lastName, email, company, role, phone } = data;
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
      source: 'bloomforce-insights-2025',
      timestamp: new Date().toISOString(),
    };

    const deliveries: Array<{ target: string; ok: boolean; status?: number }> = [];

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
      'https://formsubmit.co/7426275000499c11e9bf5cd4616c119d';

    if (formSubmitEndpoint) {
      const formData = new URLSearchParams({
        _subject: 'Bloomforce report access request',
        _template: 'table',
        _captcha: 'false',
        _replyto: email,
        name: `${firstName} ${lastName}`,
        email,
        company,
        role,
        phone: phone || '',
        source: lead.source,
        submitted_at: lead.timestamp,
      });

      const formSubmitResponse = await fetch(formSubmitEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'text/html,application/json',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': 'Bloomforce report lead capture',
        },
        body: formData.toString(),
      }).catch(() => null);
      deliveries.push({
        target: 'formsubmit',
        ok: Boolean(formSubmitResponse && formSubmitResponse.status < 400),
        status: formSubmitResponse?.status,
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
