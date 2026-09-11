import type { Metadata, Viewport } from 'next';
import { displayFont, sansFont, handFont } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://benidorah.com'),
  title: "Beni & Dorah — 23 December 2026",
  description: "Join Beni & Dorah as they celebrate their wedding on 23 December 2026 at Suitability Gardens, De Deur, South Africa.",
  manifest: '/manifest.json',
  openGraph: {
    title: 'Beni & Dorah — 23 December 2026',
    description: "Join us as we celebrate our wedding — RSVP, gallery, and more.",
    images: ['/images/couple/hero-poster.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beni & Dorah — 23 December 2026',
    images: ['/images/couple/hero-poster.jpg'],
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
