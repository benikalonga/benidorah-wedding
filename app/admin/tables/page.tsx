'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '@/components/admin/ui/PageHeader';
import Button from '@/components/admin/ui/Button';
import Dialog from '@/components/admin/ui/Dialog';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import DropdownMenu from '@/components/admin/ui/DropdownMenu';
import { Field, Input } from '@/components/admin/ui/form';
import Card from '@/components/admin/ui/Card';
import Badge from '@/components/admin/ui/Badge';
import EmptyState from '@/components/admin/ui/EmptyState';
import Skeleton from '@/components/admin/ui/Skeleton';
import { IconPlus, IconEdit, IconTrash, IconTable } from '@/components/admin/ui/icons';

interface TableRow {
  id: string;
  tableNumber: number;
  capacity: number;
  guests: { id: string; fullName: string }[];
}

const emptyForm = { tableNumber: '', capacity: '10' };

export default function TablesPage() {
  const confirm = useConfirm();
  const [tables, setTables] = useState<TableRow[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await fetch('/api/admin/tables').then((r) => r.json());
    setTables(data.tables || []);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(t: TableRow) {
    setEditingId(t.id);
    setForm({ tableNumber: String(t.tableNumber), capacity: String(t.capacity) });
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const url = editingId ? `/api/admin/tables/${editingId}` : '/api/admin/tables';
    const method = editingId ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: Number(form.tableNumber), capacity: Number(form.capacity) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save table');
        return;
      }
      setDialogOpen(false);
      toast.success(editingId ? 'Table updated' : 'Table added');
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: TableRow) {
    const ok = await confirm({
      title: `Delete Table ${t.tableNumber}?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/tables/${t.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Could not delete table');
      return;
    }
    toast.success('Table deleted');
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tables"
        action={
          <Button variant="gold" icon={<IconPlus width={16} height={16} />} onClick={openAdd}>
            Add table
          </Button>
        }
      />

      {tables === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : tables.length === 0 ? (
        <div>
          <EmptyState
            icon={<IconTable width={40} height={40} />}
            title="No tables yet"
            description="Add a table before assigning guests to it."
            action={
              <Button variant="gold" icon={<IconPlus width={16} height={16} />} onClick={openAdd}>
                Add table
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((t) => {
            const full = t.guests.length >= t.capacity;
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="section-title text-lg text-onyx">Table {t.tableNumber}</h3>
                    <div className="mt-1.5">
                      <Badge tone={full ? 'gold' : 'blue'}>
                        {t.guests.length} / {t.capacity} seated
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu
                    label={`Actions for Table ${t.tableNumber}`}
                    items={[
                      { label: 'Edit', icon: <IconEdit width={16} height={16} />, onSelect: () => openEdit(t) },
                      {
                        label: 'Delete',
                        icon: <IconTrash width={16} height={16} />,
                        onSelect: () => handleDelete(t),
                        danger: true,
                      },
                    ]}
                  />
                </div>
                {t.guests.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-charcoal/70">
                    {t.guests.map((g) => (
                      <li key={g.id}>{g.fullName}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-charcoal/40">No guests seated yet.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? 'Edit table' : 'Add table'}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="table-form" loading={saving}>
              {editingId ? 'Save changes' : 'Add table'}
            </Button>
          </>
        }
      >
        <form id="table-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <Field label="Table number" required>
            <Input
              required
              type="number"
              min={1}
              value={form.tableNumber}
              onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
            />
          </Field>
          <Field label="Capacity" required>
            <Input
              required
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </Field>
          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
        </form>
      </Dialog>
    </div>
  );
}
