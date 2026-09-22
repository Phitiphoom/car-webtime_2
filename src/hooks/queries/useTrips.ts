// src/hooks/queries/useTrips.ts
//
// Replaces the old useTrips/useTripHistory/useTripFilters trio — three
// separate hooks independently caching what was really the same underlying
// trip-list query. One useQuery keyed on the filter object collapses that;
// changing a filter just changes the query key instead of needing its own
// hook.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TripDTO } from '@/server/trips/trip.mapper';
import type {
  CreateTripInput,
  SendApprovalInput,
  TripFilterInput,
  UpdateTripDetailsInput,
} from '@/server/trips/trip.schema';
import type { TripStatus } from '@/server/shared/enums';

export interface TripListResult {
  data: TripDTO[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type TripFilters = Partial<TripFilterInput>;

function toQueryString(filters: TripFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function useTrips(filters: TripFilters = {}) {
  return useQuery({
    queryKey: ['trips', filters],
    queryFn: () =>
      api.get<TripListResult>(`/api/trips?${toQueryString(filters)}`),
    placeholderData: (previous) => previous,
  });
}

export function useTrip(id: number | null) {
  return useQuery({
    queryKey: ['trips', 'detail', id],
    queryFn: () => api.get<TripDTO>(`/api/trips/${id}`),
    enabled: id !== null,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTripInput) =>
      api.post<{ data: TripDTO }>('/api/trips', input).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useUpdateTripStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: Extract<TripStatus, 'APPROVED' | 'REJECTED'>;
    }) => api.put<TripDTO>(`/api/trips/${id}`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({
        queryKey: ['trips', 'detail', variables.id],
      });
    },
  });
}

export function useUpdateTripDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: UpdateTripDetailsInput;
    }) => api.put<TripDTO>(`/api/trips/${id}`, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['trips', 'detail', variables.id],
      });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/trips/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useSendApproval() {
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: SendApprovalInput }) =>
      api.post(`/api/trips/${id}/send-approval`, input),
  });
}
