import { NextResponse } from 'next/server';
import { deliverLead, type Lead } from '@/lib/leads';

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = request.headers.get('x-vercel-id') || crypto.randomUUID();

  try {
    const data = await request.json();

    const { firstName, lastName, email, company, role, phone, page, intent } = data;
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
      page: page || request.headers.get('referer') || 'https://report.bloomforce.com',
      source: 'bloomforce-insights-2026',
      timestamp: new Date().toISOString(),
      ...(typeof intent === 'string' && intent
        ? { notes: `Looking at the data for: ${intent === 'career' ? 'their own career' : intent === 'team' ? 'a team they are building' : 'their career and their team'}` }
        : {}),
    };

    const { ok, deliveries } = await deliverLead(lead, request);
    console.log(JSON.stringify({
      level: ok ? 'info' : 'error',
      message: 'Report access lead delivery completed',
      route: '/api/leads',
      requestId,
      durationMs: Date.now() - startedAt,
      deliveries: deliveries.map(({ target, ok: delivered, status, captureOnly }) => ({
        target,
        ok: delivered,
        status,
        captureOnly: Boolean(captureOnly),
      })),
    }));
    if (!ok) {
      return NextResponse.json({ error: 'Lead delivery failed', deliveries }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Report access lead submission failed',
      route: '/api/leads',
      requestId,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
