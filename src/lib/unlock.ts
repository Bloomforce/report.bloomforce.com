import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'bf_insights_unlock';
const MAX_AGE_DAYS = 45;

function secret(): string {
  const s = process.env.UNLOCK_COOKIE_SECRET;
  if (!s) throw new Error('UNLOCK_COOKIE_SECRET is not set');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function makeUnlockCookie(email: string): { name: string; value: string; maxAge: number } {
  const exp = Date.now() + MAX_AGE_DAYS * 86400000;
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url');
  return {
    name: COOKIE_NAME,
    value: `${payload}.${sign(payload)}`,
    maxAge: MAX_AGE_DAYS * 86400,
  };
}

export function verifyUnlockCookie(cookieValue: string | undefined): { email: string } | null {
  if (!cookieValue) return null;
  const [payload, sig] = cookieValue.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof email !== 'string' || typeof exp !== 'number' || Date.now() > exp) return null;
    return { email };
  } catch {
    return null;
  }
}

export const UNLOCK_COOKIE_NAME = COOKIE_NAME;
