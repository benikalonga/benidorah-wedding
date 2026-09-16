import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';
import type { Prisma } from '@prisma/client';

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const action = searchParams.get('action')?.trim() || undefined;
  const q = searchParams.get('q')?.trim() || undefined;

  const where: Prisma.ActivityLogWhereInput = {};
  if (action) where.action = action;
  if (q) {
    where.OR = [
      { guestName: { contains: q, mode: 'insensitive' } },
      { ipAddress: { contains: q } },
      { action: { contains: q, mode: 'insensitive' } },
      { path: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [logs, total, actions] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where }),
    // Distinct action names for the filter dropdown — cheap enough (one
    // extra indexed scan) and keeps the filter list in sync with whatever
    // actions have actually ever been logged, no hardcoded list to update.
    prisma.activityLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pageSize: PAGE_SIZE,
    actions: actions.map((a) => a.action),
  });
}
