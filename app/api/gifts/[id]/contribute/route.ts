import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { giftContributionSchema } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { allowed } = rateLimit(`gift-contribute:${clientIp(req)}`, 10, 60_000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = giftContributionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid contribution', details: parsed.error.flatten() }, { status: 400 });
  }

  const gift = await prisma.giftItem.findUnique({ where: { id: params.id } });
  if (!gift) return NextResponse.json({ error: 'Gift not found' }, { status: 404 });

  const body = json as { guestId?: string | null };

  const contribution = await prisma.giftContribution.create({
    data: {
      giftId: params.id,
      guestId: body.guestId || null,
      contributorName: parsed.data.contributorName || null,
      amountZar: parsed.data.amountZar,
      note: parsed.data.note || null,
    },
  });

  return NextResponse.json({ ok: true, contribution });
}
