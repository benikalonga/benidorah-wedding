'use client';

import { useEffect, useState } from 'react';

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
    <div className="rounded-2xl border border-onyx/10 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-charcoal/50">{label}</p>
      <p className="section-title mt-1 text-2xl text-onyx">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <p className="text-sm text-charcoal/60">Loading dashboard…</p>;

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total guests" value={stats.guests.total} />
        <StatCard label="Groom's side" value={stats.guests.groomSide} />
        <StatCard label="Bride's side" value={stats.guests.brideSide} />
        <StatCard label="Link open rate" value={`${stats.linkOpenRate.opened} / ${stats.linkOpenRate.total}`} />

        <StatCard label="RSVP'd" value={stats.rsvp.responded} />
        <StatCard label="Attending (full)" value={stats.rsvp.attendingYes} />
        <StatCard label="One only" value={stats.rsvp.attendingOneOnly} />
        <StatCard label="Declined" value={stats.rsvp.declined} />
        <StatCard label="Pending" value={stats.rsvp.pending} />

        <StatCard label="Gifts available" value={stats.gifts.available} />
        <StatCard label="Gifts booked" value={stats.gifts.booked} />
        <StatCard label="Gifts paid" value={stats.gifts.paid} />
        <StatCard label="Value pledged (ZAR)" value={`R${stats.gifts.totalValuePledgedZar.toLocaleString('en-ZA')}`} />

        <StatCard label="Moments uploaded" value={stats.moments} />
        <StatCard label="Wish wall tickets" value={stats.tickets} />
      </div>

      <h2 className="section-title mt-8 text-lg text-onyx">Table occupancy</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-onyx/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-ivory text-xs uppercase text-charcoal/50">
            <tr>
              <th className="px-4 py-2">Table</th>
              <th className="px-4 py-2">Occupied</th>
              <th className="px-4 py-2">Capacity</th>
            </tr>
          </thead>
          <tbody>
            {stats.tables.map((t) => (
              <tr key={t.tableNumber} className="border-t border-onyx/5">
                <td className="px-4 py-2">Table {t.tableNumber}</td>
                <td className="px-4 py-2">{t.occupied}</td>
                <td className="px-4 py-2">{t.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
