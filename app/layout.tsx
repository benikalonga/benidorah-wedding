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
    images: [{ url: '/images/gallery/27.jpeg', width: 3123, height: 4160 }],
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
    images: ['/images/gallery/27.jpeg'],
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
