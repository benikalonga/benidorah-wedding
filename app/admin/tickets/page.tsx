'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/admin/ui/Button';
import Badge from '@/components/admin/ui/Badge';
import Card from '@/components/admin/ui/Card';
import EmptyState from '@/components/admin/ui/EmptyState';
import Skeleton from '@/components/admin/ui/Skeleton';
import { IconTicket } from '@/components/admin/ui/icons';

interface TicketRow {
  id: string;
  displayName: string | null;
  message: string;
  color: string;
  visible: boolean;
  createdAt: string;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);

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

      {tickets === null ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<IconTicket width={40} height={40} />} title="No wishes on the wall yet" />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => (
            <Card key={t.id} className="relative">
              <div className="absolute right-4 top-4">
                <Badge tone={t.visible ? 'green' : 'neutral'}>{t.visible ? 'Visible' : 'Hidden'}</Badge>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: t.color }}>
                <p className="font-hand text-lg leading-tight text-black">{t.message}</p>
                <p className="mt-2 text-right text-xs font-semibold text-black/70">— {t.displayName || 'Anonymous'}</p>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toggleVisible(t.id, t.visible)}>
                {t.visible ? 'Hide from wall' : 'Show on wall'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
