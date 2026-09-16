'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

interface ActivityLogValue {
  /** Fire-and-forget: never throws, never blocks the caller, never surfaces
   * an error. Safe to call from inside any onClick without wrapping it. */
  logAction: (action: string, metadata?: Record<string, unknown>) => void;
}

const ActivityLogContext = createContext<ActivityLogValue | null>(null);

export function ActivityLogProvider({
  guestId,
  children,
}: {
  guestId: string | null;
  children: ReactNode;
}) {
  // A ref, not state — guestId is fixed for the lifetime of a page load
  // (it comes from the URL hash the page was opened with) and logAction
  // must stay a stable reference so it's cheap to drop into dependency
  // arrays anywhere it's used.
  const guestIdRef = useRef(guestId);
  guestIdRef.current = guestId;

  const logAction = useCallback((action: string, metadata?: Record<string, unknown>) => {
    try {
      const body = JSON.stringify({
        guestId: guestIdRef.current,
        action,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        metadata,
      });
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Logging must never throw into whatever click handler called it.
    }
  }, []);

  useEffect(() => {
    logAction('page_view');
    // Intentionally once per mount only — not depending on logAction (it's
    // stable) or on anything else, so a page view is logged exactly once
    // per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ActivityLogContext.Provider value={{ logAction }}>
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog(): ActivityLogValue {
  const ctx = useContext(ActivityLogContext);
  // No-op fallback rather than throwing: logging is a side channel, never
  // a feature a missing provider should be allowed to crash the page over.
  if (!ctx) return { logAction: () => {} };
  return ctx;
}
