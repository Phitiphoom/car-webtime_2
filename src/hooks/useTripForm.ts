// src/hooks/useTripForm.ts
//
// Backs the single shared trip-form component tree used by both /log-usage
// (create) and /trips/[id]/edit (edit) — replaces the old useLogUsageForm.ts
// (256 lines, ~10 hooks) and useEditTripForm.ts (189 lines, ~19 hooks), each
// hand-rolling its own state for what is the same underlying form.
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTripSchema, CreateTripInput } from '@/server/trips/trip.schema';

export function useTripForm(defaultValues?: Partial<CreateTripInput>) {
  return useForm<CreateTripInput>({
    resolver: zodResolver(CreateTripSchema),
    defaultValues: {
      startPoint: '',
      endPoint: '',
      carId: 0,
      department: '',
      date: new Date().toISOString().slice(0, 10),
      items: [],
      driverIds: [],
      approverEmails: [],
      ...defaultValues,
    },
  });
}

export type TripFormReturn = ReturnType<typeof useTripForm>;
