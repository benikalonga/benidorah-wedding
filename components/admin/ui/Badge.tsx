import type { ReactNode } from 'react';

type Tone = 'neutral' | 'green' | 'gold' | 'blue' | 'red';

const tones: Record<Tone, string> = {
  neutral: 'bg-onyx/[0.06] text-charcoal/70',
  green: 'bg-green-600/10 text-green-700',
  gold: 'bg-champagne-gold/15 text-[#8a6510]',
  blue: 'bg-royal-blue/10 text-royal-blue',
  red: 'bg-red-600/10 text-red-700',
};

export default function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
