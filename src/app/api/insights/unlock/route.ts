import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { makeUnlockCookie } from '@/lib/unlock';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: match } = await db
      .from('access_codes')
      .select('id, used_count, expires_at')
      .eq('email', email)
      .eq('code', String(code).trim())
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!match) {
      return NextResponse.json({ error: 'That code didn’t match — check the email it was sent to' }, { status: 401 });
    }

    await db.from('access_codes').update({ used_count: match.used_count + 1 }).eq('id', match.id);

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
