import type { ReactNode } from 'react';

/**
 * The title + primary-action row at the top of every admin page — pulled
 * out into one place so spacing/typography stay identical everywhere
 * instead of each page hand-rolling its own header margins.
 */
export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="section-title text-2xl text-onyx">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-charcoal/55">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
