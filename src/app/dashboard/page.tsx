// src/app/dashboard/page.tsx
'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { StatsSection } from '@/components/dashboard/StatsSection';
import { PendingApprovals } from '@/components/PendingApprovals';
import { TripHistory } from '@/components/TripHistory';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppShell title="แดชบอร์ด">
        <StatsSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PendingApprovals />
          </div>
          <div className="lg:col-span-2">
            <TripHistory />
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
