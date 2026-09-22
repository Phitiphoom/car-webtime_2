// src/app/admin/cars/page.tsx
'use client';

import { useState } from 'react';
import { ShowInactiveToggle } from '@/components/admin/ConfirmDialog';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateCarDialog } from '@/components/admin/cars/CreateCarDialog';
import { CarTable } from '@/components/admin/cars/CarTable';
import { useCars } from '@/hooks/queries/useReferenceData';

export default function AdminCarsPage() {
  const [showInactive, setShowInactive] = useState(false);
  const { data: cars, isLoading, error } = useCars(showInactive);

  return (
    <AuthGuard requiredRole="ADMIN">
      <AppShell title="จัดการรถ">
        <div className="flex items-center justify-between gap-3">
          <ShowInactiveToggle
            checked={showInactive}
            onChange={setShowInactive}
          />
          <CreateCarDialog />
        </div>

        <Card className="border-border shadow-none">
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {error && (
              <div className="p-8 text-center text-sm text-destructive">
                โหลดข้อมูลรถไม่สำเร็จ
              </div>
            )}
            {!isLoading && !error && <CarTable cars={cars ?? []} />}
          </CardContent>
        </Card>
      </AppShell>
    </AuthGuard>
  );
}
