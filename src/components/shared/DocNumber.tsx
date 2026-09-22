// src/components/shared/DocNumber.tsx
//
// Trip id shown as a printed form number ("เลขที่ 000142") in mono type.
import { cn } from '@/lib/utils';

export function formatDocNumber(id: number) {
  return String(id).padStart(6, '0');
}

export function DocNumber({
  id,
  className,
}: {
  id: number;
  className?: string;
}) {
  return (
    <span className={cn('font-mono text-xs text-muted-foreground', className)}>
      เลขที่ {formatDocNumber(id)}
    </span>
  );
}
