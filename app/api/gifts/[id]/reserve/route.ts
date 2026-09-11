import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { broadcast } from '@/lib/realtime';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { allowed } = rateLimit(`gift-reserve:${clientIp(req)}`, 10, 60_000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const guestId: string | null = body?.guestId || null;

  // Atomic conditional update — first request wins the race, per the
  // "already claimed" requirement in the brief.
  const result = await prisma.giftItem.updateMany({
    where: { id: params.id, status: 'available' },
    data: { status: 'booked', bookedByGuestId: guestId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Already claimed' }, { status: 409 });
  }

  broadcast({ type: 'gift:updated', giftId: params.id });
  return NextResponse.json({ ok: true });
}
