"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SITE_COPY } from "@/lib/content";
import SectionHeader from "./SectionHeader";
import { useLocale } from "./LocaleProvider";
import { pickDb } from "@/lib/i18n";
import { useSocketEvent } from "@/lib/useSocket";
import { useActivityLog } from "./ActivityLogProvider";

export interface GiftEntry {
  id: string;
  name: string;
  nameFr: string | null;
  description: string | null;
  descriptionFr: string | null;
  imageUrl: string | null;
  priceZar: string;
  priceUsd: string;
  status: "available" | "booked" | "paid";
}

export default function GiftRegistry({
  gifts,
  guestId,
}: {
  gifts: GiftEntry[];
  guestId?: string | null;
}) {
  const { locale, t } = useLocale();
  const { logAction } = useActivityLog();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(gifts);
  // Which gift's "I will gift it" reveal (the bank account details) is
  // currently open — at most one at a time, same as the old contribute form.
  const [depositOpenId, setDepositOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  // Which gift is mid-flight claiming itself as "bringing cash on the
  // day" — disables that button so a double-click can't fire two requests.
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { bank } = SITE_COPY;

  // Collapsing the list shrinks it from ~4000px back down to 260px —
  // without this, whatever scroll position the page was at (likely deep
  // inside the now-gone items) stays put, stranding the viewport over
  // blank space below the list. Scroll back to the top of the list
  // whenever "Show less" is the action being taken.
  function handleToggleExpanded() {
    const collapsing = expanded;
    setExpanded(!expanded);
    logAction(collapsing ? "gift_show_less" : "gift_show_all");
    if (collapsing) {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  const viewingGift = viewingId
    ? (items.find((g) => g.id === viewingId) ?? null)
    : null;

  function handleViewGift(gift: GiftEntry) {
    setViewingId(gift.id);
    logAction("gift_view", { giftId: gift.id, name: gift.name });
  }

  // The only thing ever broadcast for a gift is a successful claim (the
  // reserve endpoint is the sole emitter), so any other guest's "I will
  // bring cash on the day" click can just flip this client's copy to
  // booked too — no need to refetch the whole list.
  useSocketEvent<{ giftId: string }>("gift:updated", (payload) => {
    setItems((prev) =>
      prev.map((g) =>
        g.id === payload.giftId ? { ...g, status: "booked" } : g,
      ),
    );
  });

  // Lock page scroll while the gift popup is open, and let Escape close it.
  useEffect(() => {
    if (!viewingId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setViewingId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewingId]);

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

  // Same atomic "claim it" endpoint the old "I will buy it" button used —
  // an available→booked conditional update, so two guests clicking at once
  // can't both win the same gift. Here it's reached via "I will bring cash
  // on the day" rather than a deposit, but the claim itself is identical.
  async function handleBringCash(id: string, name: string) {
    setClaimingId(id);
    logAction("gift_claim_attempt", { giftId: id, name });
    try {
      const res = await fetch(`/api/gifts/${id}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guestId ?? null }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((g) => (g.id === id ? { ...g, status: "booked" } : g)),
        );
        setDepositOpenId(null);
        logAction("gift_claim_success", { giftId: id, name });
      } else {
        toast.error(t("giftRegistry.claimError"));
        logAction("gift_claim_error", { giftId: id, name });
      }
    } catch {
      toast.error(t("giftRegistry.claimError"));
      logAction("gift_claim_error", { giftId: id, name });
    } finally {
      setClaimingId(null);
    }
  }

  // The bank details block — shown once in the sidebar, and again inline
  // whenever a "Make a deposit" button is opened (grid card or popup),
  // so a guest never has to scroll away from a gift to see where to pay.
  function renderAccountDetails() {
    return (
      <dl className="grid grid-cols-2 gap-y-2 bg-cream p-4 text-xs">
        <dt className="text-charcoal/50">{t("giftRegistry.accountName")}</dt>
        <dd className="text-right font-medium text-onyx">
          {bank.accountName}
        </dd>
        <dt className="text-charcoal/50">{t("giftRegistry.accountNumber")}</dt>
        <dd className="text-right font-medium text-onyx">
          <button
            onClick={handleCopyAccountNumber}
            className="group inline-flex items-center gap-1.5 transition-colors hover:text-champagne-gold"
            aria-label={t("giftRegistry.copyAria")}
            title={t("giftRegistry.copyTitle")}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-charcoal/25 transition-colors group-hover:border-champagne-gold">
              {copied ? (
                <svg
                  width="11"
                  height="11"
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
                  width="11"
                  height="11"
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
        <dd className="text-right font-medium text-onyx">{bank.bankName}</dd>
        <dt className="text-charcoal/50">{t("giftRegistry.branchCode")}</dt>
        <dd className="text-right font-medium text-onyx">
          {bank.branchCode}
        </dd>
      </dl>
    );
  }

  // Shared between the grid card and the popup, so both offer the exact
  // same "Make a deposit" action rather than the popup being a read-only
  // preview.
  function renderGiftActions(gift: GiftEntry) {
    if (gift.status !== "available") {
      return (
        <div className="mt-auto pt-2">
          <span className="block border border-charcoal/15 px-4 py-2 text-center text-[11px] uppercase tracking-widest text-charcoal/50">
            {gift.status === "paid" ? t("giftRegistry.receivedThanks") : t("giftRegistry.alreadyClaimed")}
          </span>
        </div>
      );
    }

    return (
      <div className="mt-auto flex flex-col gap-2 pt-2">
        {depositOpenId === gift.id ? (
          <>
            <p className="text-[11px] font-medium uppercase tracking-widest text-charcoal/60">
              {t("giftRegistry.depositHeader")}
            </p>
            {renderAccountDetails()}
            <p className="text-center text-[11px] uppercase tracking-widest text-charcoal/40">
              {t("giftRegistry.or")}
            </p>
            <button
              onClick={() => handleBringCash(gift.id, gift.name)}
              disabled={claimingId === gift.id}
              className="btn-gold px-4 py-2 text-[11px] uppercase tracking-widest disabled:opacity-60"
            >
              {claimingId === gift.id
                ? t("giftRegistry.claiming")
                : t("giftRegistry.bringCash")}
            </button>
            <button
              onClick={() => {
                setDepositOpenId(null);
                logAction("gift_hide_details", { giftId: gift.id, name: gift.name });
              }}
              className="text-left text-[11px] uppercase tracking-widest text-charcoal/40 underline underline-offset-4"
            >
              {t("giftRegistry.hideDetails")}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setDepositOpenId(gift.id);
              logAction("gift_deposit_view", { giftId: gift.id, name: gift.name });
            }}
            className="btn-gold px-4 py-2 text-[11px] uppercase tracking-widest"
          >
            {t("giftRegistry.iWillGiftIt")}
          </button>
        )}
      </div>
    );
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

      <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="hairline-gold overflow-hidden"
        >
          <div className="bg-onyx p-8 text-ivory sm:p-10">
            <p className="text-lg leading-relaxed text-ivory/85">
              {t("giftRegistry.intro")}
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

        <div className="flex flex-col gap-6">
          <p className="text-sm text-charcoal/60">
            {t("giftRegistry.preference")}
          </p>

          <div
            ref={listRef}
            className="relative"
            style={{ scrollMarginTop: 88 }}
          >
            <motion.div
              animate={{ maxHeight: expanded ? 4000 : 260 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-5 overflow-hidden sm:grid-cols-2"
            >
              {items.map((gift) => {
                const name = pickDb(gift.name, gift.nameFr, locale);
                const description = pickDb(gift.description || "", gift.descriptionFr, locale) || null;
                return (
                  <div
                    key={gift.id}
                    className="hairline flex flex-col overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => handleViewGift(gift)}
                      className="block text-left"
                      aria-label={t("giftRegistry.viewAria").replace("{name}", name)}
                    >
                      <div className="relative h-36 w-full bg-cream">
                        {gift.imageUrl && (
                          <Image
                            src={gift.imageUrl}
                            alt={name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    </button>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <button
                        type="button"
                        onClick={() => handleViewGift(gift)}
                        className="text-left"
                      >
                        <h3 className="section-title text-base text-onyx">
                          {name}
                        </h3>
                        {description && (
                          <p className="text-xs text-charcoal/60">
                            {description}
                          </p>
                        )}
                        <p className="section-title text-lg text-royal-blue">
                          R{Number(gift.priceZar).toLocaleString("en-ZA")}{" "}
                          <span className="text-xs font-normal text-charcoal/40">
                            · ${Number(gift.priceUsd).toLocaleString("en-US")}
                          </span>
                        </p>
                      </button>

                      {renderGiftActions(gift)}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-32 items-end justify-center bg-gradient-to-t from-onyx/70 via-onyx/50 to-transparent pb-6">
              <button
                type="button"
                onClick={handleToggleExpanded}
                className="btn-gold pointer-events-auto px-8 py-3 text-xs uppercase tracking-widest"
              >
                {expanded ? t("giftRegistry.showLess") : t("giftRegistry.showAllGifts")}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {viewingGift && (() => {
            const viewingName = pickDb(viewingGift.name, viewingGift.nameFr, locale);
            const viewingDescription = pickDb(viewingGift.description || "", viewingGift.descriptionFr, locale) || null;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-onyx/70 p-4 sm:p-8"
                onClick={() => setViewingId(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="hairline relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto bg-ivory"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setViewingId(null)}
                    aria-label={t("giftRegistry.closeAria")}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-onyx/80 text-ivory transition-colors hover:bg-onyx"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>

                  {viewingGift.imageUrl && (
                    <div className="relative h-64 w-full shrink-0 bg-cream sm:h-80">
                      <Image
                        src={viewingGift.imageUrl}
                        alt={viewingName}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 p-6 sm:p-8">
                    <h3 className="section-title text-2xl text-onyx">
                      {viewingName}
                    </h3>
                    {viewingDescription && (
                      <p className="text-sm text-charcoal/60">
                        {viewingDescription}
                      </p>
                    )}
                    <p className="section-title text-2xl text-royal-blue">
                      R{Number(viewingGift.priceZar).toLocaleString("en-ZA")}{" "}
                      <span className="text-sm font-normal text-charcoal/40">
                        · ${Number(viewingGift.priceUsd).toLocaleString("en-US")}
                      </span>
                    </p>

                    {renderGiftActions(viewingGift)}
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </section>
  );
}
