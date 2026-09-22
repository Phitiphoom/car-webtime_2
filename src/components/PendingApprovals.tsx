// src/components/PendingApprovals.tsx
'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useTrips, useUpdateTripStatus } from '@/hooks/queries/useTrips';
import { Card, CardContent } from '@/components/ui/card';
import { PanelHeader } from '@/components/shared/PanelHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle } from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function PendingApprovals() {
  const { user } = useAuth();
  const canSeeAll = user?.role === 'ADMIN' || user?.role === 'APPROVER';

  const { data, isLoading, error } = useTrips({
    status: 'PENDING',
    department: user?.role === 'ADMIN' ? undefined : user?.department,
    limit: 10,
  });
  const updateStatus = useUpdateTripStatus();

  const trips = data?.data ?? [];

  const handleDecision = (id: number, status: 'APPROVED' | 'REJECTED') => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () =>
          toast.success(
            status === 'APPROVED' ? 'อนุมัติทริปแล้ว' : 'ปฏิเสธทริปแล้ว'
          ),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ'
          ),
      }
    );
  };

  return (
    <Card className="gap-0 overflow-hidden border-border py-0 shadow-none">
      <PanelHeader
        title="รออนุมัติ"
        description={
          !isLoading && !error ? `${trips.length} รายการรอดำเนินการ` : undefined
        }
      />
      <CardContent className="p-0">
        {isLoading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-sm text-destructive">
            ไม่สามารถโหลดทริปรออนุมัติได้
          </div>
        )}

        {!isLoading && !error && trips.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            ไม่มีทริปรออนุมัติในขณะนี้
          </div>
        )}

        {!isLoading && !error && trips.length > 0 && (
          <ul className="divide-y divide-border">
            {trips.map((trip) => (
              <li
                key={trip.id}
                className="p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/trips/${trip.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {trip.recordBy.name} — {trip.startPoint} → {trip.endPoint}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(trip.date)} · {trip.department}
                  </p>
                </div>
                {canSeeAll && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 text-destructive border-destructive/20 hover:bg-destructive/10"
                      disabled={updateStatus.isPending}
                      onClick={() => handleDecision(trip.id, 'REJECTED')}
                      aria-label="ปฏิเสธ"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-7 w-7 bg-success text-success-foreground hover:bg-success/90"
                      disabled={updateStatus.isPending}
                      onClick={() => handleDecision(trip.id, 'APPROVED')}
                      aria-label="อนุมัติ"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
