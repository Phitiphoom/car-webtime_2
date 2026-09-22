// src/components/shared/PanelHeader.tsx
//
// Header strip of a paper panel: title on the left, small mono note or an
// action on the right, closed off by a dashed rule (like the tear line on a
// form) — part of the paper-ledger identity.
import { cn } from '@/lib/utils';

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-dashed border-foreground/25 px-4 py-2.5',
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
