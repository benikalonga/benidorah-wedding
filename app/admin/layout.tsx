import { getAdminSession } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // No session means this can only be /admin/login (middleware redirects
  // every other /admin/* path there) — render it bare, without the shell.
  if (!session) return <>{children}</>;

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
