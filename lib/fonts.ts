import localFont from 'next/font/local';

// Self-hosted instead of next/font/google: that loader still has to fetch
// the actual font files from fonts.gstatic.com at *build* time (it only
// avoids runtime requests), and a Docker build with flaky/no egress would
// retry and fail on every image build. These three files are the exact
// variable-font files Next itself downloaded for the "latin" subset (the
// one range that covers English + French, incl. accents/œ/guillemets/€)
// — grabbed once from a successful local build — so there's no longer a
// network dependency at build time at all.

// Bodoni Moda: a high-contrast Didone serif — straight vertical stress and
// sharp, geometric bowls, not the curved old-style forms of a script/
// humanist serif. This is the "advanced, editorial" display face used
// for the couple's name, section headlines and pull-quotes.
export const displayFont = localFont({
  src: './fonts/bodoni-moda-variable.woff2',
  weight: '500 800',
  style: 'normal',
  variable: '--font-display',
  display: 'swap',
});

// Manrope: geometric, straight-terminal sans for UI chrome, nav, labels
// and body copy — no curled or looping letterforms.
export const sansFont = localFont({
  src: './fonts/manrope-variable.woff2',
  weight: '400 800',
  style: 'normal',
  variable: '--font-sans',
  display: 'swap',
});

/** Handwriting font reserved for the Wish Wall "notes" only — a deliberate
 * exception to the straight/geometric system, since the wall is meant to
 * look hand-written, not typeset. */
export const handFont = localFont({
  src: './fonts/caveat-variable.woff2',
  weight: '500 700',
  style: 'normal',
  variable: '--font-hand',
  display: 'swap',
});
