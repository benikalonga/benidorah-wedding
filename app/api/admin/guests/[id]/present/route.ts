import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';

const presentSchema = z.object({ present: z.boolean() });

/** Marks (or clears) a guest as physically checked in at the event — separate from their RSVP intent. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const json = await req.json().catch(() => null);
  const parsed = presentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { id: params.id } });
  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });

  const updated = await prisma.guest.update({
    where: { id: params.id },
    data: { presentAt: parsed.data.present ? new Date() : null },
  });

  return NextResponse.json({ ok: true, presentAt: updated.presentAt });
}
