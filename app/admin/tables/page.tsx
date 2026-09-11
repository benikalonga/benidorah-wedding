'use client';

import { useEffect, useState } from 'react';

interface TableRow {
  id: string;
  tableNumber: number;
  capacity: number;
  guests: { id: string; fullName: string }[];
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await fetch('/api/admin/tables').then((r) => r.json());
    setTables(data.tables || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber: Number(tableNumber), capacity: Number(capacity) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to add table');
      return;
    }
    setTableNumber('');
    setCapacity('10');
    load();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/tables/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Could not delete table');
      return;
    }
    load();
  }

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Tables</h1>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-onyx/10 bg-white p-5">
        <div>
          <label className="text-xs text-charcoal/60">Table number</label>
          <input
            required
            type="number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="mt-1 block rounded border border-onyx/10 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-charcoal/60">Capacity</label>
          <input
            required
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="mt-1 block rounded border border-onyx/10 px-2 py-1.5 text-sm"
          />
        </div>
        <button type="submit" className="rounded-full bg-royal-blue px-4 py-2 text-sm font-semibold text-ivory">
          Add table
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <div key={t.id} className="rounded-2xl border border-onyx/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title text-lg text-onyx">Table {t.tableNumber}</h3>
              <button onClick={() => handleDelete(t.id)} className="text-xs text-red-700">
                Delete
              </button>
            </div>
            <p className="text-xs text-charcoal/60">
              {t.guests.length} / {t.capacity} seated
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {t.guests.map((g) => (
                <li key={g.id}>{g.fullName}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
