'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Lightbox, { LightboxItem } from './Lightbox';
import SectionHeader from './SectionHeader';
import { useLocale } from './LocaleProvider';
import { useActivityLog } from './ActivityLogProvider';

export interface GalleryEntry {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string | null;
}

const PAGE_SIZE = 10;

export default function Gallery({ items }: { items: GalleryEntry[] }) {
  const { t } = useLocale();
  const { logAction } = useActivityLog();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Lightbox navigation (prev/next, swipe) still spans every item, not just
  // the currently-revealed slice — only the grid itself is paginated.
  const lightboxItems: LightboxItem[] = items.map((i) => ({ url: i.mediaUrl, type: i.mediaType }));
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <section id="gallery" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader index="02" eyebrow={t('gallery.eyebrow')} title={t('gallery.title')} description={t('gallery.description')} />
      </motion.div>

      <div className="mt-10 columns-2 gap-2 [column-fill:_balance] sm:columns-3 sm:gap-3 xl:columns-4">
        {visibleItems.map((item, idx) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: (idx % 4) * 0.06 }}
            onClick={() => {
              setOpenIndex(idx);
              logAction('gallery_view', { id: item.id, mediaType: item.mediaType });
            }}
            className="group relative mb-2 block w-full break-inside-avoid overflow-hidden sm:mb-3"
          >
            {item.mediaType === 'image' ? (
              <Image
                src={item.mediaUrl}
                alt={t('gallery.altPhoto')}
                width={600}
                height={800}
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
            ) : item.thumbnailUrl ? (
              // A bare <video preload="metadata"> renders no visible frame
              // until played — a real poster keeps the tile from looking
              // like an empty/broken slot in the grid.
              <Image
                src={item.thumbnailUrl}
                alt={t('gallery.altVideoThumb')}
                width={600}
                height={800}
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <video src={item.mediaUrl} className="h-auto w-full" muted loop playsInline preload="metadata" />
            )}

            {item.mediaType === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-onyx/15">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ivory/90 text-onyx shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
            )}

            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-onyx/50 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="eyebrow text-[9px] text-ivory">{item.mediaType === 'video' ? t('gallery.play') : t('gallery.view')}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => {
              setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length));
              logAction('gallery_show_more');
            }}
            className="btn-outline rounded-full px-8 py-3 text-xs uppercase"
          >
            {t('gallery.showMore')}
          </button>
        </div>
      )}

      {openIndex !== null && (
        <Lightbox items={lightboxItems} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      )}
    </section>
  );
}
