'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'history', label: 'History' },
  { id: 'address', label: 'Date & Address' },
  { id: 'gifts', label: 'Registry' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'theme', label: 'Theme' },
  { id: 'moments', label: 'Moments' },
  { id: 'contact', label: 'Contact' },
];

export default function Nav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState('home');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('home');
    if (!hero) return;
    const heroObserver = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: '-10% 0px 0px 0px',
    });
    heroObserver.observe(hero);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) sectionObserver.observe(el);
    });

    return () => {
      heroObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-500 ${
        visible ? 'translate-y-0 border-charcoal/10 bg-ivory/90 backdrop-blur-md' : '-translate-y-full border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#home" className="display-huge text-lg text-onyx">
          B<span className="text-champagne-gold">&amp;</span>D
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {SECTIONS.slice(1).map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`group relative text-xs uppercase tracking-[0.18em] transition-colors ${
                active === s.id ? 'text-onyx' : 'text-charcoal/50 hover:text-onyx'
              }`}
            >
              {s.label}
              <span
                className={`absolute -bottom-1.5 left-0 h-px bg-champagne-gold transition-all duration-300 ${
                  active === s.id ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </a>
          ))}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="hairline flex h-9 w-9 items-center justify-center rounded-full lg:hidden"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col gap-1">
            <span className="block h-px w-4 bg-onyx" />
            <span className="block h-px w-4 bg-onyx" />
          </div>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-charcoal/10 bg-ivory px-5 pb-5 pt-3 lg:hidden">
          {SECTIONS.slice(1).map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setOpen(false)}
              className="py-2 text-sm uppercase tracking-[0.18em] text-charcoal/70"
            >
              {s.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
