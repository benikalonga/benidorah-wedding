'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';
import { useLocale } from './LocaleProvider';
import { useRsvpStatus } from './RsvpStatusProvider';
import { useActivityLog } from './ActivityLogProvider';

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
  const { t, locale } = useLocale();
  const [code, setCode] = useState('');
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [attending, setAttending] = useState(guest?.existingRsvp?.attending ?? '');
  const [email, setEmail] = useState(guest?.email ?? '');
  const [allergyComment, setAllergyComment] = useState(guest?.existingRsvp?.allergyComment ?? '');
  const [wishText, setWishText] = useState(guest?.existingRsvp?.wishText ?? '');
  const [displayName, setDisplayName] = useState(guest?.existingRsvp?.displayNameOnWall ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');
  // Shared with Hero's "Go to the Invitation" button — hasSubmitted here is
  // just the inverse of needsRsvp (this component only renders its form
  // past the !guest check above, so a guest is guaranteed at this point).
  // markSubmitted() flips both this form's title/button AND hides Hero's
  // CTA the instant a submit succeeds, without needing a page reload.
  const { needsRsvp, markSubmitted } = useRsvpStatus();
  const hasSubmitted = !needsRsvp;
  const { logAction } = useActivityLog();

  // Lands the code-retrieval redirect (see handleCodeSubmit below) — and
  // any other #rsvp deep link — actually on the form. The browser's own
  // scroll-to-fragment fires once, before gallery/history images finish
  // loading and push this section further down the page, so it lands
  // short; re-running it after `load` corrects for that.
  useEffect(() => {
    if (window.location.hash !== '#rsvp') return;
    const scrollToForm = () => document.getElementById('rsvp')?.scrollIntoView();
    scrollToForm();
    window.addEventListener('load', scrollToForm);
    return () => window.removeEventListener('load', scrollToForm);
  }, []);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 8) return;
    setCodeSubmitting(true);
    setCodeError(null);
    try {
      const res = await fetch('/api/rsvp-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.hash) {
        // The API's error text is English-only (rate limit, bad shape,
        // no match) — always show our own localized copy instead so a
        // French visitor doesn't suddenly see an English sentence here.
        setCodeError(t('rsvp.codeInvalid'));
        setCodeSubmitting(false);
        return;
      }
      // A real reload (not a client-side route push) so the page re-fetches
      // as this guest — same as opening their actual invite link — and
      // lands scrolled straight to the RSVP form via the #rsvp anchor.
      window.location.href = `/${data.hash}/${locale}#rsvp`;
    } catch {
      setCodeError(t('rsvp.codeInvalid'));
      setCodeSubmitting(false);
    }
  }

  if (!guest) {
    return (
      <section id="rsvp" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeader index="05" eyebrow={t('rsvp.eyebrow')} title={t('rsvp.title')} />
        <div className="hairline-gold mx-auto mt-10 max-w-lg bg-ivory p-10 text-center">
          <RingIcon className="mx-auto mb-4 text-champagne-gold" />
          <p className="text-charcoal/70">{t('rsvp.lockedMessage')}</p>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-charcoal/40">
            <span className="h-px flex-1 bg-charcoal/15" />
            {t('rsvp.codeDivider')}
            <span className="h-px flex-1 bg-charcoal/15" />
          </div>

          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-3">
            <label className="text-[11px] uppercase tracking-widest text-charcoal/50">{t('rsvp.codeLabel')}</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 8));
                setCodeError(null);
              }}
              className="field-underline text-center tracking-[0.3em]"
            />
            <button
              type="submit"
              disabled={code.length !== 8 || codeSubmitting}
              className="btn-gold px-6 py-3 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {codeSubmitting ? t('rsvp.codeSending') : t('rsvp.codeSubmit')}
            </button>
            {codeError && <p className="text-sm text-red-600">{codeError}</p>}
          </form>
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
      if (res.ok) {
        markSubmitted();
        logAction('rsvp_submit_success', { attending });
      } else {
        logAction('rsvp_submit_error', { attending });
      }
    } catch {
      setResult('error');
      logAction('rsvp_submit_error', { attending });
    } finally {
      setSubmitting(false);
    }
  }

  const attendanceOptions =
    guest.type === 'single'
      ? [
          { value: 'yes', label: t('rsvp.yesSingle') },
          { value: 'no', label: t('rsvp.noSingle') },
        ]
      : [
          { value: 'yes', label: t('rsvp.yesBoth') },
          { value: 'one_only', label: t('rsvp.oneOnly') },
          { value: 'none', label: t('rsvp.none') },
        ];

  return (
    <section id="rsvp" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader index="05" eyebrow={t('rsvp.eyebrow')} title={t('rsvp.title')} description={t('rsvp.deadline')} />
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        onSubmit={handleSubmit}
        className="hairline-gold mx-auto mt-10 flex max-w-xl flex-col gap-7 bg-ivory p-8 sm:p-10"
      >
        <RingIcon className="mx-auto text-champagne-gold" />

        <p
          className={`text-center text-sm font-medium ${
            hasSubmitted ? 'text-green-700' : 'text-charcoal/70'
          }`}
        >
          {hasSubmitted ? t('rsvp.alreadySubmitted') : t('rsvp.formTitle')}
        </p>

        <div>
          <label className="text-[11px] uppercase tracking-widest text-charcoal/50">{t('rsvp.fullName')}</label>
          <input
            readOnly
            value={guest.type === 'couple' ? `${guest.fullName} & ${guest.partnerName ?? ''}` : guest.fullName}
            className="field-underline mt-1 text-charcoal/70"
          />
        </div>

        {guest.type === 'couple' && (
          <p className="-mt-4 text-xs uppercase tracking-widest text-champagne-gold">
            {t('rsvp.coupleLabel').replace('{a}', guest.fullName).replace('{b}', guest.partnerName ?? '')}
          </p>
        )}

        <div>
          <label className="text-[11px] uppercase tracking-widest text-charcoal/50">{t('rsvp.email')}</label>
          <input
            type="email"
            value={email ?? ''}
            onChange={(e) => setEmail(e.target.value)}
            className="field-underline mt-1"
          />
        </div>

        <fieldset>
          <legend className="text-[11px] uppercase tracking-widest text-charcoal/50">{t('rsvp.willAttend')}</legend>
          <div className="mt-3 flex flex-col gap-3">
            {attendanceOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center justify-between border px-4 py-3 text-sm transition-colors ${
                  attending === opt.value
                    ? 'border-champagne-gold bg-champagne-gold text-onyx'
                    : 'border-charcoal/15 text-charcoal/70 hover:border-champagne-gold'
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
          <label className="text-[11px] uppercase tracking-widest text-charcoal/50">{t('rsvp.allergies')}</label>
          <textarea
            value={allergyComment ?? ''}
            onChange={(e) => setAllergyComment(e.target.value)}
            rows={2}
            className="field-underline mt-1 resize-none"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-widest text-charcoal/50">{t('rsvp.wish')}</label>
          <textarea
            value={wishText ?? ''}
            onChange={(e) => setWishText(e.target.value)}
            rows={3}
            maxLength={280}
            className="field-underline mt-1 resize-none"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-charcoal/70">
          <input type="checkbox" checked={displayName} onChange={(e) => setDisplayName(e.target.checked)} className="h-4 w-4 accent-champagne-gold" />
          {t('rsvp.displayNameCheckbox')}
        </label>

        <button type="submit" disabled={submitting} className="btn-gold mt-2 px-6 py-4 text-xs uppercase tracking-widest disabled:opacity-50">
          {submitting ? t('rsvp.sending') : hasSubmitted ? t('rsvp.update') : t('rsvp.submit')}
        </button>

        {result === 'success' && <p className="text-center text-sm text-champagne-gold">{t('rsvp.success')}</p>}
        {result === 'error' && <p className="text-center text-sm text-red-600">{t('rsvp.error')}</p>}
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
