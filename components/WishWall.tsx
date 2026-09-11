'use client';

import { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion } from 'framer-motion';
import { useSocketEvent } from '@/lib/useSocket';

export interface TicketEntry {
  id: string;
  displayName: string | null;
  message: string;
  color: string;
}

export default function WishWall({ initialTickets }: { initialTickets: TicketEntry[] }) {
  const [tickets, setTickets] = useState(initialTickets);

  useSocketEvent<{ ticket: TicketEntry }>('ticket:new', (payload) => {
    setTickets((prev) => [payload.ticket, ...prev]);
  });

  useSocketEvent<{ ticketId: string }>('ticket:hidden', (payload) => {
    setTickets((prev) => prev.filter((t) => t.id !== payload.ticketId));
  });

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

      <div className="hairline mt-6 h-[420px] overflow-hidden bg-cream">
        {tickets.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-charcoal/40">
            Be the first to leave a wish above 💌
          </div>
        ) : (
          <TransformWrapper minScale={0.5} maxScale={3} initialScale={1} wheel={{ step: 0.1 }}>
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <div className="grid auto-rows-[140px] grid-cols-[repeat(auto-fill,180px)] gap-4 p-6">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="flex rotate-[-2deg] flex-col justify-between rounded-sm p-3 shadow-md odd:rotate-[2deg]"
                    style={{ backgroundColor: t.color }}
                  >
                    <p className="font-hand text-lg leading-tight text-onyx/90">{t.message}</p>
                    <p className="text-right text-xs font-semibold text-onyx/70">— {t.displayName || 'Anonymous'}</p>
                  </div>
                ))}
              </div>
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>
    </div>
  );
}
