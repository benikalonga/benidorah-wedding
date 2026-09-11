"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeader from "./SectionHeader";

export interface HistoryEntry {
  id: string;
  title: string;
  descriptionShort: string;
  descriptionFull: string;
  eventDate: string;
  thumbnailUrl: string;
  images: { id: string; imageUrl: string }[];
}

export default function History({ items }: { items: HistoryEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const visible = expanded ? items : items.slice(0, 5);

  return (
    <section
      id="history"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader
          index="01"
          eyebrow="Our Love Story"
          title="History"
          description={'From the day we met, to the day we say "I do."'}
        />
      </motion.div>

      <div className="relative mt-10">
        {/* The spine: a left-aligned rail on mobile, a true center line from
            md up — each item's numbered marker sits directly on it. */}
        <div
          className="absolute inset-y-0 left-4 w-px bg-champagne-gold/25 md:left-1/2 md:-translate-x-1/2"
          aria-hidden
        />

        <ol className="space-y-10 md:space-y-16">
          {visible.map((item, idx) => {
            // Alternates every other milestone to the opposite side of the
            // center line on desktop — 0,2,4… on the left (text hugging the
            // line, reading toward it), 1,3,5… on the right.
            const onLeft = idx % 2 === 0;

            const card = (
              <button
                onClick={() => setSelected(item)}
                className={`group inline-flex w-full max-w-md items-center gap-4 pb-2 text-left ${
                  onLeft ? "md:flex-row-reverse md:text-right" : ""
                }`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden sm:h-20 sm:w-24">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div>
                  <p className="eyebrow text-champagne-gold">
                    {new Date(item.eventDate).toLocaleDateString("en-ZA", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h3 className="section-title mt-1 text-xl text-onyx sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-charcoal/60">
                    {item.descriptionShort}
                  </p>
                  <span className="mt-1 inline-block text-[10px] uppercase tracking-widest text-charcoal/30 transition-colors group-hover:text-champagne-gold">
                    Read more →
                  </span>
                </div>
              </button>
            );

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.7,
                  delay: (idx % 4) * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative pl-12 md:pl-0"
              >
                {/* Numbered marker, pinned to the spine */}
                <span className="eyebrow-num absolute left-4 top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-champagne-gold bg-ivory text-[11px] text-champagne-gold md:left-1/2">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <div className="md:grid md:grid-cols-2 md:gap-x-16">
                  <div className={onLeft ? "" : "hidden md:block"}>
                    {onLeft && card}
                  </div>
                  <div className={!onLeft ? "" : "hidden md:block"}>
                    {!onLeft && card}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      {items.length > 5 && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="btn-outline rounded-full px-8 py-3 text-xs uppercase"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-onyx/90 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="hairline-gold max-h-[85vh] w-full max-w-xl overflow-y-auto bg-ivory p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <p className="eyebrow text-champagne-gold">
                  {new Date(selected.eventDate).toLocaleDateString("en-ZA", {
                    dateStyle: "long",
                  })}
                </p>
                <button
                  className="text-onyx"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <h3 className="section-title mt-3 text-3xl text-onyx">
                {selected.title}
              </h3>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-charcoal/80">
                {selected.descriptionFull}
              </p>
              {selected.images.length > 0 && (
                <div className="mt-6 flex gap-2 overflow-x-auto">
                  {selected.images.map((img) => (
                    <div
                      key={img.id}
                      className="relative h-32 w-32 shrink-0 overflow-hidden"
                    >
                      <Image
                        src={img.imageUrl}
                        alt={selected.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
