// Edge-runtime-safe session helpers (jose only — no bcrypt). middleware.ts
// runs on the Edge runtime and must not pull in bcryptjs transitively, so
// password hashing/verification lives separately in lib/auth.ts, which
// re-exports everything here for convenience in Node-runtime code.
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-only-insecure-secret');
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'benidorah_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface AdminSession {
  sub: string; // admin user id
  email: string;
  role: string;
  mustChangePassword: boolean;
}

export async function createSessionToken(session: AdminSession) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
