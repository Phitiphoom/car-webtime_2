// src/components/admin/users/RoleBadge.tsx
//
// Plain ink text, no pill background (paper-ledger style).
import { cn } from '@/lib/utils';
import type { Role } from '@/server/shared/enums';

const LABELS: Record<Role, string> = {
  ADMIN: 'แอดมิน',
  APPROVER: 'ผู้อนุมัติ',
  USER: 'พนักงาน',
};

const STYLES: Record<Role, string> = {
  ADMIN: 'text-primary',
  APPROVER: 'text-foreground',
  USER: 'text-muted-foreground',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={cn('text-xs font-medium', STYLES[role])}>
      {LABELS[role]}
    </span>
  );
}
