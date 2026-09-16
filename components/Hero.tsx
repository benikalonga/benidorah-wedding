"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import Image from "next/image";
import CountdownTimer from "./CountdownTimer";
import HeroLoader from "./HeroLoader";
import { WEDDING_DATE_ISO, SITE_COPY } from "@/lib/content";
import { onHeroVideoPauseRequest } from "@/lib/heroPlayback";
import { useLocale } from "./LocaleProvider";
import LocaleToggle from "./LocaleToggle";
import { useRsvpStatus } from "./RsvpStatusProvider";
import { useActivityLog } from "./ActivityLogProvider";

const MIN_LOADER_MS = 1100;
const LOADER_TIMEOUT_MS = 6000;

export default function Hero({
  coupleNames,
  posterSrc,
}: {
  coupleNames: string;
  posterSrc: string;
}) {
  const { t } = useLocale();
  // Shared with RSVPForm — flips to false the instant a guest submits
  // (from anywhere on the page), so this button disappears immediately
  // without needing a reload, not just on a fresh page load.
  const { needsRsvp } = useRsvpStatus();
  const { logAction } = useActivityLog();
  const wrapperRef = useRef<HTMLElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Detect reduced motion, and drive the preloader: it clears only once
  // BOTH a short minimum has elapsed (avoids a jarring flash on fast
  // connections) AND the hero video has actually buffered a frame — with
  // a hard timeout as a safety net for very slow/broken connections.
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(rm);
    if (rm) {
      setShowLoader(false);
      return;
    }
    const minTimer = setTimeout(() => setMinTimeElapsed(true), MIN_LOADER_MS);
    const failsafe = setTimeout(() => setVideoReady(true), LOADER_TIMEOUT_MS);
    const ramp = setInterval(
      () => setLoadProgress((p) => (p < 0.88 ? p + 0.06 : p)),
      140,
    );
    return () => {
      clearTimeout(minTimer);
      clearTimeout(failsafe);
      clearInterval(ramp);
    };
  }, []);

  useEffect(() => {
    if (videoReady && minTimeElapsed) {
      setLoadProgress(1);
      const t = setTimeout(() => setShowLoader(false), 220);
      return () => clearTimeout(t);
    }
  }, [videoReady, minTimeElapsed]);

  // If a video elsewhere on the page (the Gallery/Moments lightbox) starts
  // playing, stop the hero's own video first — but only when its sound is
  // actually on, since a muted background video isn't competing with
  // anything and doesn't need to be interrupted.
  useEffect(
    () =>
      onHeroVideoPauseRequest(() => {
        const video = mainVideoRef.current;
        if (video && !video.muted) {
          video.pause();
        }
      }),
    []
  );

  // Scroll-linked "pinned" hero: the wrapper is only a third of a
  // viewport taller than the screen itself, just enough extra scroll
  // distance to play out the recede/crossfade below. The whole timeline
  // is stretched to finish right as that extra distance runs out, so
  // there's no dead "holding" scroll after the placeholder settles in —
  // the moment it's fully shown, the wrapper releases and History is
  // already scrolling into view underneath it.
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.28], [0, -32]);

  const mainScale = useTransform(scrollYProgress, [0.05, 0.85], [1, 0.7]);
  const mainY = useTransform(scrollYProgress, [0.05, 0.85], [0, -70]);
  const mainRadius = useTransform(scrollYProgress, [0.05, 0.85], [0, 36]);
  const mainOpacity = useTransform(scrollYProgress, [0.35, 0.85], [1, 0]);
  const mainBlurPx = useTransform(scrollYProgress, [0.05, 0.85], [0, 8]);
  const mainFilter = useMotionTemplate`blur(${mainBlurPx}px)`;

  const placeholderOpacity = useTransform(scrollYProgress, [0.5, 0.92], [0, 1]);
  const placeholderScale = useTransform(
    scrollYProgress,
    [0.5, 0.92],
    [1.12, 1],
  );
  // The second act's own LocaleToggle sits at the same screen corner as the
  // opening top bar's — by design, so the control reads as "the same
  // toggle" throughout the scroll. But both are mounted the whole time and
  // only fade via opacity (not display), and this one is later in the DOM,
  // so without gating its pointer-events it would sit on top and silently
  // steal clicks meant for the top bar's toggle while fully invisible
  // (harmless here since both just call the same setLocale, but wrong).
  // Flipping pointer-events at the same threshold opacity starts from
  // keeps only the actually-visible one hit-testable at any given scroll.
  const placeholderInteractive = useTransform(scrollYProgress, (v) =>
    v >= 0.5 ? "auto" : "none",
  );

  const overlayOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.85],
    [0.3, 0.55, 0.4],
  );
  // Fades out as the placeholder video (and its own "second act" content
  // block, with its own Scroll button) crossfades in, so the two Scroll
  // prompts hand off instead of both sitting on screen at once.
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.5, 0.7], [1, 1, 0]);

  const handleToggleMute = () => {
    if (mainVideoRef.current) {
      const next = !mainVideoRef.current.muted;
      mainVideoRef.current.muted = next;
      setMuted(next);
      logAction("sound_toggle", { muted: next });
    }
  };

  const handleScrollToHistory = () => {
    logAction("scroll_to_history");
    document.getElementById("history")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollToRsvp = () => {
    logAction("go_to_invitation_click");
    document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <HeroLoader visible={showLoader} progress={loadProgress} />

      <section
        id="home"
        ref={wrapperRef}
        className={`relative w-full ${reducedMotion ? "h-[100svh]" : "h-[135vh]"}`}
      >
        <div className="grain sticky top-0 h-[100svh] w-full overflow-hidden bg-onyx">
          {reducedMotion ? (
            <Image
              src={posterSrc}
              alt={t("hero.reducedMotionAlt").replace("{names}", coupleNames)}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <>
              <motion.video
                ref={mainVideoRef}
                style={{
                  scale: mainScale,
                  y: mainY,
                  opacity: mainOpacity,
                  borderRadius: mainRadius,
                  filter: mainFilter,
                }}
                className="absolute inset-0 h-full w-full object-cover"
                src="/api/media/hero-main"
                autoPlay
                muted={muted}
                loop
                playsInline
                controlsList="nodownload noremoteplayback"
                onContextMenu={(e) => e.preventDefault()}
                onLoadedData={() => setVideoReady(true)}
                onCanPlay={() => setVideoReady(true)}
              />
              <motion.video
                style={{ opacity: placeholderOpacity, scale: placeholderScale }}
                className="absolute inset-0 h-full w-full object-cover"
                src="/api/media/hero-placeholder"
                autoPlay
                muted
                loop
                playsInline
                controlsList="nodownload noremoteplayback"
                onContextMenu={(e) => e.preventDefault()}
              />
            </>
          )}

          {/* Flat semi-transparent scrim, constant regardless of scroll —
              guarantees the headline/countdown stay legible over a bright
              or busy frame of the video, independent of the scroll-linked
              gradient below which handles the deeper recede-transition
              darkening on top of this baseline. */}
          <div className="absolute inset-0 bg-onyx/45" />
          <motion.div
            style={{ opacity: overlayOpacity }}
            className="absolute inset-0 bg-gradient-to-b from-onyx via-onyx/10 to-onyx"
          />
          <div className="absolute inset-0 bg-grain-fade" />

          <motion.div
            style={{ opacity: contentOpacity }}
            className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5 sm:p-8"
          >
            <span className="eyebrow text-ivory/70">{t("hero.eyebrowNames")}</span>
            <div className="flex items-center gap-2">
              {!reducedMotion && (
                <button
                  onClick={handleToggleMute}
                  className="hairline flex items-center gap-2 rounded-full border-ivory/25 bg-onyx/30 px-4 py-2 text-[11px] uppercase tracking-widest text-ivory backdrop-blur-sm"
                  aria-pressed={!muted}
                >
                  {muted ? (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M11 5 6 9H2v6h4l5 4V5Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" />
                      </svg>
                      <span className="hidden sm:inline">{t("hero.soundOn")}</span>
                      <span className="sm:hidden">{t("hero.soundOnShort")}</span>
                    </>
                  ) : (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M11 5 6 9H2v6h4l5 4V5Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="hidden sm:inline">{t("hero.soundOff")}</span>
                      <span className="sm:hidden">{t("hero.soundOffShort")}</span>
                    </>
                  )}
                </button>
              )}
              <a
                href="/api/media/highlight?download=1"
                download
                onClick={() => logAction("download_highlight")}
                className="hairline flex h-10 w-10 items-center justify-center rounded-full border-ivory/25 bg-onyx/30 text-ivory backdrop-blur-sm"
                aria-label={t("hero.downloadHighlight")}
                title={t("hero.downloadHighlight")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path
                    d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <LocaleToggle variant="dark" />
            </div>
          </motion.div>

          <motion.div
            style={{ opacity: contentOpacity, y: contentY }}
            // Mostly non-interactive centered text over a `h-full` box, so
            // without pointer-events-none its empty flex padding (same
            // z-10 as the top bar, but later in DOM) would win every click
            // in that overlapping region, silently swallowing clicks on
            // the Sound On / Download buttons above it. The one real
            // button here (Go to RSVP) opts back in with its own
            // pointer-events-auto, same pattern as the Scroll button below.
            className="relative z-10 flex h-full flex-col items-center justify-center gap-7 px-6 text-center pointer-events-none"
          >
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="eyebrow text-champagne-gold"
            >
              {t("hero.gettingMarried")}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="display-huge text-6xl text-ivory sm:text-8xl md:text-9xl"
            >
              {coupleNames.split("&")[0].trim()}{" "}
              <span className="text-champagne-gold">&amp;</span>{" "}
              {coupleNames.split("&")[1]?.trim()}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex items-center gap-4 text-ivory/80"
            >
              <span className="divider-onyx w-10" />
              <p className="text-xs uppercase tracking-[0.3em]">
                {t("hero.dateVenueLine").replace("{venue}", SITE_COPY.venueName)}
              </p>
              <span className="divider-onyx w-10" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.55 }}
            >
              <CountdownTimer targetIso={WEDDING_DATE_ISO} />
            </motion.div>

            {needsRsvp && (
              <motion.button
                type="button"
                onClick={handleScrollToRsvp}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.7 }}
                className="btn-gold pointer-events-auto mt-6 px-6 py-3 text-xs uppercase tracking-widest"
              >
                {t("hero.goToRsvp")}
              </motion.button>
            )}
          </motion.div>

          {/* Second act: fades in exactly as the placeholder video crossfades
              in, so the pinned hero doesn't just recede into a bare video —
              it hands off to a second, quieter beat of copy (same content
              pattern as the opening one) before releasing into History.
              pointer-events-none for the same reason as the opening content
              block above (see its comment) — the Scroll button opts back in
              with pointer-events-auto, and the LocaleToggle uses
              placeholderInteractive instead (see its own comment above)
              since it needs to stop being clickable once faded out, not
              just start being clickable once faded in. */}
          <motion.div
            style={{ opacity: placeholderOpacity }}
            className="pointer-events-none absolute inset-0 z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center"
          >
            <motion.div
              style={{ pointerEvents: placeholderInteractive }}
              className="absolute right-5 top-5 sm:right-8 sm:top-8"
            >
              <LocaleToggle variant="dark" />
            </motion.div>
            <p className="eyebrow text-champagne-gold">{t("hero.saveTheDate")}</p>
            <p className="section-title max-w-xl text-2xl italic text-ivory sm:text-3xl md:text-4xl">
              {t("hero.tagline")}
            </p>
            <div className="flex items-center gap-4 text-ivory/80">
              <span className="divider-onyx w-10" />
              <p className="text-xs uppercase tracking-[0.3em]">
                {t("hero.dateTimeVenueLine")
                  .replace("{time}", SITE_COPY.ceremony.time)
                  .replace("{venue}", SITE_COPY.venueName)}
              </p>
              <span className="divider-onyx w-10" />
            </div>
            <button
              type="button"
              onClick={handleScrollToHistory}
              className="pointer-events-auto mt-4 flex flex-col items-center gap-2 text-champagne-gold"
              aria-label={t("hero.scrollToHistoryAria")}
            >
              <span className="eyebrow text-[10px] text-ivory/60">{t("hero.scroll")}</span>
              <svg
                className="animate-chevron"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 6.5 10 12l6-5.5" />
                <path d="M4 12.5 10 18l6-5.5" />
              </svg>
            </button>
          </motion.div>

          <motion.button
            type="button"
            onClick={handleScrollToHistory}
            style={{ opacity: scrollHintOpacity }}
            className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-champagne-gold"
            aria-label={t("hero.scrollToHistoryAria")}
          >
            <span className="eyebrow text-[10px] text-ivory/60">{t("hero.scroll")}</span>
            <svg
              className="animate-chevron"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 6.5 10 12l6-5.5" />
              <path d="M4 12.5 10 18l6-5.5" />
            </svg>
          </motion.button>
        </div>
      </section>
    </>
  );
}
