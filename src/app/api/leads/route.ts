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

    const deliveries: boolean[] = [];

    // Forward to CRM webhook if configured.
    const webhookUrl = process.env.CRM_WEBHOOK_URL;
    if (webhookUrl) {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).catch(() => null);
      deliveries.push(Boolean(webhookResponse?.ok));
    }

    // Fallback inbox capture through FormSubmit, matching the main site setup.
    const formSubmitEndpoint =
      process.env.FORMSUBMIT_REPORT_ENDPOINT ||
      'https://formsubmit.co/ajax/7426275000499c11e9bf5cd4616c119d';

    if (formSubmitEndpoint) {
      const formData = new FormData();
      formData.append('_subject', 'Bloomforce report access request');
      formData.append('_template', 'table');
      formData.append('_captcha', 'false');
      formData.append('_replyto', email);
      formData.append('name', `${firstName} ${lastName}`);
      formData.append('email', email);
      formData.append('company', company);
      formData.append('role', role);
      formData.append('phone', phone || '');
      formData.append('source', lead.source);
      formData.append('submitted_at', lead.timestamp);

      const formSubmitResponse = await fetch(formSubmitEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      }).catch(() => null);
      deliveries.push(Boolean(formSubmitResponse?.ok));
    }

    if (!deliveries.some(Boolean)) {
      return NextResponse.json({ error: 'Lead delivery failed' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
