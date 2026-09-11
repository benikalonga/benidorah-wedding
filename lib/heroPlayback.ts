'use client';

// Tiny cross-component signal so a video played anywhere else on the page
// (currently: the Gallery/Moments lightbox) can tell the Hero to stop its
// own background video before two audio tracks start playing at once.
// A plain DOM CustomEvent is enough here — Hero and Gallery are siblings
// under WeddingPage with no other shared state, so this avoids wiring a
// context provider just for one signal.
const HERO_PAUSE_EVENT = 'benidorah:pause-hero-video';

/** Call when another video is about to play with sound. */
export function requestHeroVideoPause() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(HERO_PAUSE_EVENT));
}

/** Hero subscribes to this to pause itself when requestHeroVideoPause() fires. */
export function onHeroVideoPauseRequest(handler: () => void): () => void {
  window.addEventListener(HERO_PAUSE_EVENT, handler);
  return () => window.removeEventListener(HERO_PAUSE_EVENT, handler);
}
