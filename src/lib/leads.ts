import 'server-only';

const FORM_SUBMIT_EMAIL = 'hello@bloomforce.com';
const DEFAULT_FROM_EMAIL = `Bloomforce <${FORM_SUBMIT_EMAIL}>`;
const HUBSPOT_FORMS_API_URL = 'https://api.hsforms.com/submissions/v3/integration/submit';
const WEBSITE_LEAD_API_URL = 'https://www.bloomforce.com/api/lead';
const NEWSLETTER_FALLBACK_URL = 'https://www.bloomforce.com/api/newsletter';
const RESEND_API_URL = 'https://api.resend.com/emails';

export type Lead = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  phone: string;
  page: string;
  source: string;
  timestamp: string;
  /** Extra context appended to the notes/message (e.g. contribution details). */
  notes?: string;
};

export type Delivery = {
  target: string;
  ok: boolean;
  status?: number;
  message?: string;
  captureOnly?: boolean;
};

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';
  if ('message' in payload && typeof payload.message === 'string') return payload.message;
  if ('error' in payload && typeof payload.error === 'string') return payload.error;
  return '';
}

function isExplicitFailure(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('success' in payload)) return false;
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

function subjectFor(lead: Lead) {
  return lead.source === 'insights-contribution'
    ? `Insights contribution + unlock: ${lead.firstName} ${lead.lastName}`.trim()
    : `EHR Salary Insights request: ${lead.firstName} ${lead.lastName}`.trim();
}

export function buildLeadEmailText(lead: Lead) {
  return [
    `New lead — ${lead.source}`,
    '',
    `Name: ${lead.firstName} ${lead.lastName}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company}`,
    `Role: ${lead.role}`,
    `Phone: ${lead.phone || 'Not provided'}`,
    `Page: ${lead.page}`,
    `Source: ${lead.source}`,
    `Submitted: ${lead.timestamp}`,
    ...(lead.notes ? ['', lead.notes] : []),
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
    ...(lead.notes ? [['Details', lead.notes]] : []),
  ];

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#121d2b;line-height:1.5">
      <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(subjectFor(lead))}</h1>
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

function getCookie(request: Request | undefined, name: string) {
  const cookie = request?.headers.get('cookie') || '';
  const match = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

async function sendToHubSpot(lead: Lead, request?: Request): Promise<Delivery | null> {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formId = process.env.HUBSPOT_REPORT_ACCESS_FORM_ID || process.env.HUBSPOT_LEAD_FORM_ID;
  if (!portalId || !formId) return null;

  const hutk = getCookie(request, 'hubspotutk');
  const hubSpotResponse = await fetch(`${HUBSPOT_FORMS_API_URL}/${portalId}/${formId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: [
        { name: 'firstname', value: lead.firstName },
        { name: 'lastname', value: lead.lastName },
        { name: 'email', value: lead.email },
        { name: 'company', value: lead.company },
        { name: 'jobtitle', value: lead.role },
        { name: 'phone', value: lead.phone },
        { name: 'message', value: buildLeadEmailText(lead) },
      ],
      submittedAt: Date.parse(lead.timestamp),
      context: {
        ...(hutk ? { hutk } : {}),
        pageUri: lead.page,
        pageName: 'Bloomforce Insights',
      },
    }),
  }).catch(() => null);

  const payload = await hubSpotResponse?.json().catch(() => ({}));
  return {
    target: 'hubspot',
    ok: Boolean(hubSpotResponse?.ok),
    status: hubSpotResponse?.status,
    message: getErrorMessage(payload),
  };
}

async function sendToResend(lead: Lead): Promise<Delivery | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

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
      subject: subjectFor(lead),
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

async function sendToWebsiteLeadApi(lead: Lead): Promise<Delivery> {
  const endpoint = process.env.WEBSITE_LEAD_API_URL || WEBSITE_LEAD_API_URL;
  const websiteResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: lead.source === 'insights-contribution' ? 'insights_contribution' : 'report_access_2026',
      source: lead.source,
      sourceDetail: 'report.bloomforce.com',
      name: `${lead.firstName} ${lead.lastName}`.trim(),
      email: lead.email,
      organization: lead.company,
      role: lead.role,
      phone: lead.phone,
      notes: buildLeadEmailText(lead),
      page: lead.page,
    }),
  }).catch(() => null);
  const payload = await websiteResponse?.json().catch(() => ({}));
  return {
    target: 'website-lead-api',
    ok: Boolean(websiteResponse?.ok),
    status: websiteResponse?.status,
    message: getErrorMessage(payload),
  };
}

/**
 * Multi-destination lead delivery with fallbacks — the single pipeline every
 * capture surface (email gate, contribution gate, analyzer) routes through.
 */
export async function deliverLead(lead: Lead, request?: Request): Promise<{ ok: boolean; deliveries: Delivery[] }> {
  const deliveries: Delivery[] = [];

  deliveries.push(await sendToWebsiteLeadApi(lead));

  const hubSpotDelivery = await sendToHubSpot(lead, request);
  if (hubSpotDelivery) deliveries.push(hubSpotDelivery);

  const resendDelivery = await sendToResend(lead);
  if (resendDelivery) deliveries.push(resendDelivery);

  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  if (webhookUrl) {
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    }).catch(() => null);
    deliveries.push({ target: 'crm', ok: Boolean(webhookResponse?.ok), status: webhookResponse?.status });
  }

  const formSubmitEndpoint =
    process.env.FORMSUBMIT_REPORT_ENDPOINT ||
    `https://formsubmit.co/ajax/${encodeURIComponent(FORM_SUBMIT_EMAIL)}`;
  if (formSubmitEndpoint) {
    const formSubmitResponse = await fetch(formSubmitEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _subject: subjectFor(lead),
        _template: 'table',
        _captcha: 'false',
        _replyto: lead.email,
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        company: lead.company,
        role: lead.role,
        phone: lead.phone,
        page: lead.page,
        source: lead.source,
        submitted_at: lead.timestamp,
        ...(lead.notes ? { details: lead.notes } : {}),
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
    const newsletterResponse = await fetch(process.env.NEWSLETTER_FALLBACK_URL || NEWSLETTER_FALLBACK_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: lead.email,
        source: lead.source,
        firstName: lead.firstName,
        lastName: lead.lastName,
        company: lead.company,
        role: lead.role,
        phone: lead.phone,
        page: lead.page,
      }),
    }).catch(() => null);
    const payload = await newsletterResponse?.json().catch(() => ({}));
    deliveries.push({
      target: 'newsletter',
      ok: Boolean(newsletterResponse && newsletterResponse.status < 400),
      status: newsletterResponse?.status,
      message: getErrorMessage(payload),
      captureOnly: true,
    });
  }

  const ok = deliveries.some((delivery) => delivery.ok && !delivery.captureOnly);
  return { ok, deliveries };
}
