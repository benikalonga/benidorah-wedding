'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Lightbox, { LightboxItem } from './Lightbox';
import SectionHeader from './SectionHeader';
import { useSocketEvent } from '@/lib/useSocket';
import { useLocale } from './LocaleProvider';
import { useActivityLog } from './ActivityLogProvider';

export interface MomentEntry {
  id: string;
  uploaderName: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
}

interface GuestSummary {
  userHashCode: string;
  fullName: string;
}

export default function ShareMoment({
  initialMoments,
  guest,
}: {
  initialMoments: MomentEntry[];
  // Only present when this page was rendered from a guest's own /[hash]
  // link (see app/[hash]/page.tsx) — that's the only proof of "invited
  // guest" this app has, so it also doubles as upload permission below.
  guest: GuestSummary | null;
}) {
  const { t } = useLocale();
  const { logAction } = useActivityLog();
  const [moments, setMoments] = useState(initialMoments);
  const [uploaderName, setUploaderName] = useState(guest?.fullName || '');
  const [uploading, setUploading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useSocketEvent<{ moment: MomentEntry }>('moment:new', (payload) => {
    setMoments((prev) => [payload.moment, ...prev]);
  });
  useSocketEvent<{ momentId: string }>('moment:hidden', (payload) => {
    setMoments((prev) => prev.filter((m) => m.id !== payload.momentId));
  });

  // Revoke the local object URL whenever it's replaced or the component
  // unmounts, so a stream of picks doesn't quietly leak blob memory.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function processFile(file: File) {
    if (!guest) return;
    setUploading(true);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderName', uploaderName || guest.fullName || 'A guest');
    formData.append('userHashCode', guest.userHashCode);

    try {
      const res = await fetch('/api/moments', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t('shareMoment.uploadFailed'));
        logAction('moment_upload_error');
      } else {
        logAction('moment_upload_success', { mediaType: file.type.startsWith('video') ? 'video' : 'image' });
      }
    } catch {
      toast.error(t('shareMoment.uploadFailedConn'));
      logAction('moment_upload_error');
    } finally {
      setUploading(false);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    if (!guest || uploading) return;
    dragDepth.current += 1;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (!guest || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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
        <SectionHeader index="07" eyebrow={t('shareMoment.eyebrow')} title={t('shareMoment.title')} description={t('shareMoment.description')} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="hairline mt-10 flex max-w-md flex-col gap-4 p-6"
      >
        {guest ? (
          <>
            <p className="text-sm italic text-charcoal/60">{t('shareMoment.hint')}</p>

            <input
              type="text"
              placeholder={t('shareMoment.namePlaceholder')}
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              className="field-underline"
            />

            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label={t('shareMoment.browseFiles')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!uploading) fileInputRef.current?.click();
                }
              }}
              className={`flex cursor-pointer flex-col items-center gap-2 border border-dashed px-6 py-8 text-center transition-colors ${
                isDragging ? 'border-champagne-gold bg-champagne-gold/10' : 'border-charcoal/25 hover:border-champagne-gold/60'
              } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
              />

              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="" className="h-16 w-16 object-cover" />
              ) : (
                <UploadIcon className={isDragging ? 'text-champagne-gold' : 'text-charcoal/40'} />
              )}

              {uploading ? (
                <p className="text-xs uppercase tracking-widest text-charcoal/60">{t('shareMoment.uploading')}</p>
              ) : isDragging ? (
                <p className="text-sm font-medium text-champagne-gold">{t('shareMoment.dropHere')}</p>
              ) : (
                <>
                  <p className="text-sm text-charcoal/70">
                    <span className="font-medium text-onyx underline underline-offset-2">{t('shareMoment.browseFiles')}</span>{' '}
                    {t('shareMoment.orDragDrop')}
                  </p>
                  <p className="text-[11px] uppercase tracking-widest text-charcoal/40">{t('shareMoment.fileHint')}</p>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-charcoal/60">{t('shareMoment.lockedMessage')}</p>
        )}
      </motion.div>

      <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
        {moments.map((m, idx) => (
          <button
            key={m.id}
            onClick={() => {
              setOpenIndex(idx);
              logAction('moment_view', { id: m.id, mediaType: m.mediaType });
            }}
            className="overflow-hidden"
          >
            {m.mediaType === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.mediaUrl} alt={t('shareMoment.uploadedByAlt').replace('{name}', m.uploaderName)} className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
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

function UploadIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M12 15V4M12 4 8.5 7.5M12 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
