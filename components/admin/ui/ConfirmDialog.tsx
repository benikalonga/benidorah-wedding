'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Dialog from './Dialog';
import Button from './Button';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Mounted once in AdminShell. Lets any page call `const confirm = useConfirm()`
 * and `await confirm({ title, description })` to get a themed yes/no dialog
 * in place of the browser's native `window.confirm` — used for every
 * destructive action (delete guest/table/moment, etc.).
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<(value: boolean) => void>();

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function handleClose(result: boolean) {
    setOptions(null);
    resolveRef.current?.(result);
  }

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog
        open={!!options}
        onOpenChange={(open) => !open && handleClose(false)}
        title={options?.title || ''}
        description={options?.description}
        footer={
          <>
            <Button variant="ghost" onClick={() => handleClose(false)}>
              {options?.cancelLabel || 'Cancel'}
            </Button>
            <Button variant={options?.danger ? 'danger' : 'primary'} onClick={() => handleClose(true)}>
              {options?.confirmLabel || 'Confirm'}
            </Button>
          </>
        }
      >
        {/* Description already renders in the dialog header; body stays empty
            for this simple yes/no shape. */}
        <span className="sr-only">Confirm action</span>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
