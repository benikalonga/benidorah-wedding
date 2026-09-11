'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Lightbox, { LightboxItem } from './Lightbox';
import SectionHeader from './SectionHeader';
import { useSocketEvent } from '@/lib/useSocket';

export interface MomentEntry {
  id: string;
  uploaderName: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
}

export default function ShareMoment({ initialMoments }: { initialMoments: MomentEntry[] }) {
  const [moments, setMoments] = useState(initialMoments);
  const [uploaderName, setUploaderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSocketEvent<{ moment: MomentEntry }>('moment:new', (payload) => {
    setMoments((prev) => [payload.moment, ...prev]);
  });
  useSocketEvent<{ momentId: string }>('moment:hidden', (payload) => {
    setMoments((prev) => prev.filter((m) => m.id !== payload.momentId));
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderName', uploaderName || 'A guest');

    try {
      const res = await fetch('/api/moments', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed — check your connection and try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const lightboxItems: LightboxItem[] = moments.map((m) => ({ url: m.mediaUrl, type: m.mediaType, caption: m.uploaderName }));

  return (
    <section id="moments" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader index="07" eyebrow="Live From The Day" title="Share a Moment" description="Snap it, upload it — everyone sees it live." />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="hairline mt-10 flex max-w-md flex-col gap-4 p-6"
      >
        <input
          type="text"
          placeholder="Your name"
          value={uploaderName}
          onChange={(e) => setUploaderName(e.target.value)}
          className="field-underline"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={uploading}
          className="text-sm text-charcoal/60 file:mr-3 file:border-0 file:bg-onyx file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-widest file:text-ivory"
        />
        {uploading && <p className="text-xs text-charcoal/50">Uploading…</p>}
        {error && <p className="text-xs text-red-700">{error}</p>}
      </motion.div>

      <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
        {moments.map((m, idx) => (
          <button key={m.id} onClick={() => setOpenIndex(idx)} className="overflow-hidden">
            {m.mediaType === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.mediaUrl} alt={`Uploaded by ${m.uploaderName}`} className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
            ) : (
              <video src={m.mediaUrl} className="aspect-square w-full object-cover" muted />
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox items={lightboxItems} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      )}
    </section>
  );
}
