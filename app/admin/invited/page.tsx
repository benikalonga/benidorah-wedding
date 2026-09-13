'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/admin/ui/PageHeader';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/admin/ui/Table';
import Badge from '@/components/admin/ui/Badge';
import Card from '@/components/admin/ui/Card';
import EmptyState from '@/components/admin/ui/EmptyState';
import Skeleton from '@/components/admin/ui/Skeleton';
import { Input, Select } from '@/components/admin/ui/form';
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

type AttendingFilter = 'all' | 'responded' | 'yes' | 'one_only' | 'declined' | 'pending';

function isDeclined(status?: string) {
  return status === 'no' || status === 'none';
}

function isPending(g: GuestRow) {
  return !g.rsvp || g.rsvp.attending === 'pending';
}

function attendingTone(status?: string): 'green' | 'gold' | 'red' | 'neutral' {
  if (status === 'yes') return 'green';
  if (status === 'one_only') return 'gold';
  if (isDeclined(status)) return 'red';
  return 'neutral';
}

function attendingLabel(status?: string) {
  if (status === 'yes') return 'Attending';
  if (status === 'one_only') return 'One only';
  if (isDeclined(status)) return 'Declined';
  return 'Pending';
}

export default function InvitedPage() {
  return (
    <Suspense fallback={null}>
      <InvitedPageInner />
    </Suspense>
  );
}

function InvitedPageInner() {
  const searchParams = useSearchParams();
  const [guests, setGuests] = useState<GuestRow[] | null>(null);
  const [query, setQuery] = useState('');
  const [attendingFilter, setAttendingFilter] = useState<AttendingFilter>('all');
  const [openedFilter, setOpenedFilter] = useState<'all' | 'yes' | 'no'>('all');

  useEffect(() => {
    fetch('/api/admin/guests')
      .then((r) => r.json())
      .then((d) => setGuests(d.guests || []));
  }, []);

  // Deep-linked from the Dashboard — ?attending= and ?opened= preset the
  // matching filter dropdowns below.
  useEffect(() => {
    const attending = searchParams.get('attending');
    if (attending && ['responded', 'yes', 'one_only', 'declined', 'pending'].includes(attending)) {
      setAttendingFilter(attending as AttendingFilter);
    }
    const opened = searchParams.get('opened');
    if (opened === 'yes' || opened === 'no') setOpenedFilter(opened);
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (!guests) return [];
    const q = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (attendingFilter === 'responded' && isPending(g)) return false;
      if (attendingFilter === 'pending' && !isPending(g)) return false;
      if (attendingFilter === 'yes' && g.rsvp?.attending !== 'yes') return false;
      if (attendingFilter === 'one_only' && g.rsvp?.attending !== 'one_only') return false;
      if (attendingFilter === 'declined' && !isDeclined(g.rsvp?.attending)) return false;
      if (openedFilter === 'yes' && !g.linkOpenedAt) return false;
      if (openedFilter === 'no' && g.linkOpenedAt) return false;
      if (!q) return true;
      return g.fullName.toLowerCase().includes(q) || g.partnerName?.toLowerCase().includes(q);
    });
  }, [guests, query, attendingFilter, openedFilter]);

  const hasActiveFilter = !!query || attendingFilter !== 'all' || openedFilter !== 'all';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Invited & RSVP Tracking" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm sm:flex-1">
          <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <Input placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={attendingFilter}
            onChange={(e) => setAttendingFilter(e.target.value as AttendingFilter)}
            className="w-auto min-w-[9rem]"
          >
            <option value="all">All RSVP statuses</option>
            <option value="responded">RSVP&apos;d</option>
            <option value="yes">Attending (full)</option>
            <option value="one_only">One only</option>
            <option value="declined">Declined</option>
            <option value="pending">Pending</option>
          </Select>
          <Select
            value={openedFilter}
            onChange={(e) => setOpenedFilter(e.target.value as 'all' | 'yes' | 'no')}
            className="w-auto min-w-[8.5rem]"
          >
            <option value="all">Link opened or not</option>
            <option value="yes">Link opened</option>
            <option value="no">Link not opened</option>
          </Select>
        </div>
      </div>

      {guests === null ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div>
          <EmptyState
            icon={<IconMail width={40} height={40} />}
            title={hasActiveFilter ? 'No guests match your search/filters' : 'No guests match'}
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
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

          <div className="space-y-3 md:hidden">
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
