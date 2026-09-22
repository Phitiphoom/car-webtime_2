// src/components/trip-form/TripForm.tsx
//
// The single shared form used to create a trip (/log-usage). This is what
// used to be two forked, drifting implementations — src/components/EditTrip/*
// and src/components/LogUsage/* — each with its own copy of MainRoute,
// AdditionalStops, DriversSection, TripDetails, backed by two separate
// hand-rolled "god hooks" (useLogUsageForm.ts, useEditTripForm.ts).
//
// The old EditTrip page implied full route/car/driver editing, but the old
// PUT /api/trips/[id] handler only ever persisted APPROVE_STATUS/
// Approve_Email/PURPOSE from the request body — editing the route was never
// actually wired up server-side. The new backend keeps that same, narrower
// edit surface deliberately (see UpdateTripDetailsSchema) rather than
// reviving a UI that silently discarded its inputs, so this component only
// has a create mode; edit is handled separately.
'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { useTripForm } from '@/hooks/useTripForm';
import { useCreateTrip } from '@/hooks/queries/useTrips';
import { MainRoute } from './MainRoute';
import { AdditionalStops } from './AdditionalStops';
import { DriversSection } from './DriversSection';
import { TripDetails } from './TripDetails';
import { FormActions } from './FormActions';

export function TripForm() {
  const router = useRouter();
  const form = useTripForm();
  const createTrip = useCreateTrip();

  const onSubmit = form.handleSubmit((values) => {
    createTrip.mutate(values, {
      onSuccess: (trip) => {
        toast.success('บันทึกการใช้รถเรียบร้อย');
        router.push(`/trips/${trip.id}`);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
      },
    });
  });

  return (
    <Card className="max-w-2xl mx-auto p-6 space-y-6 border-border shadow-none">
      <form onSubmit={onSubmit} className="space-y-6">
        <MainRoute form={form} />
        <AdditionalStops form={form} />
        <DriversSection form={form} />
        <TripDetails form={form} />
        <FormActions
          isSubmitting={form.formState.isSubmitting || createTrip.isPending}
          onCancel={() => router.back()}
        />
      </form>
    </Card>
  );
}
