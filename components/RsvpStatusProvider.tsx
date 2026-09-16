"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface RsvpStatusValue {
  /** True only when this visitor has a personal guest link AND hasn't
   * submitted an RSVP yet — false for the anonymous homepage and for a
   * guest who has already responded. */
  needsRsvp: boolean;
  /** Call once a submit succeeds so every consumer (Hero's CTA, the RSVP
   * form's own title/button) updates immediately, without a page reload. */
  markSubmitted: () => void;
}

const RsvpStatusContext = createContext<RsvpStatusValue | null>(null);

export function RsvpStatusProvider({
  initialNeedsRsvp,
  children,
}: {
  initialNeedsRsvp: boolean;
  children: ReactNode;
}) {
  const [needsRsvp, setNeedsRsvp] = useState(initialNeedsRsvp);
  const markSubmitted = useCallback(() => setNeedsRsvp(false), []);
  const value = useMemo(
    () => ({ needsRsvp, markSubmitted }),
    [needsRsvp, markSubmitted],
  );

  return (
    <RsvpStatusContext.Provider value={value}>
      {children}
    </RsvpStatusContext.Provider>
  );
}

export function useRsvpStatus(): RsvpStatusValue {
  const ctx = useContext(RsvpStatusContext);
  if (!ctx) {
    throw new Error("useRsvpStatus must be used within an RsvpStatusProvider");
  }
  return ctx;
}
