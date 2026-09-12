"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import { ConfirmProvider } from "./ui/ConfirmDialog";
import {
  IconDashboard,
  IconUsers,
  IconTable,
  IconMail,
  IconImage,
  IconTicket,
  IconSettings,
  IconMenu,
  IconChevronLeft,
  IconLogout,
} from "./ui/icons";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/admin/guests", label: "Guests", icon: IconUsers },
  { href: "/admin/tables", label: "Tables", icon: IconTable },
  { href: "/admin/invited", label: "Invited / RSVPs", icon: IconMail },
  { href: "/admin/moments", label: "Moments", icon: IconImage },
  { href: "/admin/tickets", label: "Wish Wall Tickets", icon: IconTicket },
  { href: "/admin/settings", label: "Settings", icon: IconSettings },
];

const COLLAPSE_KEY = "admin-sidebar-collapsed";

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore the desktop collapse preference — a pure UI nicety, so it's
  // fine to read after mount rather than blocking first paint on it.
  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const currentLabel =
    NAV.find((item) => pathname.startsWith(item.href))?.label || "Admin";

  const sidebarContent = (
    <>
      <div
        className={`flex items-center gap-2.5 px-5 py-5 ${collapsed ? "md:justify-center md:px-0" : ""}`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne-gold/20 text-sm font-semibold text-champagne-gold-light">
          B&D
        </div>
        <div className={collapsed ? "md:hidden" : ""}>
          <p className="section-title text-base leading-tight text-ivory">
            Beni &amp; Dorah
          </p>
          <p className="text-[11px] text-ivory/45">Admin console</p>
        </div>
      </div>
      <button
        onClick={toggleCollapsed}
        className={`hidden w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-ivory/60 transition-colors hover:bg-white/10 hover:text-ivory md:flex ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <IconChevronLeft
          width={16}
          height={16}
          className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
        />
        <span className={collapsed ? "hidden" : ""}>Collapse</span>
      </button>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                collapsed ? "md:justify-center" : ""
              } ${active ? "bg-champagne-gold text-onyx" : "text-ivory/75 hover:bg-white/10 hover:text-ivory"}`}
            >
              <Icon width={18} height={18} className="shrink-0" />
              <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <RadixMenu.Root>
          <RadixMenu.Trigger asChild>
            <button
              className={`mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/10 ${
                collapsed ? "md:justify-center" : ""
              }`}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold uppercase text-ivory/80">
                {email.slice(0, 2)}
              </div>
              <span
                className={`truncate text-xs text-ivory/70 ${collapsed ? "md:hidden" : ""}`}
              >
                {email}
              </span>
            </button>
          </RadixMenu.Trigger>
          <RadixMenu.Portal>
            <RadixMenu.Content
              side="top"
              align="start"
              sideOffset={8}
              className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-onyx/10 bg-white py-1.5 shadow-lg"
            >
              <RadixMenu.Item
                onSelect={handleLogout}
                className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-red-700 outline-none transition-colors data-[highlighted]:bg-ivory"
              >
                <IconLogout width={16} height={16} />
                Log out
              </RadixMenu.Item>
            </RadixMenu.Content>
          </RadixMenu.Portal>
        </RadixMenu.Root>
      </div>
    </>
  );

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-ivory text-charcoal">
        <Toaster position="top-right" richColors closeButton />

        {/* Desktop sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-onyx transition-[width] duration-200 md:flex ${
            collapsed ? "w-[76px]" : "w-64"
          }`}
        >
          {sidebarContent}
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-onyx/60"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-onyx shadow-xl">
              {sidebarContent}
            </aside>
          </div>
        )}

        <div
          className={`transition-[margin] duration-200 ${collapsed ? "md:ml-[76px]" : "md:ml-64"}`}
        >
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-onyx/10 bg-ivory/90 px-4 py-3.5 backdrop-blur sm:px-6 lg:px-10">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-onyx/70 hover:bg-onyx/[0.06] md:hidden"
            >
              <IconMenu width={20} height={20} />
            </button>
            <p className="section-title text-base text-onyx sm:text-lg">
              {currentLabel}
            </p>
          </header>

          <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            {/* Caps line length on very wide monitors — without this, a
                6-column table or a form dialog's trigger row just stretches
                thin across the whole screen instead of reading as a
                deliberate layout. */}
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
