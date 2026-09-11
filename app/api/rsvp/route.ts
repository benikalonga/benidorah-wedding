import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rsvpSchema, sanitizeText, randomWishColor } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { broadcast } from '@/lib/realtime';
import { z } from 'zod';

const bodySchema = rsvpSchema.extend({ guestId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`rsvp:${clientIp(req)}`, 8, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment and try again.' }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid RSVP data', details: parsed.error.flatten() }, { status: 400 });
  }

  const { guestId, attending, email, allergyComment, wishText, displayNameOnWall } = parsed.data;

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });

  const cleanWish = wishText ? sanitizeText(wishText) : null;
  const cleanComment = allergyComment ? sanitizeText(allergyComment) : null;

  const rsvp = await prisma.rsvp.upsert({
    where: { guestId },
    create: {
      guestId,
      attending,
      allergyComment: cleanComment,
      wishText: cleanWish,
      displayNameOnWall,
      submittedAt: new Date(),
    },
    update: {
      attending,
      allergyComment: cleanComment,
      wishText: cleanWish,
      displayNameOnWall,
      submittedAt: new Date(),
    },
  });

  if (email) {
    await prisma.guest.update({ where: { id: guestId }, data: { email } }).catch(() => null);
  }

  // A wish is only posted to the public Wish Wall when the guest opted in
  // and actually left a message.
  if (cleanWish && displayNameOnWall !== undefined) {
    const ticket = await prisma.ticket.upsert({
      where: { rsvpId: rsvp.id },
      create: {
        rsvpId: rsvp.id,
        displayName: displayNameOnWall ? guest.fullName : null,
        message: cleanWish,
        color: randomWishColor(),
        visible: true,
      },
      update: {
        displayName: displayNameOnWall ? guest.fullName : null,
        message: cleanWish,
      },
    });
    broadcast({ type: 'ticket:new', ticket });
  }

  return NextResponse.json({ ok: true, rsvp });
}
