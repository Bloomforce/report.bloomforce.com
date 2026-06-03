import { NextResponse } from 'next/server';

const FORM_SUBMIT_EMAIL = 'hello@bloomforce.com';
const DEFAULT_FROM_EMAIL = `Bloomforce <${FORM_SUBMIT_EMAIL}>`;
const NEWSLETTER_FALLBACK_URL = 'https://www.bloomforce.com/api/newsletter';
const RESEND_API_URL = 'https://api.resend.com/emails';

type Lead = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  phone: string;
  page: string;
  source: string;
  timestamp: string;
};

type Delivery = {
  target: string;
  ok: boolean;
  status?: number;
  message?: string;
  captureOnly?: boolean;
};

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

function isExplicitFailure(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('success' in payload)) {
    return false;
  }

  return payload.success === false || payload.success === 'false';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildLeadEmailText(lead: Lead) {
  return [
    'New 2025 EHR Salary Report access request',
    '',
    `Name: ${lead.firstName} ${lead.lastName}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company}`,
    `Role: ${lead.role}`,
    `Phone: ${lead.phone || 'Not provided'}`,
    `Page: ${lead.page}`,
    `Source: ${lead.source}`,
    `Submitted: ${lead.timestamp}`,
  ].join('\n');
}

function buildLeadEmailHtml(lead: Lead) {
  const fields = [
    ['Name', `${lead.firstName} ${lead.lastName}`],
    ['Email', lead.email],
    ['Company', lead.company],
    ['Role', lead.role],
    ['Phone', lead.phone || 'Not provided'],
    ['Page', lead.page],
    ['Source', lead.source],
    ['Submitted', lead.timestamp],
  ];

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#121d2b;line-height:1.5">
      <h1 style="font-size:20px;margin:0 0 16px">New 2025 EHR Salary Report access request</h1>
      <table style="border-collapse:collapse;width:100%;max-width:640px">
        <tbody>
          ${fields
            .map(
              ([label, value]) => `
                <tr>
                  <td style="border:1px solid #e5e7eb;padding:10px 12px;font-weight:700;background:#f8fafc;width:150px">${escapeHtml(label)}</td>
                  <td style="border:1px solid #e5e7eb;padding:10px 12px">${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function sendToResend(lead: Lead): Promise<Delivery | null> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  const toEmail = process.env.REPORT_LEAD_TO_EMAIL || FORM_SUBMIT_EMAIL;
  const fromEmail =
    process.env.REPORT_LEAD_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: lead.email,
      subject: `2025 EHR Salary Report request: ${lead.firstName} ${lead.lastName}`,
      html: buildLeadEmailHtml(lead),
      text: buildLeadEmailText(lead),
    }),
  }).catch(() => null);

  const payload = await resendResponse?.json().catch(() => ({}));

  return {
    target: 'resend',
    ok: Boolean(resendResponse?.ok),
    status: resendResponse?.status,
    message: getErrorMessage(payload),
  };
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

    const lead: Lead = {
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

    const deliveries: Delivery[] = [];

    const resendDelivery = await sendToResend(lead);
    if (resendDelivery) {
      deliveries.push(resendDelivery);
    }

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
        ok: Boolean(formSubmitResponse?.ok && !isExplicitFailure(payload)),
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
        captureOnly: true,
      });
    }

    const hasLeadDelivery = deliveries.some((delivery) => delivery.ok && !delivery.captureOnly);

    if (!hasLeadDelivery) {
      return NextResponse.json({ error: 'Lead delivery failed', deliveries }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
