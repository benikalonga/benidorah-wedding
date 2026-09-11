import { NextResponse } from 'next/server';
import { getAdminSession, AdminSession } from './auth';

/**
 * Every admin mutation route must call this first. Next's middleware only
 * protects page navigations, not fetch() calls made directly against API
 * routes, so each handler re-checks the session server-side per §12 of
 * the brief ("a Viewer hitting a mutation endpoint directly should get a
 * 403" — here, simplified to one flat `admin` role, a 401 for no session).
 */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}

export function isSession(value: AdminSession | NextResponse): value is AdminSession {
  return !(value instanceof NextResponse);
}
