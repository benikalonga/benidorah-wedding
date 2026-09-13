import type { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
  padded = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={`rounded-2xl border border-onyx/10 bg-white shadow-sm ${padded ? 'p-5 sm:p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}
