import WeddingPage from '@/components/WeddingPage';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return <WeddingPage guest={null} />;
}
