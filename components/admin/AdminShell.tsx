'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/guests', label: 'Guests' },
  { href: '/admin/tables', label: 'Tables' },
  { href: '/admin/invited', label: 'Invited / RSVPs' },
  { href: '/admin/moments', label: 'Moments' },
  { href: '/admin/tickets', label: 'Wish Wall Tickets' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-ivory text-charcoal">
      <aside className="flex w-56 shrink-0 flex-col border-r border-onyx/10 bg-onyx text-ivory">
        <div className="p-5">
          <p className="section-title text-lg">Beni &amp; Dorah</p>
          <p className="text-xs text-ivory/50">Admin console</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === item.href ? 'bg-champagne-gold text-onyx' : 'hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-ivory/60">
          <p className="truncate">{email}</p>
          <button onClick={handleLogout} className="mt-2 text-champagne-gold hover:underline">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-6">{children}</main>
    </div>
  );
}
