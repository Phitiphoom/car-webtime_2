// src/hooks/queries/useLegacyTrips.ts
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  LegacyTripDetail,
  LegacyTripList,
} from '@/server/legacy/legacy-trip.types';

export function useLegacyTrips(params: {
  page: number;
  limit: number;
  search: string;
}) {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.search) qs.set('search', params.search);
  return useQuery({
    queryKey: ['legacy-trips', params],
    queryFn: () => api.get<LegacyTripList>(`/api/legacy/trips?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useLegacyTrip(id: number | null) {
  return useQuery({
    queryKey: ['legacy-trips', 'detail', id],
    queryFn: () => api.get<LegacyTripDetail>(`/api/legacy/trips/${id}`),
    enabled: id !== null,
  });
}
