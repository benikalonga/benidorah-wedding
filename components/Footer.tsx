const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#history', label: 'History' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#address', label: 'Date & Address' },
  { href: '#gifts', label: 'Registry' },
  { href: '#rsvp', label: 'RSVP' },
  { href: '#theme', label: 'Theme' },
  { href: '#moments', label: 'Moments' },
  { href: '#contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="bg-onyx text-ivory">
      <div className="checkerboard-strip h-4 w-full" aria-hidden />
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex flex-col items-center gap-8 text-center">
          <p className="display-huge text-5xl sm:text-6xl">
            B<span className="text-champagne-gold">&amp;</span>D
          </p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-[11px] uppercase tracking-[0.2em] text-ivory/60 hover:text-champagne-gold">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="divider-onyx w-24" />
          <a href="/admin" className="text-[10px] uppercase tracking-[0.2em] text-ivory/30 hover:text-ivory/60">
            Admin
          </a>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ivory/30">23 . 12 . 2026 — Made with love</p>
        </div>
      </div>
    </footer>
  );
}
