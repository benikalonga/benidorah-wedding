import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import { guestInputSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const json = await req.json().catch(() => null);
  const parsed = guestInputSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid guest data', details: parsed.error.flatten() }, { status: 400 });
  }

  const guest = await prisma.guest.update({ where: { id: params.id }, data: parsed.data as any });
  return NextResponse.json({ ok: true, guest });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  await prisma.guest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
