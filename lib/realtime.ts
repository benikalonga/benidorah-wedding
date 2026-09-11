// Thin wrapper around the Socket.IO server instance attached to the
// global object by server/index.js. API route handlers import this
// instead of touching `global` directly.

type BenidorahEvent =
  | { type: 'ticket:new'; ticket: unknown }
  | { type: 'ticket:hidden'; ticketId: string }
  | { type: 'moment:new'; moment: unknown }
  | { type: 'moment:hidden'; momentId: string }
  | { type: 'gift:updated'; giftId: string };

export function broadcast(event: BenidorahEvent) {
  const io = (global as any).__benidorahIO;
  if (!io) {
    // In `next build` / serverless-style environments without the custom
    // server (e.g. some test runners) there's nothing to broadcast to.
    return;
  }
  io.emit(event.type, event);
}
