import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';

export async function GET() {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const moments = await prisma.moment.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ moments });
}
