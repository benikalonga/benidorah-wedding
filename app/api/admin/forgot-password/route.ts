import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, isPasswordStrongEnough } from '@/lib/auth';
import { forgotPasswordSchema } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rateLimit';

// Unauthenticated by design (that's the whole point of "forgot password"),
// so identity is proven by knowing the shared ADMIN_SEED_PASSWORD instead
// of a session. That trades a full password reset for a shared secret, so
// this is rate-limited tighter than a normal login attempt.
export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`admin-forgot-password:${clientIp(req)}`, 5, 15 * 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { email, defaultPassword, newPassword, confirmPassword } = parsed.data;

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
  }

  // Constant-shaped error whether the default password is wrong or the
  // email doesn't exist — never reveal which one, same spirit as login.
  const invalid = () => NextResponse.json({ error: 'Invalid email or default password' }, { status: 401 });

  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPassword || defaultPassword !== seedPassword) {
    return invalid();
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return invalid();

  if (!isPasswordStrongEnough(newPassword)) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters and include upper, lower case letters and a number.' },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null },
  });

  return NextResponse.json({ ok: true });
}
