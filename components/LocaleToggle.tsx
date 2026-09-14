"use client";

import { useLocale } from "./LocaleProvider";

/**
 * Small EN/FR segmented toggle. Rendered in a few places with different
 * visual contexts:
 * - Nav bar (light ivory background) — variant="light" (default), twice
 *   there ("lg:hidden" just before the mobile hamburger, "hidden lg:flex"
 *   inside the desktop link group).
 * - Hero (dark video background) — variant="dark", once in the opening
 *   top bar (next to Sound On/Download) and once in the "second act"
 *   content that crossfades in with the placeholder video.
 */
export default function LocaleToggle({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const { locale, setLocale, t } = useLocale();
  const isDark = variant === "dark";

  return (
    <div
      className={`inline-flex items-center rounded-full p-0.5 text-[11px] uppercase tracking-widest ${
        isDark ? "border border-ivory/25 bg-onyx/30 backdrop-blur-sm" : "hairline"
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label={t("nav.switchToEnglish")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "en"
            ? isDark
              ? "bg-ivory text-onyx"
              : "bg-onyx text-ivory"
            : isDark
              ? "text-ivory/60 hover:text-ivory"
              : "text-charcoal/50 hover:text-onyx"
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
          locale === "fr"
            ? isDark
              ? "bg-ivory text-onyx"
              : "bg-onyx text-ivory"
            : isDark
              ? "text-ivory/60 hover:text-ivory"
              : "text-charcoal/50 hover:text-onyx"
        }`}
      >
        FR
      </button>
    </div>
  );
}
