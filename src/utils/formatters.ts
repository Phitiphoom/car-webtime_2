// File: src/utils/formatters.ts
export function formatDate(d?: string | Date) {
  if (!d) return 'N/A';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(d));
}
export function formatDateTime(d?: string | Date) {
  if (!d) return 'N/A';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d));
}
export const statusPalette = {
  approve: { variant: 'secondary', icon: '✓' },
  pending: { variant: 'outline', icon: '⏳' },
  rejected: { variant: 'destructive', icon: '✗' },
} as const;

type StatusKey = keyof typeof statusPalette;

export function getStatusBadge(s?: string | null) {
  const key = (s?.toLowerCase() || 'pending') as StatusKey;
  return statusPalette[key];
}
