'use client';

import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import Button from './Button';
import { IconWhatsApp } from './icons';
import type { SaveTheDateLocale } from '@/lib/save-the-date';

/**
 * The "Save the date" (Guests page) / "Resend" (Invited/RSVPs page)
 * button — a single WhatsApp-icon button that, on click, offers a choice
 * of language before opening the wa.me link, instead of always sending
 * English.
 */
export default function WhatsAppSendButton({
  label,
  onSend,
}: {
  label: string;
  onSend: (locale: SaveTheDateLocale) => void;
}) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>
        <Button variant="outline" size="sm" icon={<IconWhatsApp width={14} height={14} />}>
          {label}
        </Button>
      </RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-[10rem] overflow-hidden rounded-xl border border-onyx/10 bg-white py-1.5 shadow-lg
            data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out"
        >
          <RadixMenu.Item
            onSelect={() => onSend('en')}
            className="cursor-pointer px-3.5 py-2 text-sm text-onyx outline-none transition-colors hover:bg-ivory data-[highlighted]:bg-ivory"
          >
            Send in English
          </RadixMenu.Item>
          <RadixMenu.Item
            onSelect={() => onSend('fr')}
            className="cursor-pointer px-3.5 py-2 text-sm text-onyx outline-none transition-colors hover:bg-ivory data-[highlighted]:bg-ivory"
          >
            Send in French
          </RadixMenu.Item>
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
