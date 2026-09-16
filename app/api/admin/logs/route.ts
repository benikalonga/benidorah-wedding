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
  const grouped = searchParams.get('group') === 'ip';

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

  if (grouped) {
    // Distinct IPs are far fewer than raw log rows (bounded by visitor
    // count, not action count), so grouping everything in memory and
    // paging the groups is cheap — no need for a windowed SQL query.
    const allGroups = await prisma.activityLog.groupBy({
      by: ['ipAddress'],
      where,
      _count: { _all: true },
      _max: { createdAt: true },
      _min: { createdAt: true },
    });
    allGroups.sort((a, b) => (b._max.createdAt?.getTime() ?? 0) - (a._max.createdAt?.getTime() ?? 0));

    const total = allGroups.length;
    const pageGroups = allGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const ips = pageGroups.map((g) => g.ipAddress).filter((ip): ip is string => ip !== null);

    // One row per IP with its most recent guest name — an IP can outlive
    // the guest who last used it (shared wifi, a returning unknown visitor),
    // so this is a best-effort "who was this most recently" label, not a
    // guarantee every action in the group belongs to that guest.
    const latest = ips.length
      ? await prisma.activityLog.findMany({
          where: { ipAddress: { in: ips } },
          orderBy: { createdAt: 'desc' },
          distinct: ['ipAddress'],
          select: { ipAddress: true, guestName: true, guestId: true },
        })
      : [];
    const latestByIp = new Map(latest.map((l) => [l.ipAddress, l]));

    const actions = await prisma.activityLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    });

    return NextResponse.json({
      grouped: true,
      groups: pageGroups.map((g) => ({
        ipAddress: g.ipAddress,
        guestName: latestByIp.get(g.ipAddress ?? '')?.guestName ?? null,
        guestId: latestByIp.get(g.ipAddress ?? '')?.guestId ?? null,
        count: g._count._all,
        firstSeen: g._min.createdAt,
        lastSeen: g._max.createdAt,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      actions: actions.map((a) => a.action),
    });
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
    grouped: false,
    logs,
    total,
    page,
    pageSize: PAGE_SIZE,
    actions: actions.map((a) => a.action),
  });
}
