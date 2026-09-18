import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import { guestInputSchema } from '@/lib/validation';
import { generateUniqueInviteCode } from '@/lib/inviteCode';

export async function GET() {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const guests = await prisma.guest.findMany({
    include: { table: true, rsvp: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ guests });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const json = await req.json().catch(() => null);
  const parsed = guestInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid guest data', details: parsed.error.flatten() }, { status: 400 });
  }

  // 8 chars of a URL-safe alphabet — a capability token, never derived
  // from the guest's name (see §8 of the brief).
  const userHashCode = nanoid(8);
  // A separate, human-typable 6-digit fallback for the "Enter the code you
  // received" box on the public RSVP section (see app/api/rsvp-code) — not
  // a capability token like userHashCode, just a lookup key.
  const inviteCode = await generateUniqueInviteCode();

  const guest = await prisma.guest.create({
    data: {
      ...parsed.data,
      partnerName: parsed.data.partnerName || null,
      email: parsed.data.email || null,
      userHashCode,
      inviteCode,
    },
  });

  return NextResponse.json({ ok: true, guest }, { status: 201 });
}
