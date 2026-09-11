'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';

export interface RsvpGuestContext {
  id: string;
  fullName: string;
  partnerName: string | null;
  type: 'single' | 'couple';
  email: string | null;
  existingRsvp: {
    attending: 'yes' | 'no' | 'one_only' | 'none' | 'pending';
    allergyComment: string | null;
    wishText: string | null;
    displayNameOnWall: boolean;
  } | null;
}

export default function RSVPForm({ guest }: { guest: RsvpGuestContext | null }) {
  const [attending, setAttending] = useState(guest?.existingRsvp?.attending ?? '');
  const [email, setEmail] = useState(guest?.email ?? '');
  const [allergyComment, setAllergyComment] = useState(guest?.existingRsvp?.allergyComment ?? '');
  const [wishText, setWishText] = useState(guest?.existingRsvp?.wishText ?? '');
  const [displayName, setDisplayName] = useState(guest?.existingRsvp?.displayNameOnWall ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');

  if (!guest) {
    return (
      <section id="rsvp" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeader index="05" eyebrow="Kindly Reply" title="RSVP" />
        <div className="hairline-gold mx-auto mt-10 max-w-lg bg-onyx p-10 text-center text-ivory">
          <RingIcon className="mx-auto mb-4 text-champagne-gold" />
          <p className="text-ivory/75">
            RSVP is only available through your personal invitation link. If you've received an invite, open the
            link shared with you on WhatsApp to respond.
          </p>
        </div>
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attending) return;
    setSubmitting(true);
    setResult('idle');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: guest!.id,
          attending,
          email,
          allergyComment,
          wishText,
          displayNameOnWall: displayName,
        }),
      });
      setResult(res.ok ? 'success' : 'error');
    } catch {
      setResult('error');
    } finally {
      setSubmitting(false);
    }
  }

  const attendanceOptions =
    guest.type === 'single'
      ? [
          { value: 'yes', label: "Yes, I'll be there" },
          { value: 'no', label: "No, I can't make it" },
        ]
      : [
          { value: 'yes', label: 'Yes, both of us' },
          { value: 'one_only', label: 'Only one of us will make it' },
          { value: 'none', label: 'None of us, unfortunately' },
        ];

  return (
    <section id="rsvp" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader index="05" eyebrow="Kindly Reply" title="RSVP" description="Please respond by 15 November 2026." />
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        onSubmit={handleSubmit}
        className="hairline-gold mx-auto mt-10 flex max-w-xl flex-col gap-7 bg-onyx p-8 text-ivory sm:p-10"
      >
        <RingIcon className="mx-auto text-champagne-gold" />

        <div>
          <label className="text-[11px] uppercase tracking-widest text-ivory/50">Full name</label>
          <input
            readOnly
            value={guest.type === 'couple' ? `${guest.fullName} & ${guest.partnerName ?? ''}` : guest.fullName}
            className="field-underline field-underline-dark mt-1 text-ivory/70"
          />
        </div>

        {guest.type === 'couple' && (
          <p className="-mt-4 text-xs uppercase tracking-widest text-champagne-gold">
            Couple — {guest.fullName} &amp; {guest.partnerName}
          </p>
        )}

        <div>
          <label className="text-[11px] uppercase tracking-widest text-ivory/50">Email (optional)</label>
          <input
            type="email"
            value={email ?? ''}
            onChange={(e) => setEmail(e.target.value)}
            className="field-underline field-underline-dark mt-1"
          />
        </div>

        <fieldset>
          <legend className="text-[11px] uppercase tracking-widest text-ivory/50">Will you attend?</legend>
          <div className="mt-3 flex flex-col gap-3">
            {attendanceOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center justify-between border px-4 py-3 text-sm transition-colors ${
                  attending === opt.value
                    ? 'border-champagne-gold bg-champagne-gold text-onyx'
                    : 'border-ivory/20 text-ivory/85 hover:border-champagne-gold'
                }`}
              >
                {opt.label}
                <input
                  type="radio"
                  name="attending"
                  value={opt.value}
                  checked={attending === opt.value}
                  onChange={() => setAttending(opt.value as any)}
                  required
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="text-[11px] uppercase tracking-widest text-ivory/50">Allergies or comments (optional)</label>
          <textarea
            value={allergyComment ?? ''}
            onChange={(e) => setAllergyComment(e.target.value)}
            rows={2}
            className="field-underline field-underline-dark mt-1 resize-none"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-widest text-ivory/50">Leave a wish for the couple (optional)</label>
          <textarea
            value={wishText ?? ''}
            onChange={(e) => setWishText(e.target.value)}
            rows={3}
            maxLength={280}
            className="field-underline field-underline-dark mt-1 resize-none"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-ivory/75">
          <input type="checkbox" checked={displayName} onChange={(e) => setDisplayName(e.target.checked)} className="h-4 w-4 accent-champagne-gold" />
          Display my name on the wish wall
        </label>

        <button type="submit" disabled={submitting} className="btn-gold mt-2 px-6 py-4 text-xs uppercase tracking-widest disabled:opacity-50">
          {submitting ? 'Sending…' : 'Submit RSVP'}
        </button>

        {result === 'success' && <p className="text-center text-sm text-champagne-gold-light">Thank you — your RSVP has been recorded!</p>}
        {result === 'error' && <p className="text-center text-sm text-red-400">Something went wrong. Please try again.</p>}
      </motion.form>
    </section>
  );
}

function RingIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <circle cx="9" cy="15" r="5" />
      <circle cx="17" cy="9" r="4" />
      <path d="M12.5 12.2 13.8 10" strokeLinecap="round" />
    </svg>
  );
}
