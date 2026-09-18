'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { buildInvitationWaLink } from '@/lib/invitation';
import type { Locale } from '@/lib/i18n';
import PageHeader from '@/components/admin/ui/PageHeader';
import Button from '@/components/admin/ui/Button';
import WhatsAppSendButton from '@/components/admin/ui/WhatsAppSendButton';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/admin/ui/Table';
import Badge from '@/components/admin/ui/Badge';
import Card from '@/components/admin/ui/Card';
import EmptyState from '@/components/admin/ui/EmptyState';
import Skeleton from '@/components/admin/ui/Skeleton';
import { Input, Select } from '@/components/admin/ui/form';
import { IconMail, IconSearch, IconCheck } from '@/components/admin/ui/icons';

interface GuestRow {
  id: string;
  type: 'single' | 'couple';
  fullName: string;
  partnerName: string | null;
  phoneNumber: string;
  userHashCode: string;
  inviteCode: string;
  linkOpenedAt: string | null;
  inviteSentAt: string | null;
  presentAt: string | null;
  rsvp: {
    attending: string;
    allergyComment: string | null;
    wishText: string | null;
    submittedAt: string | null;
  } | null;
}

type AttendingFilter = 'all' | 'responded' | 'yes' | 'one_only' | 'declined' | 'pending';
type YesNoFilter = 'all' | 'yes' | 'no';

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
  const confirm = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [guests, setGuests] = useState<GuestRow[] | null>(null);
  const [query, setQuery] = useState('');
  const [attendingFilter, setAttendingFilter] = useState<AttendingFilter>('all');
  const [openedFilter, setOpenedFilter] = useState<YesNoFilter>('all');
  const [presentFilter, setPresentFilter] = useState<YesNoFilter>('all');

  function load() {
    return fetch('/api/admin/guests')
      .then((r) => r.json())
      .then((d) => setGuests(d.guests || []));
  }

  useEffect(() => {
    load();
  }, []);

  // Deep-linked from the Dashboard — ?attending= / ?opened= / ?present=
  // preset the matching filter dropdowns below.
  useEffect(() => {
    const attending = searchParams.get('attending');
    if (attending && ['responded', 'yes', 'one_only', 'declined', 'pending'].includes(attending)) {
      setAttendingFilter(attending as AttendingFilter);
    }
    const opened = searchParams.get('opened');
    if (opened === 'yes' || opened === 'no') setOpenedFilter(opened);
    const present = searchParams.get('present');
    if (present === 'yes' || present === 'no') setPresentFilter(present);
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
      if (presentFilter === 'yes' && !g.presentAt) return false;
      if (presentFilter === 'no' && g.presentAt) return false;
      if (!q) return true;
      return g.fullName.toLowerCase().includes(q) || g.partnerName?.toLowerCase().includes(q);
    });
  }, [guests, query, attendingFilter, openedFilter, presentFilter]);

  const hasActiveFilter = !!query || attendingFilter !== 'all' || openedFilter !== 'all' || presentFilter !== 'all';

  // Headcount stats for the whole list (unaffected by the filters above) —
  // a couple is one guest row but two people, so it counts as 2 here, same
  // as everywhere else guest counts are shown.
  const stats = useMemo(() => {
    if (!guests) return null;
    let total = 0;
    let responded = 0;
    for (const g of guests) {
      const heads = g.type === 'couple' ? 2 : 1;
      total += heads;
      if (!isPending(g)) responded += heads;
    }
    return { total, responded, pending: total - responded };
  }, [guests]);

  function resetFilters() {
    setQuery('');
    setAttendingFilter('all');
    setOpenedFilter('all');
    setPresentFilter('all');
    router.replace(pathname);
  }

  async function handleResend(g: GuestRow, locale: Locale) {
    // Same as the Guests page's "Send Invitation" button — a plain wa.me
    // "click to chat" link (with the guest's personal /<hash>/<locale> RSVP
    // link pre-filled), opened for the admin to review and send personally.
    // We still record the click below as "invite sent" — there's no
    // delivery receipt from wa.me, so this marks that the admin sent it,
    // not that WhatsApp delivered it.
    window.open(buildInvitationWaLink(g, locale), '_blank', 'noopener,noreferrer');
    const res = await fetch(`/api/admin/guests/${g.id}/save-the-date`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent: true }),
    });
    if (!res.ok) {
      toast.error("Opened WhatsApp, but couldn't record it as sent");
      return;
    }
    load();
  }

  async function setPresent(g: GuestRow, present: boolean) {
    const name = g.fullName + (g.partnerName ? ` & ${g.partnerName}` : '');
    const ok = await confirm(
      present
        ? { title: 'Mark as present?', description: `${name} will be marked as checked in at the event.`, confirmLabel: 'Mark present' }
        : {
            title: 'Clear present status?',
            description: `${name} will no longer be marked as present — use this if it was marked by mistake.`,
            confirmLabel: 'Clear',
            danger: true,
          }
    );
    if (!ok) return;

    const res = await fetch(`/api/admin/guests/${g.id}/present`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ present }),
    });
    if (!res.ok) {
      toast.error('Could not update present status');
      return;
    }
    toast.success(present ? `${name} marked present` : 'Present status cleared');
    load();
  }

  function GuestActions({ g }: { g: GuestRow }) {
    return (
      <div className="flex flex-nowrap items-center gap-1.5">
        <WhatsAppSendButton label="Resend" onSend={(locale) => handleResend(g, locale)} />
        {g.presentAt ? (
          <button
            type="button"
            onClick={() => setPresent(g, false)}
            title="Click to clear — e.g. if this was a mistake"
            className="inline-flex items-center gap-1 rounded-full bg-green-600/10 px-2.5 py-1 text-[11px] font-medium text-green-700 transition-colors hover:bg-green-600/20"
          >
            <IconCheck width={12} height={12} />
            Present
          </button>
        ) : (
          <Button variant="outline" size="sm" icon={<IconCheck width={14} height={14} />} onClick={() => setPresent(g, true)}>
            Present
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invited & RSVP Tracking"
        meta={
          stats && (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-charcoal/55">
              <span>
                <span className="font-semibold text-onyx">{stats.total}</span> total
              </span>
              <span className="text-charcoal/30">·</span>
              <span>
                <span className="font-semibold text-onyx">{stats.responded}</span> RSVP&apos;d
              </span>
              <span className="text-charcoal/30">·</span>
              <span>
                <span className="font-semibold text-onyx">{stats.pending}</span> pending
              </span>
            </div>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm sm:flex-1">
          <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <Input placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onChange={(e) => setOpenedFilter(e.target.value as YesNoFilter)}
            className="w-auto min-w-[8.5rem]"
          >
            <option value="all">Link opened or not</option>
            <option value="yes">Link opened</option>
            <option value="no">Link not opened</option>
          </Select>
          <Select
            value={presentFilter}
            onChange={(e) => setPresentFilter(e.target.value as YesNoFilter)}
            className="w-auto min-w-[8.5rem]"
          >
            <option value="all">Present or not</option>
            <option value="yes">Present</option>
            <option value="no">Not present</option>
          </Select>
          <Button variant="ghost" size="sm" disabled={!hasActiveFilter} onClick={resetFilters}>
            Clear filters
          </Button>
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
                  <Th className="min-w-[12rem]">Guest</Th>
                  <Th>Invitation sent</Th>
                  <Th>Link opened</Th>
                  <Th>RSVP status</Th>
                  <Th>Allergy / comment</Th>
                  <Th>Wish</Th>
                  <Th>Submitted</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((g) => (
                  <Tr key={g.id}>
                    <Td className="min-w-[12rem] font-medium">
                      {g.fullName}
                      {g.partnerName ? ` & ${g.partnerName}` : ''}
                    </Td>
                    <Td>
                      {g.inviteSentAt ? (
                        <Badge tone="green">{new Date(g.inviteSentAt).toLocaleDateString()}</Badge>
                      ) : (
                        <span className="text-charcoal/35">—</span>
                      )}
                    </Td>
                    <Td>{g.linkOpenedAt ? <Badge tone="green">Opened</Badge> : <Badge tone="neutral">Not yet</Badge>}</Td>
                    <Td>
                      <Badge tone={attendingTone(g.rsvp?.attending)}>{attendingLabel(g.rsvp?.attending)}</Badge>
                    </Td>
                    <Td className="max-w-[8rem] truncate text-charcoal/70" title={g.rsvp?.allergyComment || undefined}>
                      {g.rsvp?.allergyComment || '—'}
                    </Td>
                    <Td className="max-w-[8rem] truncate text-charcoal/70" title={g.rsvp?.wishText || undefined}>
                      {g.rsvp?.wishText || '—'}
                    </Td>
                    <Td className="whitespace-nowrap text-charcoal/70">
                      {g.rsvp?.submittedAt ? new Date(g.rsvp.submittedAt).toLocaleDateString() : '—'}
                    </Td>
                    <Td>
                      <GuestActions g={g} />
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
                  {g.inviteSentAt && (
                    <Badge tone="green">Invitation sent {new Date(g.inviteSentAt).toLocaleDateString()}</Badge>
                  )}
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
                <div className="mt-3 border-t border-onyx/10 pt-3">
                  <GuestActions g={g} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
