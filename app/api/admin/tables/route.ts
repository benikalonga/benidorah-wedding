import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import { tableInputSchema } from '@/lib/validation';

export async function GET() {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const tables = await prisma.table.findMany({
    include: { guests: { select: { id: true, fullName: true } } },
    orderBy: { tableNumber: 'asc' },
  });
  return NextResponse.json({ tables });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const json = await req.json().catch(() => null);
  const parsed = tableInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid table data', details: parsed.error.flatten() }, { status: 400 });
  }

  const table = await prisma.table.create({ data: parsed.data });
  return NextResponse.json({ ok: true, table }, { status: 201 });
}
