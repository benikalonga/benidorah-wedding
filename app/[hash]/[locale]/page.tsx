import { notFound } from 'next/navigation';
import WeddingPage from '@/components/WeddingPage';
import { getGuestByHash } from '@/lib/content';
import type { Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

// Same guest hash route as ../page.tsx, plus an explicit language segment
// so the invitation link itself (see lib/invitation.ts) decides which
// language the site opens in — no reliance on a saved browser preference.
// `/<hash>` with no language segment still works (see ../page.tsx) and
// defaults to English.
export default async function GuestPageWithLocale({
  params,
}: {
  params: { hash: string; locale: string };
}) {
  if (params.hash.length < 6) notFound();
  if (params.locale !== 'en' && params.locale !== 'fr') notFound();

  const guest = await getGuestByHash(params.hash);
  return <WeddingPage guest={guest} initialLocale={params.locale as Locale} />;
}
