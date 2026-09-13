'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/admin/ui/PageHeader';
import Card from '@/components/admin/ui/Card';
import Skeleton from '@/components/admin/ui/Skeleton';
import { DonutChart, SimpleBarChart } from '@/components/admin/ui/charts';
import { IconChevronLeft } from '@/components/admin/ui/icons';

interface Stats {
  guests: { total: number; groomSide: number; brideSide: number };
  rsvp: { responded: number; pending: number; attendingYes: number; attendingOneOnly: number; declined: number };
  linkOpenRate: { opened: number; total: number };
  tables: { tableNumber: number; capacity: number; occupied: number }[];
  gifts: { available: number; booked: number; paid: number; totalValuePledgedZar: number };
  moments: number;
  tickets: number;
  presentGuests: number;
}

// Brand palette, reused across every chart on this page so slice/bar
// colors always mean the same thing as the badges elsewhere in the admin.
const COLOR = {
  blue: '#1B3FA0',
  gold: '#B08D3F',
  green: '#16A34A',
  red: '#DC2626',
  stone: '#8A8579',
};

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-charcoal/50">{label}</p>
        <p className="section-title mt-1.5 text-2xl text-onyx">{value}</p>
      </div>
      {href && (
        <IconChevronLeft
          width={14}
          height={14}
          className="mt-1 shrink-0 rotate-180 text-charcoal/25 transition-colors group-hover:text-champagne-gold"
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-2xl border border-onyx/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-champagne-gold/40 hover:shadow-md"
      >
        {inner}
      </Link>
    );
  }
  return <Card className="p-5">{inner}</Card>;
}

function StatGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-charcoal/45">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>
    </section>
  );
}

/** A stat group's cards on the left, a chart illustrating the same data on the right. */
function ChartRow({ title, cards, chart }: { title: string; cards: ReactNode; chart: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-charcoal/45">{title}</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-2">{cards}</div>
        <Card className="p-5">{chart}</Card>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" subtitle="Click any figure or chart to jump to the filtered list behind it." />

      {!stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <>
          <ChartRow
            title="Guests"
            cards={
              <>
                <StatCard label="Total guests" value={stats.guests.total} href="/admin/guests" />
                <StatCard label="Groom's side" value={stats.guests.groomSide} href="/admin/guests?side=groom" />
                <StatCard label="Bride's side" value={stats.guests.brideSide} href="/admin/guests?side=bride" />
                <StatCard
                  label="Link open rate"
                  value={`${stats.linkOpenRate.opened} / ${stats.linkOpenRate.total}`}
                  href="/admin/invited?opened=yes"
                />
              </>
            }
            chart={
              <DonutChart
                centerLabel="guests"
                data={[
                  { name: "Groom's side", value: stats.guests.groomSide, color: COLOR.blue, href: '/admin/guests?side=groom' },
                  { name: "Bride's side", value: stats.guests.brideSide, color: COLOR.gold, href: '/admin/guests?side=bride' },
                ]}
              />
            }
          />

          <ChartRow
            title="RSVPs"
            cards={
              <>
                <StatCard label="RSVP'd" value={stats.rsvp.responded} href="/admin/invited?attending=responded" />
                <StatCard label="Attending (full)" value={stats.rsvp.attendingYes} href="/admin/invited?attending=yes" />
                <StatCard label="One only" value={stats.rsvp.attendingOneOnly} href="/admin/invited?attending=one_only" />
                <StatCard label="Declined" value={stats.rsvp.declined} href="/admin/invited?attending=declined" />
                <StatCard label="Present guests" value={stats.presentGuests} href="/admin/invited?present=yes" />
              </>
            }
            chart={
              <DonutChart
                centerLabel="invited"
                data={[
                  { name: 'Attending', value: stats.rsvp.attendingYes, color: COLOR.green, href: '/admin/invited?attending=yes' },
                  { name: 'One only', value: stats.rsvp.attendingOneOnly, color: COLOR.gold, href: '/admin/invited?attending=one_only' },
                  { name: 'Declined', value: stats.rsvp.declined, color: COLOR.red, href: '/admin/invited?attending=declined' },
                  { name: 'Pending', value: stats.rsvp.pending, color: COLOR.stone, href: '/admin/invited?attending=pending' },
                ]}
              />
            }
          />

          <ChartRow
            title="Gifts"
            cards={
              <>
                <StatCard label="Available" value={stats.gifts.available} />
                <StatCard label="Booked" value={stats.gifts.booked} />
                <StatCard label="Paid" value={stats.gifts.paid} />
                <StatCard label="Value pledged (ZAR)" value={`R${stats.gifts.totalValuePledgedZar.toLocaleString('en-ZA')}`} />
              </>
            }
            chart={
              <SimpleBarChart
                color={COLOR.blue}
                data={[
                  { name: 'Available', value: stats.gifts.available },
                  { name: 'Booked', value: stats.gifts.booked },
                  { name: 'Paid', value: stats.gifts.paid },
                ]}
              />
            }
          />

          <StatGroup title="Content">
            <StatCard label="Moments uploaded" value={stats.moments} href="/admin/moments" />
            <StatCard label="Wish wall tickets" value={stats.tickets} href="/admin/tickets" />
            <StatCard label="Pending RSVPs" value={stats.rsvp.pending} href="/admin/invited?attending=pending" />
          </StatGroup>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-charcoal/45">Table occupancy</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {[...stats.tables]
                .sort((a, b) => a.tableNumber - b.tableNumber)
                .map((t) => {
                  const pct = t.capacity > 0 ? Math.min(100, Math.round((t.occupied / t.capacity) * 100)) : 0;
                  const full = t.occupied >= t.capacity;
                  return (
                    <Link
                      key={t.tableNumber}
                      href={`/admin/tables?highlight=${t.tableNumber}`}
                      className="group flex items-center gap-3 rounded-xl border border-onyx/10 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-champagne-gold/40 hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-onyx">Table {t.tableNumber}</span>
                          <span className="shrink-0 text-xs text-charcoal/50">
                            {t.occupied} / {t.capacity}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-onyx/[0.06]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: full ? COLOR.gold : COLOR.blue }}
                          />
                        </div>
                      </div>
                      <IconChevronLeft
                        width={14}
                        height={14}
                        className="shrink-0 rotate-180 text-charcoal/25 transition-colors group-hover:text-champagne-gold"
                      />
                    </Link>
                  );
                })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
