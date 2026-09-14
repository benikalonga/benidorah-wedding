'use client';

import { motion } from 'framer-motion';
import { SITE_COPY } from '@/lib/content';
import SectionHeader from './SectionHeader';
import { useLocale } from './LocaleProvider';
import { pick } from '@/lib/i18n';

export default function AddressSchedule() {
  const { locale, t } = useLocale();
  const { venueName, address, mapEmbedUrl, mapsDirectionsUrl, ceremony, party } = SITE_COPY;

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

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="section-title mt-8 text-2xl text-champagne-gold-light sm:text-3xl"
        >
          {t('addressSchedule.atVenue').replace('{venue}', venueName)}
        </motion.p>

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
              className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-xs uppercase tracking-widest"
            >
              {t('addressSchedule.getDirections')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
