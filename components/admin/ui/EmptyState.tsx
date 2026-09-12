import type { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-onyx/15 px-6 py-14 text-center">
      {icon && <div className="mb-1 text-charcoal/30">{icon}</div>}
      <p className="text-sm font-medium text-onyx">{title}</p>
      {description && <p className="max-w-xs text-xs text-charcoal/50">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
