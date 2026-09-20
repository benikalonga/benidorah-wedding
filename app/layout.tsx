import type { Metadata, Viewport } from 'next';
import { displayFont, sansFont, handFont } from '@/lib/fonts';
import './globals.css';

// Shown when this link is pasted into WhatsApp, iMessage, Slack, X, etc.
// Most platforms (WhatsApp and iMessage especially) only ever render the
// static `images` thumbnail below, no matter what video metadata is
// present — there's no way to force a genuine video preview everywhere.
// The `videos` entry is honored by the handful of platforms that do
// support inline unfurling (Discord, Slack, some link-preview bots), as
// a bonus on top of the image, not a replacement for it.
const OG_TITLE = 'Beni & Dorah — 23 December 2026';
const OG_DESCRIPTION =
  'Two hearts, one beautiful forever — join us as we say "I do" at Suitability Gardens, De Deur.';
const SITE_URL = process.env.SITE_URL || 'https://benidorah.com';
// `metadataBase` auto-resolves relative `openGraph.images` to absolute
// URLs, but not `openGraph.videos` — social crawlers need an absolute
// URL regardless, so this one is built explicitly.
const OG_VIDEO_URL = new URL('/api/media/hero-main', SITE_URL).toString();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: OG_TITLE,
  description: OG_DESCRIPTION,
  manifest: '/manifest.json',
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    // The real save-the-date photo (public/images/gallery/27.jpeg) is a
    // 3123x4160 portrait — WhatsApp's crawler silently drops the preview
    // for anything that far outside the standard 1.91:1 og:image ratio.
    // public/images/og/save-the-date.jpg is a landscape crop of that same
    // photo (framed to keep the "Save the Date" text and both faces),
    // not a different image — see the crop coordinates in git history if
    // this ever needs re-cutting from the source photo.
    images: [{ url: '/images/og/save-the-date.jpg', width: 1200, height: 630 }],
    videos: [
      {
        url: OG_VIDEO_URL,
        secureUrl: OG_VIDEO_URL,
        type: 'video/mp4',
        width: 1920,
        height: 1080,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ['/images/og/save-the-date.jpg'],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Beni & Dorah' },
};

export const viewport: Viewport = {
  themeColor: '#1B3FA0',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${sansFont.variable} ${handFont.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
