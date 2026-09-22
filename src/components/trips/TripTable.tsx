// src/components/trips/TripTable.tsx
import Link from 'next/link';
import { TripStatusBadge } from '@/components/shared/TripStatusBadge';
import { formatDocNumber } from '@/components/shared/DocNumber';
import type { TripDTO } from '@/server/trips/trip.mapper';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
}

const TH =
  'py-2 px-4 text-xs font-medium text-muted-foreground border-b border-dashed border-foreground/25';

export function TripTable({ trips }: { trips: TripDTO[] }) {
  if (trips.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        ไม่พบรายการเดินทาง
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[680px]">
        <thead>
          <tr className="text-left">
            <th className={TH}>เลขที่</th>
            <th className={TH}>เส้นทาง</th>
            <th className={TH}>รถ</th>
            <th className={TH}>วันที่</th>
            <th className={TH}>ผู้ขอใช้</th>
            <th className={TH}>สถานะ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-foreground/20">
          {trips.map((trip) => (
            <tr key={trip.id} className="hover:bg-muted/50">
              <td className="py-2.5 px-4 font-mono text-xs text-muted-foreground">
                {formatDocNumber(trip.id)}
              </td>
              <td className="py-2.5 px-4">
                <Link
                  href={`/trips/${trip.id}`}
                  className="font-medium hover:underline"
                >
                  {trip.startPoint} → {trip.endPoint}
                </Link>
              </td>
              <td className="py-2.5 px-4 font-mono text-xs">
                {trip.car.plateNumber}
              </td>
              <td className="py-2.5 px-4 font-mono text-xs text-muted-foreground">
                {formatDate(trip.date)}
              </td>
              <td className="py-2.5 px-4 text-muted-foreground">
                {trip.recordBy.name}
              </td>
              <td className="py-2.5 px-4">
                <TripStatusBadge status={trip.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
