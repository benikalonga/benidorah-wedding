import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';

// Unlike the public rsvpSchema (lib/validation.ts), this also allows
// 'pending' — an admin needs to be able to reset a status back to
// unanswered, which a guest can never submit themselves.
const attendingSchema = z.object({ attending: z.enum(['yes', 'no', 'one_only', 'none', 'pending']) });

/** Lets an admin set/override a guest's RSVP status directly — e.g. for a phone-in RSVP or correcting a mistake. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const json = await req.json().catch(() => null);
  const parsed = attendingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid attending status' }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { id: params.id } });
  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });

  // 'pending' means "hasn't responded" — stamping a submittedAt for it
  // would show a "Submitted" date next to a status that says otherwise.
  const submittedAt = parsed.data.attending === 'pending' ? null : new Date();

  const rsvp = await prisma.rsvp.upsert({
    where: { guestId: params.id },
    create: { guestId: params.id, attending: parsed.data.attending, submittedAt },
    update: { attending: parsed.data.attending, submittedAt },
  });

  return NextResponse.json({ ok: true, rsvp });
}
