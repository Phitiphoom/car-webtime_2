// src/components/TripHistory.tsx
//
// Compact "recent trips" widget for the dashboard. Full filtering/pagination
// lives on the dedicated /trips page (src/app/trips/page.tsx) — this used to
// be one large component with its own filter form, CSV export and print
// wired in (useTripFilters/useTripExport), all replaced by a simple recent
// list plus a link to the full page.
'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { PanelHeader } from '@/components/shared/PanelHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TripTable } from '@/components/trips/TripTable';
import { useTrips } from '@/hooks/queries/useTrips';

export function TripHistory() {
  const { data, isLoading, error } = useTrips({
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <Card className="gap-0 overflow-hidden border-border py-0 shadow-none">
      <PanelHeader
        title="การเดินทางล่าสุด"
        action={
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link href="/trips">ดูทั้งหมด</Link>
          </Button>
        }
      />
      <CardContent className="p-0">
        {isLoading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-sm text-destructive">
            ไม่สามารถโหลดข้อมูลทริปได้
          </div>
        )}
        {!isLoading && !error && <TripTable trips={data?.data ?? []} />}
      </CardContent>
    </Card>
  );
}
