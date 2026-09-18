import { notFound } from 'next/navigation';
import WeddingPage from '@/components/WeddingPage';
import { getGuestByHash } from '@/lib/content';

export const dynamic = 'force-dynamic';

// Guest hash routes are a capability token (long, random, non-guessable —
// see Guest.userHashCode / prisma/seed.ts) that unlocks the personalised
// RSVP flow. An unknown hash renders the same generic experience as `/`
// rather than a 404, since a mistyped/expired link shouldn't look broken.
// A hash with no language segment (see ./[locale]/page.tsx) defaults to
// English — the only case that lands here is an old link sent before the
// language segment existed, or the hash shared bare.
export default async function GuestPage({ params }: { params: { hash: string } }) {
  if (params.hash.length < 6) notFound();
  const guest = await getGuestByHash(params.hash);
  return <WeddingPage guest={guest} />;
}
