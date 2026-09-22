"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SITE_COPY } from "@/lib/content";
import SectionHeader from "./SectionHeader";
import { useLocale } from "./LocaleProvider";
import { useActivityLog } from "./ActivityLogProvider";

export default function GiftRegistry() {
  const { t } = useLocale();
  const { logAction } = useActivityLog();
  const [copied, setCopied] = useState(false);

  const { bank } = SITE_COPY;

  async function handleCopyAccountNumber() {
    const text = bank.accountNumber;
    let success = false;

    // navigator.clipboard is only exposed in a "secure context" — https,
    // or the special-cased `localhost`. A phone hitting the site over its
    // plain-HTTP LAN IP (e.g. http://192.168.x.x:3400) is NOT secure, so
    // this API is simply undefined there and silently does nothing.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success) {
      // Classic hidden-textarea + execCommand fallback — deprecated, but
      // it still works without a secure context, which is exactly the
      // gap the async Clipboard API leaves on a plain-HTTP LAN address.
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "-9999px";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      logAction("copy_account_number");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section
      id="gifts"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader index="04" eyebrow={t("giftRegistry.eyebrow")} title={t("giftRegistry.title")} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="hairline-gold mx-auto mt-10 max-w-xl overflow-hidden"
      >
        <div className="flex flex-col gap-4 bg-onyx p-8 text-ivory sm:p-10">
          <p className="text-lg leading-relaxed text-ivory/85">
            {t("giftRegistry.intro")}
          </p>
          <p className="text-sm leading-relaxed text-ivory/70">
            {t("giftRegistry.preference")}
          </p>
        </div>

        <div className="h-px bg-champagne-gold/50" aria-hidden />

        <dl className="grid grid-cols-2 gap-y-3 bg-ivory p-8 text-sm sm:p-10">
          <dt className="text-charcoal/50">{t("giftRegistry.accountName")}</dt>
          <dd className="text-right font-medium text-onyx">
            {bank.accountName}
          </dd>
          <dt className="text-charcoal/50">{t("giftRegistry.accountNumber")}</dt>
          <dd className="text-right font-medium text-onyx">
            <button
              onClick={handleCopyAccountNumber}
              className="group inline-flex items-center gap-2 transition-colors hover:text-champagne-gold"
              aria-label={t("giftRegistry.copyAria")}
              title={t("giftRegistry.copyTitle")}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-charcoal/25 transition-colors group-hover:border-champagne-gold">
                {copied ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      d="M20 6 9 17l-5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="12" height="12" rx="1.5" />
                    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                  </svg>
                )}
              </span>
              {bank.accountNumber}
            </button>
          </dd>
          <dt className="text-charcoal/50">{t("giftRegistry.accountType")}</dt>
          <dd className="text-right font-medium text-onyx">
            {bank.accountType}
          </dd>
          <dt className="text-charcoal/50">{t("giftRegistry.bank")}</dt>
          <dd className="text-right font-medium text-onyx">
            {bank.bankName}
          </dd>
          <dt className="text-charcoal/50">{t("giftRegistry.branchCode")}</dt>
          <dd className="text-right font-medium text-onyx">
            {bank.branchCode}
          </dd>
        </dl>
      </motion.div>
    </section>
  );
}
