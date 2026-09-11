import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import { broadcast } from '@/lib/realtime';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const { visible } = await req.json().catch(() => ({ visible: true }));
  const ticket = await prisma.ticket.update({ where: { id: params.id }, data: { visible: Boolean(visible) } });

  if (!ticket.visible) broadcast({ type: 'ticket:hidden', ticketId: ticket.id });
  return NextResponse.json({ ok: true, ticket });
}
