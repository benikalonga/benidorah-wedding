'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildSaveTheDateWaLink } from '@/lib/save-the-date';
import Button from '@/components/admin/ui/Button';
import Dialog from '@/components/admin/ui/Dialog';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import DropdownMenu from '@/components/admin/ui/DropdownMenu';
import { Field, Input, Select } from '@/components/admin/ui/form';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/admin/ui/Table';
import Badge from '@/components/admin/ui/Badge';
import Card from '@/components/admin/ui/Card';
import EmptyState from '@/components/admin/ui/EmptyState';
import Skeleton from '@/components/admin/ui/Skeleton';
import { IconPlus, IconSearch, IconMail, IconEdit, IconTrash, IconUsers } from '@/components/admin/ui/icons';

interface TableOption {
  id: string;
  tableNumber: number;
}

interface GuestRow {
  id: string;
  type: 'single' | 'couple';
  fullName: string;
  partnerName: string | null;
  phoneNumber: string;
  email: string | null;
  guestSide: 'groom' | 'bride';
  tableId: string;
  table: { tableNumber: number };
  userHashCode: string;
  inviteSentAt: string | null;
}

const emptyForm = {
  type: 'single' as 'single' | 'couple',
  fullName: '',
  partnerName: '',
  phoneNumber: '',
  email: '',
  guestSide: 'groom' as 'groom' | 'bride',
  tableId: '',
};

export default function GuestsPage() {
  const confirm = useConfirm();
  const [guests, setGuests] = useState<GuestRow[] | null>(null);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  async function load() {
    const [g, t] = await Promise.all([
      fetch('/api/admin/guests').then((r) => r.json()),
      fetch('/api/admin/tables').then((r) => r.json()),
    ]);
    setGuests(g.guests || []);
    setTables((t.tables || []).map((x: any) => ({ id: x.id, tableNumber: x.tableNumber })));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!guests) return [];
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) => g.fullName.toLowerCase().includes(q) || g.partnerName?.toLowerCase().includes(q) || g.phoneNumber.includes(q)
    );
  }, [guests, query]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(g: GuestRow) {
    setEditingId(g.id);
    setForm({
      type: g.type,
      fullName: g.fullName,
      partnerName: g.partnerName || '',
      phoneNumber: g.phoneNumber,
      email: g.email || '',
      guestSide: g.guestSide,
      tableId: g.tableId,
    });
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const url = editingId ? `/api/admin/guests/${editingId}` : '/api/admin/guests';
    const method = editingId ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save guest');
        return;
      }
      setDialogOpen(false);
      toast.success(editingId ? 'Guest updated' : 'Guest added');
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(g: GuestRow) {
    const ok = await confirm({
      title: `Delete ${g.fullName}?`,
      description: 'This cannot be undone — their RSVP and moments (if any) will be removed too.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/admin/guests/${g.id}`, { method: 'DELETE' });
    toast.success('Guest deleted');
    load();
  }

  async function handleSendInvite(g: GuestRow) {
    const res = await fetch(`/api/admin/guests/${g.id}/send-invite`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.mocked ? `Invite logged (mock mode): ${data.inviteUrl}` : 'Invite sent!');
      load();
    } else {
      toast.error(data.error || 'Failed to send invite');
    }
  }

  function guestActions(g: GuestRow) {
    return [
      { label: 'Send invite', icon: <IconMail width={16} height={16} />, onSelect: () => handleSendInvite(g) },
      { label: 'Save-the-date (EN)', href: buildSaveTheDateWaLink(g, 'en'), target: '_blank' },
      { label: 'Save-the-date (FR)', href: buildSaveTheDateWaLink(g, 'fr'), target: '_blank' },
      { label: 'Edit', icon: <IconEdit width={16} height={16} />, onSelect: () => openEdit(g) },
      { label: 'Delete', icon: <IconTrash width={16} height={16} />, onSelect: () => handleDelete(g), danger: true },
    ];
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title text-2xl text-onyx">Guests</h1>
        <Button variant="gold" icon={<IconPlus width={16} height={16} />} onClick={openAdd}>
          Add guest
        </Button>
      </div>

      <div className="relative mt-4 max-w-sm">
        <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
        <Input placeholder="Search by name or phone…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      {guests === null ? (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<IconUsers width={40} height={40} />}
            title={query ? 'No guests match your search' : 'No guests yet'}
            description={query ? undefined : 'Add your first guest to start building the list.'}
            action={
              !query && (
                <Button variant="gold" icon={<IconPlus width={16} height={16} />} onClick={openAdd}>
                  Add guest
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-6 hidden md:block">
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-12">No</Th>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Side</Th>
                  <Th>Table</Th>
                  <Th>Invite sent</Th>
                  <Th className="w-10" />
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((g, i) => (
                  <Tr key={g.id}>
                    <Td className="text-charcoal/40">{i + 1}</Td>
                    <Td className="font-medium">
                      <div className="flex items-center gap-2">
                        {g.type === 'couple' && <Badge tone="gold">Couple</Badge>}
                        <span>
                          {g.fullName}
                          {g.partnerName ? ` & ${g.partnerName}` : ''}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-charcoal/70">{g.phoneNumber}</Td>
                    <Td>
                      <Badge tone={g.guestSide === 'groom' ? 'blue' : 'gold'}>{g.guestSide}</Badge>
                    </Td>
                    <Td className="text-charcoal/70">Table {g.table?.tableNumber}</Td>
                    <Td>
                      {g.inviteSentAt ? (
                        <Badge tone="green">{new Date(g.inviteSentAt).toLocaleDateString()}</Badge>
                      ) : (
                        <span className="text-charcoal/35">—</span>
                      )}
                    </Td>
                    <Td>
                      <DropdownMenu items={guestActions(g)} label={`Actions for ${g.fullName}`} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="mt-6 space-y-3 md:hidden">
            {filtered.map((g, i) => (
              <Card key={g.id} padded={false} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-charcoal/40">{i + 1}.</span>
                      {g.type === 'couple' && <Badge tone="gold">Couple</Badge>}
                      <p className="text-sm font-medium text-onyx">
                        {g.fullName}
                        {g.partnerName ? ` & ${g.partnerName}` : ''}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-charcoal/60">{g.phoneNumber}</p>
                  </div>
                  <DropdownMenu items={guestActions(g)} label={`Actions for ${g.fullName}`} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={g.guestSide === 'groom' ? 'blue' : 'gold'}>{g.guestSide}</Badge>
                  <Badge tone="neutral">Table {g.table?.tableNumber}</Badge>
                  {g.inviteSentAt && <Badge tone="green">Invited {new Date(g.inviteSentAt).toLocaleDateString()}</Badge>}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? 'Edit guest' : 'Add guest'}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="guest-form" loading={saving}>
              {editingId ? 'Save changes' : 'Add guest'}
            </Button>
          </>
        }
      >
        <form id="guest-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="single">Single</option>
              <option value="couple">Couple</option>
            </Select>
          </Field>
          <Field label="Guest side">
            <Select value={form.guestSide} onChange={(e) => setForm({ ...form, guestSide: e.target.value as any })}>
              <option value="groom">Groom&apos;s side</option>
              <option value="bride">Bride&apos;s side</option>
            </Select>
          </Field>
          <Field label="Full name" required className="sm:col-span-2">
            <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          {form.type === 'couple' && (
            <Field label="Partner name" className="sm:col-span-2">
              <Input value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} />
            </Field>
          )}
          <Field label="Phone" required hint="e.g. +27...">
            <Input required value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          </Field>
          <Field label="Email (optional)">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Table" required className="sm:col-span-2">
            <Select required value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })}>
              <option value="">Select table…</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.tableNumber}
                </option>
              ))}
            </Select>
          </Field>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        </form>
      </Dialog>
    </div>
  );
}
