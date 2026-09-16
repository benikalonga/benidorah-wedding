import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { activityLogSchema } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rateLimit';

// Public, fire-and-forget activity tracking — called from the browser on
// page view and on a broad set of clicks/opens across the public site (see
// components/ActivityLogProvider.tsx). Deliberately never returns an error
// status the client would need to handle beyond ignoring it: a dropped log
// entry must never be something a visitor notices or that breaks their
// actual action. Wrapped in one top-level try/catch for the same reason —
// any unexpected failure here (a DB hiccup, a malformed body) degrades to
// "this one visit wasn't logged," never to a user-facing error.
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    // Generous limit — a single page load can fire a handful of these in
    // quick succession (page view + a few immediate clicks), and this is
    // the one endpoint on the site every single visitor hits repeatedly.
    const { allowed } = rateLimit(`log:${ip}`, 120, 60_000);
    if (!allowed) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const json = await req.json().catch(() => null);
    const parsed = activityLogSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { guestId, action, path, metadata } = parsed.data;

    // Resolved server-side from the id rather than trusting a client-supplied
    // name — a visitor's own browser could otherwise report any name it
    // likes. Snapshotted onto the log row itself (guestName) so the entry
    // still reads sensibly even if the guest is later renamed or removed.
    let guestName: string | null = null;
    if (guestId) {
      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        select: { fullName: true },
      });
      guestName = guest?.fullName ?? null;
    }

    await prisma.activityLog.create({
      data: {
        guestId: guestId ?? null,
        guestName,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || null,
        action,
        path: path ?? null,
        metadata: metadata ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
