import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import { sendWhatsAppInvite } from '@/lib/whatsapp';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const guest = await prisma.guest.findUnique({ where: { id: params.id } });
  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });

  const inviteUrl = `${process.env.SITE_URL || 'https://benidorah.com'}/${guest.userHashCode}`;

  const result = await sendWhatsAppInvite({
    toPhoneNumber: guest.phoneNumber,
    guestName: guest.fullName,
    inviteUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Failed to send invite' }, { status: 502 });
  }

  await prisma.guest.update({ where: { id: guest.id }, data: { inviteSentAt: new Date() } });

  return NextResponse.json({ ok: true, mocked: result.mocked, inviteUrl });
}
