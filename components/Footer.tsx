'use client';

import { useLocale } from './LocaleProvider';
import { useActivityLog } from './ActivityLogProvider';

const LINK_SECTIONS = [
  { href: '#home', key: 'nav.home' },
  { href: '#history', key: 'nav.history' },
  { href: '#gallery', key: 'nav.gallery' },
  { href: '#address', key: 'nav.dateAddress' },
  { href: '#gifts', key: 'nav.registry' },
  { href: '#rsvp', key: 'nav.rsvp' },
  { href: '#theme', key: 'nav.theme' },
  { href: '#moments', key: 'nav.moments' },
  { href: '#contact', key: 'nav.contact' },
];

export default function Footer() {
  const { t } = useLocale();
  const { logAction } = useActivityLog();
  return (
    <footer className="bg-onyx text-ivory">
      <div className="checkerboard-strip h-4 w-full" aria-hidden />
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex flex-col items-center gap-8 text-center">
          <p className="display-huge text-5xl sm:text-6xl">
            B<span className="text-champagne-gold">&amp;</span>D
          </p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LINK_SECTIONS.map((l) => (
              <a key={l.href} href={l.href} className="text-[11px] uppercase tracking-[0.2em] text-ivory/60 hover:text-champagne-gold">
                {t(l.key)}
              </a>
            ))}
          </nav>
          <div className="divider-onyx w-24" />
          <a
            href="/admin"
            onClick={() => logAction('footer_admin_click')}
            className="text-[10px] uppercase tracking-[0.2em] text-ivory/30 hover:text-ivory/60"
          >
            {t('footer.admin')}
          </a>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ivory/30">{t('footer.madeWithLove')}</p>
        </div>
      </div>
    </footer>
  );
}
