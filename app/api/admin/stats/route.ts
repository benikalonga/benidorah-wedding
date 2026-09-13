import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';

export async function GET() {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  // Every "guest count" below is a headcount, not a row count — a
  // `type: 'couple'` guest is one database row but two actual people, so
  // it's weighted as 2 everywhere a count is shown (total, per side, per
  // RSVP status, opened/present, table occupancy). Fetching the guests
  // once and reducing in JS keeps that weighting consistent in one place
  // instead of repeating it across a dozen separate `.count()` queries.
  const [guests, tables, gifts, momentsCount, ticketsCount] = await Promise.all([
    prisma.guest.findMany({
      select: {
        type: true,
        guestSide: true,
        tableId: true,
        linkOpenedAt: true,
        presentAt: true,
        rsvp: { select: { attending: true } },
      },
    }),
    prisma.table.findMany({ select: { id: true, tableNumber: true, capacity: true } }),
    prisma.giftItem.findMany({ select: { status: true, priceZar: true } }),
    prisma.moment.count(),
    prisma.ticket.count(),
  ]);

  const headcount = (g: { type: string }) => (g.type === 'couple' ? 2 : 1);

  let totalGuests = 0;
  let groomSide = 0;
  let brideSide = 0;
  let respondedCount = 0;
  let pendingCount = 0;
  let attendingYes = 0;
  let attendingOneOnly = 0;
  let attendingNone = 0;
  let openedCount = 0;
  let presentCount = 0;
  const occupancyByTable = new Map<string, number>();

  for (const g of guests) {
    const heads = headcount(g);
    totalGuests += heads;
    if (g.guestSide === 'groom') groomSide += heads;
    else brideSide += heads;

    occupancyByTable.set(g.tableId, (occupancyByTable.get(g.tableId) || 0) + heads);

    const attending = g.rsvp?.attending ?? 'pending';
    if (attending === 'pending') pendingCount += heads;
    else respondedCount += heads;
    if (attending === 'yes') attendingYes += heads;
    else if (attending === 'one_only') attendingOneOnly += heads;
    else if (attending === 'no' || attending === 'none') attendingNone += heads;

    if (g.linkOpenedAt) openedCount += heads;
    if (g.presentAt) presentCount += heads;
  }

  const tableOccupancy = tables.map((t) => ({
    tableNumber: t.tableNumber,
    capacity: t.capacity,
    occupied: occupancyByTable.get(t.id) || 0,
  }));

  const giftValuePledged = gifts
    .filter((g) => g.status !== 'available')
    .reduce((sum, g) => sum + Number(g.priceZar), 0);

  return NextResponse.json({
    guests: { total: totalGuests, groomSide, brideSide },
    rsvp: {
      responded: respondedCount,
      pending: pendingCount,
      attendingYes,
      attendingOneOnly,
      declined: attendingNone,
    },
    linkOpenRate: { opened: openedCount, total: totalGuests },
    tables: tableOccupancy,
    gifts: {
      available: gifts.filter((g) => g.status === 'available').length,
      booked: gifts.filter((g) => g.status === 'booked').length,
      paid: gifts.filter((g) => g.status === 'paid').length,
      totalValuePledgedZar: giftValuePledged,
    },
    moments: momentsCount,
    tickets: ticketsCount,
    presentGuests: presentCount,
  });
}
