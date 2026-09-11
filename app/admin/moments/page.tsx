'use client';

import { useEffect, useState } from 'react';

interface MomentRow {
  id: string;
  uploaderName: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  visible: boolean;
  createdAt: string;
}

export default function AdminMomentsPage() {
  const [moments, setMoments] = useState<MomentRow[]>([]);

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
    if (!confirm('Delete this moment permanently?')) return;
    await fetch(`/api/admin/moments/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Moments Moderation</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {moments.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-xl border border-onyx/10 bg-white">
            {m.mediaType === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.mediaUrl} alt={m.uploaderName} className="aspect-square w-full object-cover" />
            ) : (
              <video src={m.mediaUrl} className="aspect-square w-full object-cover" muted />
            )}
            <div className="p-2 text-xs">
              <p className="truncate font-medium">{m.uploaderName}</p>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => toggleVisible(m.id, m.visible)}
                  className={`rounded-full px-2 py-1 ${m.visible ? 'bg-charcoal/10' : 'bg-champagne-gold/30'}`}
                >
                  {m.visible ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => remove(m.id)} className="rounded-full bg-red-600/10 px-2 py-1 text-red-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
