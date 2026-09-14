"use client";

import { useLocale } from "./LocaleProvider";

/**
 * Small EN/FR segmented toggle for the Nav bar — rendered twice there
 * (once "lg:hidden" just before the mobile hamburger, once "hidden lg:flex"
 * inside the desktop link group) rather than made responsive internally,
 * matching how Nav.tsx already handles every other mobile/desktop split.
 */
export default function LocaleToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={`hairline inline-flex items-center rounded-full p-0.5 text-[11px] uppercase tracking-widest ${className}`}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label={t("nav.switchToEnglish")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "en" ? "bg-onyx text-ivory" : "text-charcoal/50 hover:text-onyx"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("fr")}
        aria-pressed={locale === "fr"}
        aria-label={t("nav.switchToFrench")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "fr" ? "bg-onyx text-ivory" : "text-charcoal/50 hover:text-onyx"
        }`}
      >
        FR
      </button>
    </div>
  );
}
