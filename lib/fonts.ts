import { Bodoni_Moda, Manrope, Caveat } from 'next/font/google';

// Bodoni Moda: a high-contrast Didone serif — straight vertical stress and
// sharp, geometric bowls, not the curved old-style forms of a script/
// humanist serif. This is the "advanced, editorial" display face used
// for the couple's name, section headlines and pull-quotes.
export const displayFont = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  style: ['normal'],
  variable: '--font-display',
  display: 'swap',
});

// Manrope: geometric, straight-terminal sans for UI chrome, nav, labels
// and body copy — no curled or looping letterforms.
export const sansFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

/** Handwriting font reserved for the Wish Wall "notes" only — a deliberate
 * exception to the straight/geometric system, since the wall is meant to
 * look hand-written, not typeset. */
export const handFont = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-hand',
  display: 'swap',
});
