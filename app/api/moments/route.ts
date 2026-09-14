import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { storeGuestUpload } from '@/lib/media';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { sanitizeText } from '@/lib/validation';
import { broadcast } from '@/lib/realtime';

export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get('page') || '1');
  const pageSize = 24;
  const moments = await prisma.moment.findMany({
    where: { visible: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return NextResponse.json({ moments });
}

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`moments:${clientIp(req)}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many uploads — please wait a moment.' }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  const uploaderNameRaw = String(formData?.get('uploaderName') || 'A guest');
  const userHashCode = String(formData?.get('userHashCode') || '');

  // Sharing a moment is an invited-guest privilege — the userHashCode is
  // the same capability token used for a guest's personal RSVP link
  // (see app/[hash]/page.tsx), never exposed anywhere on the public "/"
  // page, so only someone who actually opened their own invite link can
  // produce a valid one. Anonymous requests (no/garbage hash) never
  // reach storeGuestUpload at all.
  if (!userHashCode) {
    return NextResponse.json(
      { error: 'Only invited guests can share a moment — open your personal invite link to upload.' },
      { status: 401 }
    );
  }
  const guest = await prisma.guest.findUnique({ where: { userHashCode } });
  if (!guest) {
    return NextResponse.json(
      { error: 'Only invited guests can share a moment — open your personal invite link to upload.' },
      { status: 401 }
    );
  }

  // A second, per-guest limit on top of the per-IP one above — several
  // guests can legitimately share one IP (same venue Wi-Fi), but one
  // guest hash shouldn't be able to flood the feed just because the IP
  // limit resets across different guests.
  const { allowed: guestAllowed } = rateLimit(`moments:guest:${guest.id}`, 10, 60_000);
  if (!guestAllowed) {
    return NextResponse.json({ error: 'Too many uploads — please wait a moment.' }, { status: 429 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeGuestUpload(buffer, file.name);

    const moment = await prisma.moment.create({
      data: {
        guestId: guest.id,
        uploaderName: sanitizeText(uploaderNameRaw).slice(0, 100) || guest.fullName || 'A guest',
        mediaUrl: stored.url,
        mediaType: stored.mediaType,
        visible: true,
      },
    });

    broadcast({ type: 'moment:new', moment });
    return NextResponse.json({ ok: true, moment });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
