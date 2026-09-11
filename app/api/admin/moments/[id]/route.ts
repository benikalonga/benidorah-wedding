import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import { broadcast } from '@/lib/realtime';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const { visible } = await req.json().catch(() => ({ visible: true }));
  const moment = await prisma.moment.update({ where: { id: params.id }, data: { visible: Boolean(visible) } });

  if (!moment.visible) broadcast({ type: 'moment:hidden', momentId: moment.id });
  return NextResponse.json({ ok: true, moment });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  await prisma.moment.delete({ where: { id: params.id } });
  broadcast({ type: 'moment:hidden', momentId: params.id });
  return NextResponse.json({ ok: true });
}
