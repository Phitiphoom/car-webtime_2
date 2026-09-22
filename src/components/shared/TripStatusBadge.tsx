// src/components/shared/TripStatusBadge.tsx
//
// Status is shown as an ink stamp (see Stamp.tsx) — pending trips have no
// stamp yet, decided trips do.
import { Stamp } from './Stamp';
import type { TripStatus } from '@/server/shared/enums';

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return <Stamp status={status} size="sm" />;
}
