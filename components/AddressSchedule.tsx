'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SITE_COPY } from '@/lib/content';
import SectionHeader from './SectionHeader';
import { useLocale } from './LocaleProvider';
import { useActivityLog } from './ActivityLogProvider';
import { pick } from '@/lib/i18n';

export default function AddressSchedule() {
  const { locale, t } = useLocale();
  const { logAction } = useActivityLog();
  const { venueName, address, mapEmbedUrl, mapsDirectionsUrl, venueWebsiteUrl, ceremony, party } = SITE_COPY;
  const [showVenueSite, setShowVenueSite] = useState(false);

  function handleOpenVenueSite() {
    setShowVenueSite(true);
    logAction('venue_preview_open');
  }

  function handleCloseVenueSite() {
    setShowVenueSite(false);
    logAction('venue_preview_close');
  }

  function handleOpenInNewTab() {
    logAction('venue_preview_open_external');
    window.open(venueWebsiteUrl, '_blank', 'noopener,noreferrer');
    setShowVenueSite(false);
  }

  // Lock page scroll while the venue-website popup is open, and let Escape
  // close it — same pattern as the gift/gallery popups elsewhere.
  useEffect(() => {
    if (!showVenueSite) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCloseVenueSite();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showVenueSite]);

  return (
    <section id="address" className="bg-onyx py-16 text-ivory sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionHeader index="03" eyebrow={t('addressSchedule.eyebrow')} title={t('addressSchedule.title')} light description={address} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 flex items-center gap-3"
        >
          <p className="section-title text-2xl text-champagne-gold-light sm:text-3xl">
            {t('addressSchedule.atVenue').replace('{venue}', venueName)}
          </p>
          <button
            type="button"
            onClick={handleOpenVenueSite}
            aria-label={t('addressSchedule.previewVenueAria')}
            title={t('addressSchedule.previewVenueAria')}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-champagne-gold-light/40 text-champagne-gold-light transition-colors hover:bg-champagne-gold-light/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 3h6v6M10 14 21 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </motion.div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="hairline overflow-hidden border-ivory/15 grayscale transition-all duration-700 hover:grayscale-0"
          >
            <iframe
              title={t('addressSchedule.venueMapTitle')}
              src={mapEmbedUrl}
              className="h-80 w-full lg:h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>

          <div className="flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-6">
              {[ceremony, party].map((event, i) => (
                <motion.div
                  key={event.label.en}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="flex items-center justify-between border-b border-ivory/15 pb-6"
                >
                  <div>
                    <p className="eyebrow text-champagne-gold-light">{pick(event.label, locale)}</p>
                    <p className="section-title mt-2 text-3xl">{event.time}</p>
                  </div>
                  <span className="eyebrow-num text-4xl text-ivory/15">0{i + 1}</span>
                </motion.div>
              ))}
            </div>

            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logAction('get_directions_click')}
              className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-xs uppercase tracking-widest"
            >
              {t('addressSchedule.getDirections')}
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showVenueSite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-onyx/80 p-4 sm:p-8"
            onClick={handleCloseVenueSite}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="hairline flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden bg-ivory text-charcoal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 border-b border-charcoal/10 p-4">
                <p className="truncate text-xs uppercase tracking-widest text-charcoal/50">
                  {venueWebsiteUrl}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="btn-gold inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-widest"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 3h6v6M10 14 21 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t('addressSchedule.openInNewTab')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseVenueSite}
                    aria-label={t('addressSchedule.closeAria')}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal/60 transition-colors hover:bg-charcoal/10 hover:text-onyx"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <iframe
                title={t('addressSchedule.venuePreviewTitle')}
                src={venueWebsiteUrl}
                className="w-full flex-1"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
