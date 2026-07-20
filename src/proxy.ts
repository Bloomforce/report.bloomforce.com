import { NextRequest, NextResponse } from 'next/server';

function unauthorized(message = 'Authentication required') {
  return new NextResponse(message, {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Bloomforce Market Data"' },
  });
}

export function proxy(request: NextRequest) {
  const expectedUser = process.env.INSIGHTS_ADMIN_USER;
  const expectedPassword = process.env.INSIGHTS_ADMIN_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next();
    return new NextResponse('Market Data Operations is not configured', { status: 503 });
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Basic ')) return unauthorized();

  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(':');
    const user = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    if (separator < 0 || user !== expectedUser || password !== expectedPassword) {
      return unauthorized('Invalid credentials');
    }
    return NextResponse.next();
  } catch {
    return unauthorized('Invalid credentials');
  }
}

export const config = { matcher: ['/admin/:path*'] };
