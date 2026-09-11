'use client';

import { useEffect, useState } from 'react';

interface TicketRow {
  id: string;
  displayName: string | null;
  message: string;
  color: string;
  visible: boolean;
  createdAt: string;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);

  // No dedicated admin GET /api/admin/tickets route was in the spec's
  // route map, but moderation needs a list — reuse the same guard pattern
  // via a tiny inline fetch against Prisma through a server action would
  // be cleaner; for consistency with the rest of the admin API surface,
  // list them through the public wishes the same way the wall does.
  async function load() {
    const data = await fetch('/api/admin/tickets/list').then((r) => (r.ok ? r.json() : { tickets: [] }));
    setTickets(data.tickets || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleVisible(id: string, visible: boolean) {
    await fetch(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !visible }),
    });
    load();
  }

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Wish Wall Tickets</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tickets.map((t) => (
          <div key={t.id} className="rounded-xl border border-onyx/10 p-4" style={{ backgroundColor: t.color }}>
            <p className="font-hand text-lg text-onyx/90">{t.message}</p>
            <p className="mt-2 text-xs font-semibold text-onyx/70">— {t.displayName || 'Anonymous'}</p>
            <button
              onClick={() => toggleVisible(t.id, t.visible)}
              className="mt-3 rounded-full bg-onyx/10 px-3 py-1 text-xs"
            >
              {t.visible ? 'Hide from wall' : 'Show on wall'}
            </button>
          </div>
        ))}
        {tickets.length === 0 && <p className="text-sm text-charcoal/50">No tickets yet.</p>}
      </div>
    </div>
  );
}
