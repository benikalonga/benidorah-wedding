import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import { tableInputSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const json = await req.json().catch(() => null);
  const parsed = tableInputSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid table data' }, { status: 400 });
  }

  const table = await prisma.table.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ ok: true, table });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const guestCount = await prisma.guest.count({ where: { tableId: params.id } });
  if (guestCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${guestCount} guest(s) are still assigned to this table.` },
      { status: 409 }
    );
  }

  await prisma.table.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
