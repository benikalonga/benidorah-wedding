import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from './lib/session';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];
const RESERVED_TOP_LEVEL = new Set([
  'admin',
  'api',
  'offline',
  '_next',
  'favicon.ico',
  'manifest.json',
  'sw.js',
  'icons',
  'uploads',
  'images',
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    const cookieName = process.env.SESSION_COOKIE_NAME || 'benidorah_admin_session';
    const token = req.cookies.get(cookieName)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    if (session.mustChangePassword && pathname !== '/admin/settings') {
      return NextResponse.redirect(new URL('/admin/settings?forced=1', req.url));
    }
    return NextResponse.next();
  }

  // Guest hash routes are a single dynamic segment at the root, e.g.
  // /aB3xQ9kLmN. Anything matching a reserved top-level path above is
  // handled by its own route instead of the [hash] catch-all.
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  if (firstSegment && !RESERVED_TOP_LEVEL.has(firstSegment)) {
    // No DB lookup here (middleware runs on the Edge runtime without
    // Prisma); the [hash]/page.tsx server component resolves the guest
    // and marks link_opened_at on first render instead.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|images|icons|manifest.json).*)'],
};
