'use client';

import { useMemo, useState, type CSSProperties } from 'react';
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

export default function WishWall({ initialTickets }: { initialTickets: TicketEntry[] }) {
  const [tickets, setTickets] = useState(initialTickets);

  useSocketEvent<{ ticket: TicketEntry }>('ticket:new', (payload) => {
    setTickets((prev) => [payload.ticket, ...prev]);
  });

  useSocketEvent<{ ticketId: string }>('ticket:hidden', (payload) => {
    setTickets((prev) => prev.filter((t) => t.id !== payload.ticketId));
  });

  const { placements, wallWidth, wallHeight } = useMemo(() => computeWall(tickets), [tickets]);

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

      <div className="hairline mt-6 h-[420px] overflow-hidden" style={{ backgroundColor: WALL_BACKGROUND.backgroundColor }}>
        {tickets.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-charcoal/40">
            Be the first to leave a wish above 💌
          </div>
        ) : (
          <TransformWrapper minScale={0.3} maxScale={3} initialScale={0.7} centerOnInit wheel={{ step: 0.1 }}>
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
