'use client';

import { useEffect, useState } from 'react';
import { useLocale } from './LocaleProvider';
import { useActivityLog } from './ActivityLogProvider';

export default function InstallPrompt() {
  const { t } = useLocale();
  const { logAction } = useActivityLog();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="hairline-gold fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-4 bg-onyx px-5 py-4 text-ivory sm:inset-x-auto sm:right-4 sm:w-96">
      <p className="text-sm">{t('installPrompt.message')}</p>
      <div className="flex shrink-0 gap-3">
        <button
          className="btn-gold px-4 py-2 text-[11px] uppercase tracking-widest"
          onClick={async () => {
            logAction('install_prompt_install');
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
          }}
        >
          {t('installPrompt.install')}
        </button>
        <button
          className="text-[11px] uppercase tracking-widest text-ivory/50"
          onClick={() => {
            setDismissed(true);
            logAction('install_prompt_dismiss');
          }}
        >
          {t('installPrompt.later')}
        </button>
      </div>
    </div>
  );
}
