// src/app/admin/drivers/page.tsx
'use client';

import { useState } from 'react';
import { ShowInactiveToggle } from '@/components/admin/ConfirmDialog';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateDriverDialog } from '@/components/admin/drivers/CreateDriverDialog';
import { DriverTable } from '@/components/admin/drivers/DriverTable';
import { useDrivers } from '@/hooks/queries/useReferenceData';

export default function AdminDriversPage() {
  const [showInactive, setShowInactive] = useState(false);
  const { data: drivers, isLoading, error } = useDrivers(showInactive);

  return (
    <AuthGuard requiredRole="ADMIN">
      <AppShell title="จัดการคนขับ">
        <div className="flex items-center justify-between gap-3">
          <ShowInactiveToggle
            checked={showInactive}
            onChange={setShowInactive}
          />
          <CreateDriverDialog />
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
                โหลดข้อมูลคนขับไม่สำเร็จ
              </div>
            )}
            {!isLoading && !error && <DriverTable drivers={drivers ?? []} />}
          </CardContent>
        </Card>
      </AppShell>
    </AuthGuard>
  );
}
