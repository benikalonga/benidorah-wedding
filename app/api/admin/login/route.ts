import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  verifyPassword,
  createSessionToken,
  sessionCookieOptions,
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOCKOUT_MINUTES,
} from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`admin-login:${clientIp(req)}`, 8, 5 * 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many login attempts. Try again shortly.' }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  // Constant-shaped response whether the account exists or not, to avoid
  // leaking which admin emails are valid.
  if (!admin) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: `Account locked. Try again after ${admin.lockedUntil.toLocaleTimeString()}.` },
      { status: 423 }
    );
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    const attempts = admin.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= MAX_FAILED_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: attempts, lockedUntil },
    });
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const token = await createSessionToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    mustChangePassword: admin.mustChangePassword,
  });

  const res = NextResponse.json({ ok: true, mustChangePassword: admin.mustChangePassword });
  res.cookies.set(sessionCookieOptions.name, token, sessionCookieOptions);
  return res;
}
