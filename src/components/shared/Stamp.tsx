// src/components/shared/Stamp.tsx
//
// Signature element of the paper-ledger identity: a decision shows up as an
// ink stamp on the document. Approved = red stamp (SNC red), rejected = dark
// ink stamp, pending = no stamp yet (dashed "awaiting" outline). The stamp
// only exists once someone has decided, which is the whole point.
import { cn } from '@/lib/utils';
import type { TripStatus } from '@/server/shared/enums';

const LABELS: Record<TripStatus, string> = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  CANCELLED: 'ยกเลิก',
};

const TONE: Record<TripStatus, string> = {
  APPROVED: 'border-primary text-primary',
  REJECTED: 'border-foreground text-foreground',
  CANCELLED: 'border-muted-foreground text-muted-foreground',
  PENDING: 'border-dashed border-muted-foreground text-muted-foreground',
};

export function Stamp({
  status,
  size = 'sm',
  className,
}: {
  status: TripStatus;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const decided = status !== 'PENDING';
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-[3px] font-medium tracking-wide',
        TONE[status],
        size === 'lg'
          ? 'border-[3px] px-4 py-1 text-xl'
          : 'border-[1.5px] px-2 py-px text-[11px]',
        decided && (size === 'lg' ? '-rotate-[9deg] stamp-in' : '-rotate-2'),
        className
      )}
    >
      {LABELS[status]}
    </span>
  );
}
