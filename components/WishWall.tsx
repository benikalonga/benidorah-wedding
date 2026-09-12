'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion } from 'framer-motion';
import { useSocketEvent } from '@/lib/useSocket';

export interface TicketEntry {
  id: string;
  displayName: string | null;
  message: string;
  color: string;
}

// The wall is a fixed lattice of cells (columns × rows) — that's what
// makes it read as a grid/wall rather than a scattered pile. Which cell a
// given ticket lands in is derived from a hash of its own id, not from
// array order, so adding a new wish can never move an existing one: every
// ticket's cell (and its little rotation/nudge) is a pure function of its
// own id, computed fresh every render but always landing the same place.
const CELL_W = 176;
const CELL_H = 150;
const CELL_PADDING = 24; // shrink from the cell size so notes don't touch
const EXTRA_SLOT_RATIO = 1.5; // more cells than tickets => real breathing room

// A plaster-wall tone with a faint grid etched at exactly the lattice's
// cell size, plus a couple of soft, mottled radial gradients so it reads
// as a textured physical wall instead of flat graph paper. The grid lines
// land right on each note's cell boundary, reinforcing that the wall
// really is a grid of slots underneath the "randomly" placed notes.
const WALL_BACKGROUND: CSSProperties = {
  backgroundColor: '#E4DAC4',
  backgroundImage: [
    `repeating-linear-gradient(90deg, rgba(59,42,15,0.09) 0px, rgba(59,42,15,0.09) 1px, transparent 1px, transparent ${CELL_W}px)`,
    `repeating-linear-gradient(0deg, rgba(59,42,15,0.09) 0px, rgba(59,42,15,0.09) 1px, transparent 1px, transparent ${CELL_H}px)`,
    'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.4), transparent 40%)',
    'radial-gradient(circle at 85% 75%, rgba(0,0,0,0.06), transparent 45%)',
    'radial-gradient(circle at 50% 90%, rgba(255,255,255,0.25), transparent 50%)',
  ].join(', '),
};

const MIN_SCALE = 0.3;
const MAX_SCALE = 3;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

interface Placement {
  left: number;
  top: number;
  rotation: number;
}

function computeWall(tickets: TicketEntry[]) {
  const columns = Math.max(6, Math.ceil(Math.sqrt(tickets.length * EXTRA_SLOT_RATIO) * 1.3));
  const totalSlots = Math.max(columns * 3, Math.ceil(tickets.length * EXTRA_SLOT_RATIO));
  const rows = Math.max(3, Math.ceil(totalSlots / columns));
  const slotCount = columns * rows;

  // Resolved in id order (not arrival order) so a given set of wishes
  // always claims the same slots regardless of who posted when — the
  // only time an existing note's slot can change is the rare case where
  // a newly-added id's hash collides with one already in use.
  const sortedIds = [...tickets].map((t) => t.id).sort();
  const taken = new Set<number>();
  const placements = new Map<string, Placement>();

  for (const id of sortedIds) {
    const h = hashString(id);
    let slot = h % slotCount;
    let probes = 0;
    while (taken.has(slot) && probes < slotCount) {
      slot = (slot + 1) % slotCount;
      probes++;
    }
    taken.add(slot);

    const col = slot % columns;
    const row = Math.floor(slot / columns);
    const jitter = hashString(id + ':j');
    const jitterX = ((jitter % 17) - 8); // -8..8 px
    const jitterY = (((jitter >> 5) % 17) - 8);
    const rotation = ((jitter >> 10) % 11) - 5; // -5..5 deg

    placements.set(id, {
      left: col * CELL_W + CELL_W / 2 + jitterX,
      top: row * CELL_H + CELL_H / 2 + jitterY,
      rotation,
    });
  }

  return { placements, wallWidth: columns * CELL_W, wallHeight: rows * CELL_H };
}

// How far (in px) a drag has to push past an already-clamped pan edge
// before we treat it as "the user really means to scroll the page", not
// an accidental overshoot at the boundary.
const EDGE_SNAP_PX = 26;
// Float tolerance for "is the pan already sitting exactly at its bound".
const EDGE_EPS = 1;
// Float tolerance for "is the zoom already sitting at min/max scale".
const SCALE_EPS = 0.002;
// Friction applied per animation frame to the fling we hand off to the
// page after a touch drag is released past an edge — matches the feel of
// native touch-scroll momentum instead of stopping dead the instant the
// finger lifts.
const FLING_FRICTION_PER_FRAME = 0.94;
const FLING_MIN_VELOCITY = 0.02; // px/ms — below this the fling just stops

interface TransformMeta {
  scale: number;
  positionY: number;
  minPositionY: number;
  maxPositionY: number;
}

/**
 * Lets the page scroll normally once the Wish Wall's own pan/zoom is
 * already maxed out in the direction the user is pushing — otherwise a
 * drag or a 2-finger trackpad scroll gets fully swallowed by the wall
 * forever (react-zoom-pan-pinch calls preventDefault/stopPropagation
 * unconditionally on every pan/wheel move), trapping the user on top of
 * it with no way to keep scrolling the page.
 *
 * Approach: listen on the wall's outer viewport (an ancestor of the
 * library's own wrapper element) in the CAPTURE phase, so we see every
 * touch/mouse/wheel event before the library does.
 *  - Wheel (mouse wheel or 2-finger trackpad scroll, which this wall
 *    treats as zoom): once already at min/max scale, stopPropagation so
 *    the library never sees the event and the browser scrolls the page
 *    instead of doing nothing.
 *  - Touch/mouse drag: once the pan is already clamped at its top/bottom
 *    edge AND the user keeps pushing past it by more than EDGE_SNAP_PX,
 *    we take the rest of that gesture over ourselves — stopping the
 *    library and manually scrolling the window to follow the same
 *    finger/mouse movement, since relying on native scroll to "resume"
 *    mid-gesture after the library's own preventDefault calls is
 *    unreliable across browsers.
 * Dragging left/right, or a vertical drag that's still within bounds,
 * is left completely alone — only the specific "pushing past an already-
 * maxed edge" case hands off.
 */
function useEdgeScrollHandoff(viewportRef: React.RefObject<HTMLDivElement>, active: boolean) {
  const metaRef = useRef<TransformMeta | null>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !active) return;

    let dragActive = false;
    let released = false;
    let dragStartY = 0;
    let lastY = 0;
    let lastMoveTime = 0;
    let velocity = 0; // px/ms, tracked only while released, for the touch fling on release
    let isTouch = false;
    let flingRaf = 0;

    function stopFling() {
      if (flingRaf) cancelAnimationFrame(flingRaf);
      flingRaf = 0;
    }

    function startFling(v0: number) {
      stopFling();
      let v = v0;
      let last = performance.now();
      function step(now: number) {
        const dt = Math.max(1, now - last);
        last = now;
        // `behavior: 'instant'` is essential here — `html` has
        // `scroll-behavior: smooth` globally, and without overriding it
        // per-call every one of these rapid-fire scrollBy calls would
        // kick off its own smooth animation that the *next* call
        // immediately interrupts, so they all cancel each other out and
        // the page barely moves (much more visible on mobile than desktop).
        window.scrollBy({ top: -v * dt, behavior: 'instant' });
        v *= Math.pow(FLING_FRICTION_PER_FRAME, dt / 16.67);
        if (Math.abs(v) > FLING_MIN_VELOCITY) {
          flingRaf = requestAnimationFrame(step);
        } else {
          flingRaf = 0;
        }
      }
      flingRaf = requestAnimationFrame(step);
    }

    function beginDrag(clientY: number, touch: boolean) {
      stopFling();
      dragActive = true;
      released = false;
      isTouch = touch;
      dragStartY = clientY;
      lastY = clientY;
      lastMoveTime = performance.now();
      velocity = 0;
    }

    function endDrag() {
      if (released && isTouch && Math.abs(velocity) > FLING_MIN_VELOCITY) {
        // Native touch-scroll keeps coasting after the finger lifts — our
        // manual takeover needs to fake that momentum too, or handing off
        // right at the edge feels like it "barely scrolls" compared to
        // scrolling the page directly.
        startFling(velocity);
      }
      dragActive = false;
      released = false;
    }

    function handleMove(e: TouchEvent | MouseEvent, clientY: number) {
      if (!dragActive) return;
      const now = performance.now();

      if (released) {
        const dt = Math.max(1, now - lastMoveTime);
        const dy = clientY - lastY;
        velocity = dy / dt;
        lastY = clientY;
        lastMoveTime = now;
        window.scrollBy({ top: -dy, behavior: 'instant' }); // see the fling's comment above
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const meta = metaRef.current;
      if (!meta) return;

      const totalDelta = clientY - dragStartY;
      const atTop = meta.positionY >= meta.maxPositionY - EDGE_EPS;
      const atBottom = meta.positionY <= meta.minPositionY + EDGE_EPS;
      const wantsHandoff = (atTop && totalDelta > EDGE_SNAP_PX) || (atBottom && totalDelta < -EDGE_SNAP_PX);

      if (wantsHandoff) {
        released = true;
        lastY = clientY;
        lastMoveTime = now;
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) beginDrag(e.touches[0].clientY, true);
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 1) handleMove(e, e.touches[0].clientY);
    }
    function onMouseDown(e: MouseEvent) {
      if (e.button === 0) beginDrag(e.clientY, false);
    }
    function onMouseMove(e: MouseEvent) {
      handleMove(e, e.clientY);
    }
    function onWheel(e: WheelEvent) {
      const meta = metaRef.current;
      if (!meta) return;
      const zoomingIn = e.deltaY < 0;
      const zoomingOut = e.deltaY > 0;
      const atMax = meta.scale >= MAX_SCALE - SCALE_EPS;
      const atMin = meta.scale <= MIN_SCALE + SCALE_EPS;
      if ((zoomingIn && atMax) || (zoomingOut && atMin)) {
        e.stopPropagation();
      }
    }

    el.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    el.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
    el.addEventListener('touchend', endDrag, { capture: true, passive: true });
    el.addEventListener('touchcancel', endDrag, { capture: true, passive: true });
    el.addEventListener('mousedown', onMouseDown, { capture: true });
    window.addEventListener('mousemove', onMouseMove, { capture: true });
    window.addEventListener('mouseup', endDrag, { capture: true });
    el.addEventListener('wheel', onWheel, { capture: true, passive: true });

    return () => {
      stopFling();
      el.removeEventListener('touchstart', onTouchStart, true);
      el.removeEventListener('touchmove', onTouchMove, true);
      el.removeEventListener('touchend', endDrag, true);
      el.removeEventListener('touchcancel', endDrag, true);
      el.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', endDrag, true);
      el.removeEventListener('wheel', onWheel, true);
    };
  }, [viewportRef, active]);

  return metaRef;
}

export default function WishWall({ initialTickets }: { initialTickets: TicketEntry[] }) {
  const [tickets, setTickets] = useState(initialTickets);

  useSocketEvent<{ ticket: TicketEntry }>('ticket:new', (payload) => {
    setTickets((prev) => [payload.ticket, ...prev]);
  });

  useSocketEvent<{ ticketId: string }>('ticket:hidden', (payload) => {
    setTickets((prev) => prev.filter((t) => t.id !== payload.ticketId));
  });

  const { placements, wallWidth, wallHeight } = useMemo(() => computeWall(tickets), [tickets]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const metaRef = useEdgeScrollHandoff(viewportRef, tickets.length > 0);
  const syncMeta = (ref: { instance: { bounds: { minPositionY: number; maxPositionY: number } | null } }, state: { scale: number; positionY: number }) => {
    metaRef.current = {
      scale: state.scale,
      positionY: state.positionY,
      minPositionY: ref.instance.bounds?.minPositionY ?? 0,
      maxPositionY: ref.instance.bounds?.maxPositionY ?? 0,
    };
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-4"
      >
        <span className="divider w-10" />
        <h3 className="eyebrow text-charcoal/50">The Wish Wall</h3>
        <span className="divider flex-1" />
      </motion.div>
      <p className="mt-3 text-sm text-charcoal/50">Pinch or scroll to zoom, drag to explore — updates live as wishes come in.</p>

      <div
        ref={viewportRef}
        className="hairline mt-6 h-[420px] overflow-hidden"
        style={{ backgroundColor: WALL_BACKGROUND.backgroundColor }}
      >
        {tickets.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-charcoal/40">
            Be the first to leave a wish above 💌
          </div>
        ) : (
          <TransformWrapper
            minScale={MIN_SCALE}
            maxScale={MAX_SCALE}
            initialScale={0.7}
            centerOnInit
            wheel={{ step: 0.1 }}
            onInit={(ref) => syncMeta(ref, ref.state)}
            onTransformed={(ref, state) => syncMeta(ref, state)}
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <div className="relative" style={{ width: wallWidth, height: wallHeight, ...WALL_BACKGROUND }}>
                {tickets.map((t) => {
                  const p = placements.get(t.id);
                  if (!p) return null;
                  return (
                    <div
                      key={t.id}
                      className="absolute flex flex-col justify-between rounded-sm p-3 shadow-md"
                      style={{
                        left: p.left,
                        top: p.top,
                        width: CELL_W - CELL_PADDING,
                        height: CELL_H - CELL_PADDING,
                        backgroundColor: t.color,
                        transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
                      }}
                    >
                      <span
                        aria-hidden
                        className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full"
                        style={{
                          background: 'radial-gradient(circle at 35% 30%, #fff6d8, #d4a017 55%, #7a5a0d 100%)',
                          boxShadow: '0 2px 3px rgba(0,0,0,0.45)',
                        }}
                      />
                      <p className="line-clamp-4 font-hand text-lg leading-tight text-black">{t.message}</p>
                      <p className="text-right text-xs font-semibold text-black/80">— {t.displayName || 'Anonymous'}</p>
                    </div>
                  );
                })}
              </div>
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>
    </div>
  );
}
