// src/app/log-usage/page.tsx
'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { TripForm } from '@/components/trip-form/TripForm';

export default function LogUsagePage() {
  return (
    <AuthGuard>
      <AppShell title="บันทึกการใช้รถ">
        <TripForm />
      </AppShell>
    </AuthGuard>
  );
}
