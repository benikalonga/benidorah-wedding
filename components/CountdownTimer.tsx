'use client';

import { useEffect, useState } from 'react';

function getRemaining(targetIso: string) {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ targetIso }: { targetIso: string }) {
  // `null` renders an identical placeholder on the server and on the
  // client's first (pre-hydration) pass — calling Date.now() during that
  // shared render path is what causes a hydration mismatch (server time vs.
  // client time differ by however long the response took to arrive). The
  // real value is only computed once mounted, i.e. strictly client-side.
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(null);

  useEffect(() => {
    setRemaining(getRemaining(targetIso));
    const id = setInterval(() => setRemaining(getRemaining(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const units: [string, number | null][] = [
    ['Days', remaining?.days ?? null],
    ['Hours', remaining?.hours ?? null],
    ['Min', remaining?.minutes ?? null],
    ['Sec', remaining?.seconds ?? null],
  ];

  return (
    <div className="flex items-start gap-5 sm:gap-8" role="timer" aria-live="off">
      {units.map(([label, value], i) => (
        <div key={label} className="flex items-center gap-5 sm:gap-8">
          <div className="flex flex-col items-center">
            <span className="display-huge text-3xl tabular-nums text-ivory sm:text-4xl" suppressHydrationWarning>
              {value === null ? '--' : String(value).padStart(2, '0')}
            </span>
            <span className="eyebrow mt-1 text-[9px] text-champagne-gold">{label}</span>
          </div>
          {i < units.length - 1 && <span className="mt-1 text-ivory/20">/</span>}
        </div>
      ))}
    </div>
  );
}
