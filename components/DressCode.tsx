'use client';

import { motion } from 'framer-motion';
import { SITE_COPY } from '@/lib/content';
import SectionHeader from './SectionHeader';
import { useLocale } from './LocaleProvider';
import { pick } from '@/lib/i18n';

export default function DressCode() {
  const { locale, t } = useLocale();
  const { title, description } = SITE_COPY.dressCode;
  const swatches = [
    { hex: '#1B3FA0', name: t('dressCode.sapphire') },
    { hex: '#0B0B0F', name: t('dressCode.onyx') },
    { hex: '#5B2A86', name: t('dressCode.amethyst') },
    { hex: '#7A1F3D', name: t('dressCode.wine') },
    { hex: '#B08D3F', name: t('dressCode.gold') },
  ];
  return (
    <section id="theme" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader index="06" eyebrow={t('dressCode.eyebrow')} title={pick(title, locale)} />
      </motion.div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-xl leading-relaxed text-charcoal/80 sm:text-2xl"
        >
          {pick(description, locale)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex flex-wrap gap-6"
        >
          {swatches.map((s) => (
            <div key={s.hex} className="flex flex-col items-center gap-2">
              <span className="h-14 w-14 rounded-full border border-charcoal/10 shadow-sm" style={{ backgroundColor: s.hex }} />
              <span className="text-[10px] uppercase tracking-widest text-charcoal/50">{s.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
