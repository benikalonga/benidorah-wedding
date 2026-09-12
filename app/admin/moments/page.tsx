'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/admin/ui/Button';
import Badge from '@/components/admin/ui/Badge';
import Card from '@/components/admin/ui/Card';
import EmptyState from '@/components/admin/ui/EmptyState';
import Skeleton from '@/components/admin/ui/Skeleton';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { IconImage, IconTrash } from '@/components/admin/ui/icons';

interface MomentRow {
  id: string;
  uploaderName: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  visible: boolean;
  createdAt: string;
}

export default function AdminMomentsPage() {
  const confirm = useConfirm();
  const [moments, setMoments] = useState<MomentRow[] | null>(null);

  async function load() {
    const data = await fetch('/api/moments?page=1').then((r) => r.json());
    setMoments(data.moments || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleVisible(id: string, visible: boolean) {
    await fetch(`/api/admin/moments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !visible }),
    });
    load();
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: 'Delete this moment?',
      description: 'This permanently removes the photo or video. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/admin/moments/${id}`, { method: 'DELETE' });
    toast.success('Moment deleted');
    load();
  }

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Moments Moderation</h1>

      {moments === null ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : moments.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<IconImage width={40} height={40} />} title="No moments uploaded yet" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {moments.map((m) => (
            <Card key={m.id} padded={false} className="overflow-hidden">
              <div className="relative aspect-square w-full bg-cream">
                {m.mediaType === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.mediaUrl} alt={m.uploaderName} className="h-full w-full object-cover" />
                ) : (
                  <video src={m.mediaUrl} className="h-full w-full object-cover" muted />
                )}
                <div className="absolute left-2 top-2">
                  <Badge tone={m.visible ? 'green' : 'neutral'}>{m.visible ? 'Visible' : 'Hidden'}</Badge>
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-medium text-onyx">{m.uploaderName}</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => toggleVisible(m.id, m.visible)}>
                    {m.visible ? 'Hide' : 'Show'}
                  </Button>
                  <Button variant="danger" size="icon" aria-label="Delete moment" onClick={() => remove(m.id)}>
                    <IconTrash width={15} height={15} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
