"use client";

import { useState } from "react";
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
  const [showRegistry, setShowRegistry] = useState(false);
  const [items, setItems] = useState(gifts);
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
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
              us a little too, you are welcome to do so .
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
            You're also welcome to bring a gift along on the day, or pick one
            from the list below.
          </p>

          <button
            onClick={() => setShowRegistry((v) => !v)}
            className="btn-outline self-start px-8 py-3.5 text-xs uppercase tracking-widest"
          >
            {showRegistry ? "Hide gift registry" : "View gift registry →"}
          </button>

          {status && <p className="text-sm text-royal-blue">{status}</p>}

          <AnimatePresence>
            {showRegistry && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="grid gap-5 overflow-hidden sm:grid-cols-2"
              >
                {items.map((gift) => (
                  <div
                    key={gift.id}
                    className="hairline flex flex-col overflow-hidden"
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
                    <div className="flex flex-1 flex-col gap-2 p-4">
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
                              onChange={(e) =>
                                setContributorName(e.target.value)
                              }
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
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
