'use client';

import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { IconMoreVertical } from './icons';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  /** Render as a plain link instead of a button (e.g. an external wa.me href). */
  href?: string;
  target?: string;
}

/**
 * A "⋮" kebab menu for per-row actions — replaces a crowded row of pill
 * buttons that doesn't fit on a phone screen with a single tap target that
 * reveals the same actions in a themed dropdown.
 */
export default function DropdownMenu({ items, label = 'Actions' }: { items: MenuItem[]; label?: string }) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/50 transition-colors hover:bg-onyx/[0.06] hover:text-onyx"
        >
          <IconMoreVertical width={18} height={18} />
        </button>
      </RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[190px] overflow-hidden rounded-xl border border-onyx/10 bg-white py-1.5 shadow-lg
            data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out"
        >
          {items.map((item, i) =>
            item.href ? (
              <RadixMenu.Item key={i} asChild>
                <a
                  href={item.href}
                  target={item.target}
                  rel="noopener noreferrer"
                  className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-onyx outline-none transition-colors hover:bg-ivory data-[highlighted]:bg-ivory"
                >
                  {item.icon}
                  {item.label}
                </a>
              </RadixMenu.Item>
            ) : (
              <RadixMenu.Item
                key={i}
                onSelect={item.onSelect}
                className={`flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-ivory ${
                  item.danger ? 'text-red-700' : 'text-onyx hover:bg-ivory'
                }`}
              >
                {item.icon}
                {item.label}
              </RadixMenu.Item>
            )
          )}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
