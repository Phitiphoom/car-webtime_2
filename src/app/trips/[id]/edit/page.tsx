// src/app/trips/[id]/edit/page.tsx
//
// Only purpose is actually editable — see
// the note in src/components/trip-form/TripForm.tsx for why the route/car/
// driver fields aren't (the old "full edit" UI never worked; the backend
// only ever persisted this field).
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FormActions } from '@/components/trip-form/FormActions';
import { useTrip, useUpdateTripDetails } from '@/hooks/queries/useTrips';
import {
  UpdateTripDetailsSchema,
  UpdateTripDetailsInput,
} from '@/server/trips/trip.schema';

export default function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tripId = Number(id);
  const router = useRouter();
  const { data: trip, isLoading } = useTrip(tripId);
  const updateDetails = useUpdateTripDetails();

  const form = useForm<UpdateTripDetailsInput>({
    resolver: zodResolver(UpdateTripDetailsSchema),
    values: trip
      ? { purpose: trip.purpose ?? '' }
      : undefined,
  });

  const onSubmit = form.handleSubmit((values) => {
    updateDetails.mutate(
      { id: tripId, input: values },
      {
        onSuccess: () => {
          toast.success('บันทึกการแก้ไขแล้ว');
          router.push(`/trips/${tripId}`);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ'),
      }
    );
  });

  return (
    <AuthGuard>
      <AppShell title="แก้ไขทริป">
        <Card className="max-w-2xl mx-auto p-6 space-y-6 border-border shadow-none">
          {isLoading || !trip ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <CardContent className="p-0 text-sm text-muted-foreground space-y-1">
                <p>
                  {trip.startPoint} → {trip.endPoint} · {trip.car.brand}{' '}
                  {trip.car.model} ({trip.car.plateNumber})
                </p>
                <p>เส้นทางและยานพาหนะแก้ไขไม่ได้หลังบันทึกแล้ว</p>
              </CardContent>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="purpose">วัตถุประสงค์</Label>
                  <Input id="purpose" {...form.register('purpose')} />
                </div>
                <FormActions
                  isSubmitting={
                    form.formState.isSubmitting || updateDetails.isPending
                  }
                  onCancel={() => router.back()}
                />
              </form>
            </>
          )}
        </Card>
      </AppShell>
    </AuthGuard>
  );
}
