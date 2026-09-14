"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_COPY } from "@/lib/content";
import SectionHeader from "./SectionHeader";

export interface GiftEntry {
  id: string;
  name: string;
  description: string | null;
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
  guestId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(gifts);
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
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
    if (collapsing) {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  const viewingGift = viewingId
    ? (items.find((g) => g.id === viewingId) ?? null)
    : null;

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
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleBookIt(id: string) {
    const res = await fetch(`/api/gifts/${id}/reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status: "booked" } : g)),
      );
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus(
        data.error ||
          "Could not claim this gift — someone may have just booked it.",
      );
    }
  }

  async function handleContribute(id: string) {
    const res = await fetch(`/api/gifts/${id}/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestId,
        amountZar: Number(amount),
        contributorName,
      }),
    });
    if (res.ok) {
      setStatus("Thank you — your contribution has been recorded.");
      setContributingId(null);
      setAmount("");
      setContributorName("");
    } else {
      setStatus(
        "Something went wrong recording your contribution — please try again.",
      );
    }
  }

  // Shared between the grid card and the popup, so both offer the exact
  // same buy/contribute actions rather than the popup being a read-only
  // preview.
  function renderGiftActions(gift: GiftEntry) {
    return (
      <div className="mt-auto flex flex-col gap-2 pt-2">
        {gift.status === "available" ? (
          <button
            onClick={() => handleBookIt(gift.id)}
            className="btn-gold px-4 py-2 text-[11px] uppercase tracking-widest"
          >
            I will buy it
          </button>
        ) : (
          <span className="border border-charcoal/15 px-4 py-2 text-center text-[11px] uppercase tracking-widest text-charcoal/50">
            {gift.status === "paid"
              ? "Received with thanks"
              : "Already claimed"}
          </span>
        )}

        {contributingId === gift.id ? (
          <div className="flex flex-col gap-2 bg-cream p-3">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              className="field-underline text-xs"
            />
            <input
              type="number"
              placeholder="Amount (ZAR)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="field-underline text-xs"
            />
            <button
              onClick={() => handleContribute(gift.id)}
              className="btn-primary px-3 py-2 text-[11px] uppercase tracking-widest"
            >
              Confirm contribution
            </button>
          </div>
        ) : (
          <button
            onClick={() => setContributingId(gift.id)}
            className="text-left text-[11px] uppercase tracking-widest text-champagne-gold underline underline-offset-4"
          >
            Make a deposit toward this
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
        <SectionHeader index="04" eyebrow="With Love" title="Gift Registry" />
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
              Your presence will be the best gift of all. If you'd love to spoil
              us a little too, you are welcome to do so.
            </p>
          </div>

          <div className="h-px bg-champagne-gold/50" aria-hidden />

          <dl className="grid grid-cols-2 gap-y-3 bg-ivory p-8 text-sm sm:p-10">
            <dt className="text-charcoal/50">Account Name</dt>
            <dd className="text-right font-medium text-onyx">
              {bank.accountName}
            </dd>
            <dt className="text-charcoal/50">Account Number</dt>
            <dd className="text-right font-medium text-onyx">
              <button
                onClick={handleCopyAccountNumber}
                className="group inline-flex items-center gap-2 transition-colors hover:text-champagne-gold"
                aria-label="Copy account number"
                title="Click to copy account number"
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
            <dt className="text-charcoal/50">Account Type</dt>
            <dd className="text-right font-medium text-onyx">
              {bank.accountType}
            </dd>
            <dt className="text-charcoal/50">Bank</dt>
            <dd className="text-right font-medium text-onyx">
              {bank.bankName}
            </dd>
            <dt className="text-charcoal/50">Branch Code</dt>
            <dd className="text-right font-medium text-onyx">
              {bank.branchCode}
            </dd>
          </dl>
        </motion.div>

        <div className="flex flex-col gap-6">
          <p className="text-sm text-charcoal/60">
            As a couple, our preference is a deposit toward a gift's value —
            or its cash equivalent brought along on the day — rather than the
            item itself, though you're still welcome to bring a physical
            gift. Pick one from the list below.
          </p>

          {status && <p className="text-sm text-royal-blue">{status}</p>}

          <div ref={listRef} className="relative" style={{ scrollMarginTop: 88 }}>
            <motion.div
              animate={{ maxHeight: expanded ? 4000 : 260 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-5 overflow-hidden sm:grid-cols-2"
            >
              {items.map((gift) => (
                <div
                  key={gift.id}
                  className="hairline flex flex-col overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setViewingId(gift.id)}
                    className="block text-left"
                    aria-label={`View ${gift.name}`}
                  >
                    <div className="relative h-36 w-full bg-cream">
                      {gift.imageUrl && (
                        <Image
                          src={gift.imageUrl}
                          alt={gift.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  </button>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <button
                      type="button"
                      onClick={() => setViewingId(gift.id)}
                      className="text-left"
                    >
                      <h3 className="section-title text-base text-onyx">
                        {gift.name}
                      </h3>
                      {gift.description && (
                        <p className="text-xs text-charcoal/60">
                          {gift.description}
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
              ))}
            </motion.div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-32 items-end justify-center bg-gradient-to-t from-onyx/70 via-onyx/50 to-transparent pb-6">
              <button
                type="button"
                onClick={handleToggleExpanded}
                className="btn-gold pointer-events-auto px-8 py-3 text-xs uppercase tracking-widest"
              >
                {expanded ? "Show less" : "Show all gifts →"}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {viewingGift && (
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
                  aria-label="Close"
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
                      alt={viewingGift.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2 p-6 sm:p-8">
                  <h3 className="section-title text-2xl text-onyx">
                    {viewingGift.name}
                  </h3>
                  {viewingGift.description && (
                    <p className="text-sm text-charcoal/60">
                      {viewingGift.description}
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
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
