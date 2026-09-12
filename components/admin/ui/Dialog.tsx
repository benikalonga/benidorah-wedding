'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { IconX } from './icons';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Rendered inside a sticky footer bar, e.g. Cancel/Save buttons. */
  footer?: ReactNode;
}

/**
 * Themed wrapper around Radix's Dialog — used for every add/edit form and
 * detail popup in the admin console instead of inline forms or a native
 * `alert`. Radix handles focus trapping, ESC-to-close, and ARIA wiring;
 * this just applies the site's look.
 */
export default function Dialog({ open, onOpenChange, title, description, children, footer }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-onyx/60 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <RadixDialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2
            -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl focus:outline-none
            data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-start justify-between border-b border-onyx/10 px-6 py-4">
            <div>
              <RadixDialog.Title className="section-title text-lg text-onyx">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-0.5 text-xs text-charcoal/60">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-charcoal/50 transition-colors hover:bg-onyx/[0.06] hover:text-onyx"
              >
                <IconX width={16} height={16} />
              </button>
            </RadixDialog.Close>
          </div>

          <div className="overflow-y-auto px-6 py-5">{children}</div>

          {footer && <div className="flex justify-end gap-3 border-t border-onyx/10 bg-ivory/60 px-6 py-4">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
