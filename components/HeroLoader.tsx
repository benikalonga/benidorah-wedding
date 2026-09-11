'use client';

import { motion, AnimatePresence } from 'framer-motion';

/**
 * Full-screen preloader shown until the hero video has buffered enough to
 * play smoothly. Replaces the old "static poster flashes, then the video
 * pops in a second later" sequence — nothing behind this overlay is ever
 * visible until it's actually ready.
 */
export default function HeroLoader({ visible, progress }: { visible: boolean; progress: number }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          // pointer-events-none unconditionally: this overlay has nothing
          // interactive in it, and must never be able to swallow clicks on
          // the real page underneath — including during the exit fade,
          // where a `fixed inset-0` element stays fully hit-testable for
          // its entire animated duration even as it visually disappears.
          className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-onyx"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="display-huge text-4xl text-ivory sm:text-5xl">
              B <span className="text-champagne-gold">&amp;</span> D
            </p>
            <div className="h-px w-40 overflow-hidden bg-ivory/15">
              <motion.div
                className="h-full bg-champagne-gold"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
              />
            </div>
            <p className="eyebrow text-ivory/50">23 · 12 · 2026</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
