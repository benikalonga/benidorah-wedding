'use client';

import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { IconEye, IconEyeOff } from './icons';

const fieldBase =
  'w-full rounded-lg border border-onyx/15 bg-white px-3 py-2 text-sm text-onyx placeholder:text-charcoal/35 ' +
  'transition-colors focus:border-royal-blue focus:outline-none focus:ring-2 focus:ring-royal-blue/15 ' +
  'disabled:cursor-not-allowed disabled:bg-ivory disabled:text-charcoal/40';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...props },
  ref
) {
  return <input ref={ref} className={`${fieldBase} ${className}`} {...props} />;
});

/** Password field with a show/hide toggle (eye icon) — swaps type="password"/"text" client-side, nothing leaves the field. */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { iconClassName?: string }
>(function PasswordInput({ className = '', iconClassName = 'text-charcoal/40 hover:text-charcoal/70', ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <Input ref={ref} type={visible ? 'text' : 'password'} className={`pr-9 ${className}`} {...props} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors ${iconClassName}`}
      >
        {visible ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
      </button>
    </span>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...props }, ref) {
    return <textarea ref={ref} className={`${fieldBase} ${className}`} {...props} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...props },
  ref
) {
  return (
    <span className="relative block">
      <select ref={ref} className={`${fieldBase} appearance-none pr-8 ${className}`} {...props}>
        {children}
      </select>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
});

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-charcoal/55">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-charcoal/45">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] text-red-600">{error}</span>}
    </label>
  );
}
