import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

// Styled table primitives, always wrapped so wide tables scroll inside
// their own container instead of the page. Pages additionally render a
// `md:hidden` stacked-card list alongside (see Guests/Invited pages) so
// the same data reads as a proper list on a phone instead of a
// horizontally-scrolling table.

export function Table({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-onyx/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-sm ${className}`}>{children}</table>
      </div>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-ivory text-[11px] uppercase tracking-wide text-charcoal/50">{children}</thead>;
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-onyx/5">{children}</tbody>;
}

export function Tr({ children, className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`transition-colors hover:bg-ivory/60 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function Th({ children, className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 font-medium ${className}`} {...props}>
      {children}
    </th>
  );
}

export function Td({ children, className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 align-middle text-onyx ${className}`} {...props}>
      {children}
    </td>
  );
}
