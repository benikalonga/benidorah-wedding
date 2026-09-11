import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/adminGuard';

export async function GET() {
  const session = await requireAdmin();
  if (!isSession(session)) return session;

  const [
    totalGuests,
    respondedCount,
    attendingYes,
    attendingOneOnly,
    attendingNone,
    pendingCount,
    groomSide,
    brideSide,
    tables,
    guestsByTable,
    gifts,
    momentsCount,
    ticketsCount,
    openedCount,
  ] = await Promise.all([
    prisma.guest.count(),
    prisma.rsvp.count({ where: { attending: { not: 'pending' } } }),
    prisma.rsvp.count({ where: { attending: 'yes' } }),
    prisma.rsvp.count({ where: { attending: 'one_only' } }),
    prisma.rsvp.count({ where: { attending: { in: ['no', 'none'] } } }),
    prisma.guest.count({ where: { OR: [{ rsvp: null }, { rsvp: { attending: 'pending' } }] } }),
    prisma.guest.count({ where: { guestSide: 'groom' } }),
    prisma.guest.count({ where: { guestSide: 'bride' } }),
    prisma.table.findMany({ select: { id: true, tableNumber: true, capacity: true } }),
    prisma.guest.groupBy({ by: ['tableId'], _count: { id: true } }),
    prisma.giftItem.findMany({ select: { status: true, priceZar: true } }),
    prisma.moment.count(),
    prisma.ticket.count(),
    prisma.guest.count({ where: { linkOpenedAt: { not: null } } }),
  ]);

  const occupancyByTable = new Map(guestsByTable.map((g) => [g.tableId, g._count.id]));
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
  });
}
