import { NextResponse } from 'next/server';
import { deliverLead, type Lead } from '@/lib/leads';

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
      page: page || request.headers.get('referer') || 'https://report.bloomforce.com',
      source: 'bloomforce-insights-2025',
      timestamp: new Date().toISOString(),
    };

    const { ok, deliveries } = await deliverLead(lead, request);
    if (!ok) {
      return NextResponse.json({ error: 'Lead delivery failed', deliveries }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
