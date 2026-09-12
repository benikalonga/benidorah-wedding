'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'icon';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-gold';

const variants: Record<Variant, string> = {
  primary: 'bg-royal-blue text-ivory hover:bg-royal-blue-deep',
  gold: 'bg-champagne-gold text-onyx hover:bg-champagne-gold-light',
  outline: 'border border-onyx/15 bg-white text-onyx hover:bg-onyx/[0.04]',
  ghost: 'text-onyx/70 hover:bg-onyx/[0.06] hover:text-onyx',
  danger: 'bg-red-600/10 text-red-700 hover:bg-red-600/15',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-5 text-sm',
  icon: 'h-9 w-9 text-sm shrink-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', size = 'md', loading, icon, disabled, className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
});

export default Button;
