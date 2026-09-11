import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import { hashPassword, verifyPassword, isPasswordStrongEnough, createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { passwordResetSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const json = await req.json().catch(() => null);
  const parsed = passwordResetSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const valid = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });

  if (!isPasswordStrongEnough(parsed.data.newPassword)) {
    return NextResponse.json(
      { error: 'Password must be at least 10 characters and include upper, lower case letters and a number.' },
      { status: 400 }
    );
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: newHash, mustChangePassword: false },
  });

  const token = await createSessionToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    mustChangePassword: false,
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieOptions.name, token, sessionCookieOptions);
  return res;
}
