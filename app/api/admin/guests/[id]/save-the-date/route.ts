import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';

const saveTheDateSchema = z.object({ sent: z.boolean() });

/**
 * Records (or clears) when the save-the-date / resend wa.me message was
 * triggered for a guest — set from the Guests and Invited/RSVPs pages right
 * after the wa.me link opens. There's no delivery receipt from wa.me itself,
 * so this is "the admin clicked send", not confirmation WhatsApp delivered
 * it — same honest caveat as the rest of the wa.me flow.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const json = await req.json().catch(() => null);
  const parsed = saveTheDateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { id: params.id } });
  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });

  const updated = await prisma.guest.update({
    where: { id: params.id },
    data: { inviteSentAt: parsed.data.sent ? new Date() : null },
  });

  return NextResponse.json({ ok: true, inviteSentAt: updated.inviteSentAt });
}
