'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/admin/ui/Card';
import Skeleton from '@/components/admin/ui/Skeleton';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/admin/ui/Table';
import Badge from '@/components/admin/ui/Badge';

interface Stats {
  guests: { total: number; groomSide: number; brideSide: number };
  rsvp: { responded: number; pending: number; attendingYes: number; attendingOneOnly: number; declined: number };
  linkOpenRate: { opened: number; total: number };
  tables: { tableNumber: number; capacity: number; occupied: number }[];
  gifts: { available: number; booked: number; paid: number; totalValuePledgedZar: number };
  moments: number;
  tickets: number;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-charcoal/50">{label}</p>
      <p className="section-title mt-1.5 text-2xl text-onyx">{value}</p>
    </Card>
  );
}

function StatGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-charcoal/45">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>
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
    <div>
      <h1 className="section-title text-2xl text-onyx">Dashboard</h1>

      {!stats ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <>
          <StatGroup title="Guests">
            <StatCard label="Total guests" value={stats.guests.total} />
            <StatCard label="Groom's side" value={stats.guests.groomSide} />
            <StatCard label="Bride's side" value={stats.guests.brideSide} />
            <StatCard label="Link open rate" value={`${stats.linkOpenRate.opened} / ${stats.linkOpenRate.total}`} />
          </StatGroup>

          <StatGroup title="RSVPs">
            <StatCard label="RSVP'd" value={stats.rsvp.responded} />
            <StatCard label="Attending (full)" value={stats.rsvp.attendingYes} />
            <StatCard label="One only" value={stats.rsvp.attendingOneOnly} />
            <StatCard label="Declined" value={stats.rsvp.declined} />
          </StatGroup>

          <StatGroup title="Gifts">
            <StatCard label="Available" value={stats.gifts.available} />
            <StatCard label="Booked" value={stats.gifts.booked} />
            <StatCard label="Paid" value={stats.gifts.paid} />
            <StatCard label="Value pledged (ZAR)" value={`R${stats.gifts.totalValuePledgedZar.toLocaleString('en-ZA')}`} />
          </StatGroup>

          <StatGroup title="Content">
            <StatCard label="Moments uploaded" value={stats.moments} />
            <StatCard label="Wish wall tickets" value={stats.tickets} />
            <StatCard label="Pending RSVPs" value={stats.rsvp.pending} />
          </StatGroup>

          <section className="mt-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-charcoal/45">Table occupancy</h2>
            <Table>
              <Thead>
                <Tr>
                  <Th>Table</Th>
                  <Th>Occupied</Th>
                  <Th>Capacity</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stats.tables.map((t) => {
                  const full = t.occupied >= t.capacity;
                  return (
                    <Tr key={t.tableNumber}>
                      <Td className="font-medium">Table {t.tableNumber}</Td>
                      <Td>{t.occupied}</Td>
                      <Td>
                        <Badge tone={full ? 'gold' : 'neutral'}>{t.capacity} seats</Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </section>
        </>
      )}
    </div>
  );
}
