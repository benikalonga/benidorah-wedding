'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { requestHeroVideoPause } from '@/lib/heroPlayback';
import { useLocale } from './LocaleProvider';

export interface LightboxItem {
  url: string;
  type: 'image' | 'video';
  caption?: string;
}

export default function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  const { t } = useLocale();
  const item = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onNavigate]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-onyx/95 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => ((e.currentTarget as any)._touchX = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchX;
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) onNavigate((index + 1) % items.length);
            if (endX - startX > 50) onNavigate((index - 1 + items.length) % items.length);
          }}
        >
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-xs uppercase tracking-widest text-ivory/70 hover:text-ivory"
            aria-label={t('lightbox.closeAria')}
          >
            {t('lightbox.close')}
          </button>

          {item.type === 'image' ? (
            <div className="relative aspect-[4/5] w-full sm:aspect-video">
              <Image src={item.url} alt={item.caption || t('lightbox.captionFallback')} fill className="object-contain" />
            </div>
          ) : (
            <video
              src={item.url}
              controls
              autoPlay
              className="max-h-[80vh] w-full"
              // Playing a video here means two audio tracks could overlap
              // with the hero's background video — tell the hero to pause
              // itself first, whether this play was the initial autoplay
              // or a manual replay via the native controls.
              onPlay={requestHeroVideoPause}
            />
          )}

          {item.caption && <p className="mt-3 text-center text-sm text-ivory/70">{item.caption}</p>}

          <div className="mt-4 flex items-center justify-between text-ivory/60">
            <button onClick={() => onNavigate((index - 1 + items.length) % items.length)} className="text-xs uppercase tracking-widest hover:text-champagne-gold" aria-label={t('lightbox.prevAria')}>
              {t('lightbox.prev')}
            </button>
            <span className="eyebrow text-[10px] text-ivory/40">
              {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <button onClick={() => onNavigate((index + 1) % items.length)} className="text-xs uppercase tracking-widest hover:text-champagne-gold" aria-label={t('lightbox.nextAria')}>
              {t('lightbox.next')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
