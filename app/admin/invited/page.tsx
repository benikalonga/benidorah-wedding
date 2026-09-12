'use client';

import { useEffect, useMemo, useState } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/admin/ui/Table';
import Badge from '@/components/admin/ui/Badge';
import Card from '@/components/admin/ui/Card';
import EmptyState from '@/components/admin/ui/EmptyState';
import Skeleton from '@/components/admin/ui/Skeleton';
import { Input } from '@/components/admin/ui/form';
import { IconMail, IconSearch } from '@/components/admin/ui/icons';

interface GuestRow {
  id: string;
  fullName: string;
  partnerName: string | null;
  userHashCode: string;
  linkOpenedAt: string | null;
  rsvp: {
    attending: string;
    allergyComment: string | null;
    wishText: string | null;
    submittedAt: string | null;
  } | null;
}

function attendingTone(status?: string): 'green' | 'gold' | 'red' | 'neutral' {
  if (status === 'yes') return 'green';
  if (status === 'one_only') return 'gold';
  if (status === 'none') return 'red';
  return 'neutral';
}

function attendingLabel(status?: string) {
  if (status === 'yes') return 'Attending';
  if (status === 'one_only') return 'One only';
  if (status === 'none') return 'Declined';
  return 'Pending';
}

export default function InvitedPage() {
  const [guests, setGuests] = useState<GuestRow[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/admin/guests')
      .then((r) => r.json())
      .then((d) => setGuests(d.guests || []));
  }, []);

  const filtered = useMemo(() => {
    if (!guests) return [];
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => g.fullName.toLowerCase().includes(q) || g.partnerName?.toLowerCase().includes(q));
  }, [guests, query]);

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Invited &amp; RSVP Tracking</h1>

      <div className="relative mt-4 max-w-sm">
        <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
        <Input placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      {guests === null ? (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<IconMail width={40} height={40} />} title="No guests match" />
        </div>
      ) : (
        <>
          <div className="mt-6 hidden md:block">
            <Table>
              <Thead>
                <Tr>
                  <Th>Guest</Th>
                  <Th>Link opened</Th>
                  <Th>RSVP status</Th>
                  <Th>Allergy / comment</Th>
                  <Th>Wish</Th>
                  <Th>Submitted</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((g) => (
                  <Tr key={g.id}>
                    <Td className="font-medium">
                      {g.fullName}
                      {g.partnerName ? ` & ${g.partnerName}` : ''}
                    </Td>
                    <Td>{g.linkOpenedAt ? <Badge tone="green">Opened</Badge> : <Badge tone="neutral">Not yet</Badge>}</Td>
                    <Td>
                      <Badge tone={attendingTone(g.rsvp?.attending)}>{attendingLabel(g.rsvp?.attending)}</Badge>
                    </Td>
                    <Td className="max-w-[16rem] truncate text-charcoal/70">{g.rsvp?.allergyComment || '—'}</Td>
                    <Td className="max-w-xs truncate text-charcoal/70">{g.rsvp?.wishText || '—'}</Td>
                    <Td className="whitespace-nowrap text-charcoal/70">
                      {g.rsvp?.submittedAt ? new Date(g.rsvp.submittedAt).toLocaleString() : '—'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {filtered.map((g) => (
              <Card key={g.id} padded={false} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-onyx">
                    {g.fullName}
                    {g.partnerName ? ` & ${g.partnerName}` : ''}
                  </p>
                  <Badge tone={attendingTone(g.rsvp?.attending)}>{attendingLabel(g.rsvp?.attending)}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {g.linkOpenedAt ? <Badge tone="green">Link opened</Badge> : <Badge tone="neutral">Link not opened</Badge>}
                </div>
                {g.rsvp?.allergyComment && (
                  <p className="mt-2 text-xs text-charcoal/60">
                    <span className="font-medium text-charcoal/70">Allergy/comment:</span> {g.rsvp.allergyComment}
                  </p>
                )}
                {g.rsvp?.wishText && (
                  <p className="mt-1 text-xs text-charcoal/60">
                    <span className="font-medium text-charcoal/70">Wish:</span> {g.rsvp.wishText}
                  </p>
                )}
                {g.rsvp?.submittedAt && (
                  <p className="mt-2 text-[11px] text-charcoal/40">
                    Submitted {new Date(g.rsvp.submittedAt).toLocaleString()}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
