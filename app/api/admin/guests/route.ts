import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import { guestInputSchema } from '@/lib/validation';

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

  // 10 chars of a URL-safe alphabet — a capability token, never derived
  // from the guest's name (see §8 of the brief).
  const userHashCode = nanoid(10);

  const guest = await prisma.guest.create({
    data: { ...parsed.data, partnerName: parsed.data.partnerName || null, email: parsed.data.email || null, userHashCode },
  });

  return NextResponse.json({ ok: true, guest }, { status: 201 });
}
