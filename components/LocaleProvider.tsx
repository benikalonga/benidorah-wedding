"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "benidorah-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  /** Dot-path lookup into lib/i18n's translations, e.g. t('giftRegistry.makeDeposit'). */
  t: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function lookup(path: string, locale: Locale): string | undefined {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = translations[locale];
  for (const part of parts) {
    node = node?.[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Always starts "en" on both server and first client render (no
  // hydration mismatch), then swaps to a saved preference — if any —
  // right after mount. A guest with no saved preference simply keeps
  // seeing English, matching the site's actual default language.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "fr") setLocaleState(saved);
    } catch {
      // localStorage can throw in a private/locked-down browser context —
      // just stay on the default "en" rather than crash the page over it.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Same non-fatal reasoning as above — the toggle still works for the
      // rest of this visit even if it can't persist for next time.
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "fr" : "en");
  }, [locale, setLocale]);

  const t = useCallback(
    (path: string) => lookup(path, locale) ?? lookup(path, "en") ?? path,
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, toggleLocale, t }), [locale, setLocale, toggleLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
