'use client';

import { motion } from 'framer-motion';
import { SITE_COPY } from '@/lib/content';
import SectionHeader from './SectionHeader';
import { useLocale } from './LocaleProvider';

export default function Contact() {
  const { t } = useLocale();
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader index="08" eyebrow={t('contact.eyebrow')} title={t('contact.title')} description={t('contact.description')} />
      </motion.div>

      <div className="mt-10 grid gap-0 sm:grid-cols-2">
        {SITE_COPY.contacts.map((c, i) => (
          <motion.a
            key={c.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            href={`tel:${c.phone.replace(/\s+/g, '')}`}
            className="group flex items-center justify-between border-b border-t border-charcoal/10 py-8 transition-colors hover:bg-onyx sm:border-l sm:first:border-l-0"
          >
            <div className="px-2">
              <p className="section-title text-2xl text-onyx group-hover:text-ivory">{c.name}</p>
              <p className="mt-1 text-sm text-champagne-gold">{c.phone}</p>
            </div>
            <span className="px-4 text-charcoal/30 transition-colors group-hover:text-champagne-gold">→</span>
          </motion.a>
        ))}
      </div>

      <div className="mt-10 text-center">
        <a href={`mailto:${SITE_COPY.email}`} className="eyebrow border-b border-champagne-gold pb-1 text-champagne-gold">
          {SITE_COPY.email}
        </a>
      </div>
    </section>
  );
}
