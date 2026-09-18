import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rsvpCodeSchema } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rateLimit';

// Public lookup for the "Enter the code you received" fallback on the
// RSVP section (components/RSVPForm.tsx), for a guest who landed on the
// generic site instead of their personal /<hash> link. Only ever returns
// the hash for an exact code match — a 6-digit space is brute-forceable
// given enough attempts, so this is rate-limited fairly tightly per IP.
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const { allowed } = rateLimit(`rsvp-code:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts — please wait a moment.' }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = rsvpCodeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { inviteCode: parsed.data.code },
    select: { userHashCode: true },
  });
  if (!guest) {
    return NextResponse.json({ error: "That code doesn't match any invitation." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, hash: guest.userHashCode });
}
