'use client';

import { useEffect, useState } from 'react';

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
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const url = editingId ? `/api/admin/guests/${editingId}` : '/api/admin/guests';
    const method = editingId ? 'PATCH' : 'POST';
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
    setForm(emptyForm);
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this guest? This cannot be undone.')) return;
    await fetch(`/api/admin/guests/${id}`, { method: 'DELETE' });
    load();
  }

  async function handleSendInvite(id: string) {
    setNotice(null);
    const res = await fetch(`/api/admin/guests/${id}/send-invite`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setNotice(data.mocked ? `Invite logged (mock mode — no WhatsApp credentials set): ${data.inviteUrl}` : 'Invite sent!');
      load();
    } else {
      setNotice(data.error || 'Failed to send invite');
    }
  }

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Guests</h1>

      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-onyx/10 bg-white p-5 md:grid-cols-3">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          className="rounded border border-onyx/10 px-2 py-1.5 text-sm"
        >
          <option value="single">Single</option>
          <option value="couple">Couple</option>
        </select>
        <input
          required
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="rounded border border-onyx/10 px-2 py-1.5 text-sm"
        />
        {form.type === 'couple' && (
          <input
            placeholder="Partner name"
            value={form.partnerName}
            onChange={(e) => setForm({ ...form, partnerName: e.target.value })}
            className="rounded border border-onyx/10 px-2 py-1.5 text-sm"
          />
        )}
        <input
          required
          placeholder="Phone (e.g. +27...)"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          className="rounded border border-onyx/10 px-2 py-1.5 text-sm"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded border border-onyx/10 px-2 py-1.5 text-sm"
        />
        <select
          value={form.guestSide}
          onChange={(e) => setForm({ ...form, guestSide: e.target.value as any })}
          className="rounded border border-onyx/10 px-2 py-1.5 text-sm"
        >
          <option value="groom">Groom's side</option>
          <option value="bride">Bride's side</option>
        </select>
        <select
          required
          value={form.tableId}
          onChange={(e) => setForm({ ...form, tableId: e.target.value })}
          className="rounded border border-onyx/10 px-2 py-1.5 text-sm"
        >
          <option value="">Select table…</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              Table {t.tableNumber}
            </option>
          ))}
        </select>
        <div className="col-span-full flex items-center gap-3">
          <button type="submit" className="rounded-full bg-royal-blue px-4 py-2 text-sm font-semibold text-ivory">
            {editingId ? 'Update guest' : 'Add guest'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="text-sm text-charcoal/60"
            >
              Cancel edit
            </button>
          )}
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      </form>

      {notice && <p className="mt-3 rounded-lg bg-champagne-gold/20 p-3 text-sm text-onyx">{notice}</p>}

      <div className="mt-6 overflow-x-auto rounded-xl border border-onyx/10 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-ivory text-xs uppercase text-charcoal/50">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Side</th>
              <th className="px-3 py-2">Table</th>
              <th className="px-3 py-2">Invite sent</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id} className="border-t border-onyx/5">
                <td className="px-3 py-2">{g.fullName}{g.partnerName ? ` & ${g.partnerName}` : ''}</td>
                <td className="px-3 py-2 capitalize">{g.type}</td>
                <td className="px-3 py-2">{g.phoneNumber}</td>
                <td className="px-3 py-2 capitalize">{g.guestSide}</td>
                <td className="px-3 py-2">Table {g.table?.tableNumber}</td>
                <td className="px-3 py-2">{g.inviteSentAt ? new Date(g.inviteSentAt).toLocaleDateString() : '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSendInvite(g.id)}
                      className="rounded-full bg-green-600/10 px-3 py-1 text-xs font-medium text-green-700"
                      title="Send invite via WhatsApp"
                    >
                      📲 Send invite
                    </button>
                    <button
                      onClick={() => {
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
                      }}
                      className="rounded-full bg-royal-blue/10 px-3 py-1 text-xs font-medium text-royal-blue"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="rounded-full bg-red-600/10 px-3 py-1 text-xs font-medium text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
