// src/hooks/queries/useReferenceData.ts
//
// Replaces the old useCars/useDrivers/useFormOptions/useReferenceData hooks
// (four overlapping implementations, some hand-rolled fetch with duplicated
// 401 handling, one with a leftover "// Changed from drivers to cars"
// copy-paste comment). One React Query hook per resource, all going through
// the shared api client (src/lib/api.ts) — one fetch implementation, one
// cache, keyed so mutations elsewhere can invalidate precisely.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateCarInput } from '@/server/reference-data/car.schema';
import type { CreateDriverInput } from '@/server/reference-data/driver.schema';

export interface CarOption {
  id: number;
  carCode: string | null;
  model: string;
  plateNumber: string;
  color: string | null;
  status: string | null;
  isActive: boolean;
  brand: { id: number; name: string };
}

export interface DriverOption {
  id: number;
  driverCode: string | null;
  name: string;
  phone: string | null;
  isActive: boolean;
  department: { id: number; name: string } | null;
}

export interface ApproverOption {
  id: string;
  name: string;
  email: string | null;
  department: string;
  role: string;
}

export function useCars(includeInactive = false) {
  return useQuery({
    queryKey: ['cars', { includeInactive }],
    queryFn: async () =>
      (
        await api.get<{ data: CarOption[] }>(
          `/api/cars${includeInactive ? '?includeInactive=1' : ''}`
        )
      ).data,
    staleTime: 5 * 60_000,
  });
}

export function useDrivers(includeInactive = false) {
  return useQuery({
    queryKey: ['drivers', { includeInactive }],
    queryFn: async () =>
      (
        await api.get<{ data: DriverOption[] }>(
          `/api/drivers${includeInactive ? '?includeInactive=1' : ''}`
        )
      ).data,
    staleTime: 5 * 60_000,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<string[]>('/api/departments'),
    staleTime: 5 * 60_000,
  });
}

export function useCarBrands() {
  return useQuery({
    queryKey: ['car-brands'],
    queryFn: () => api.get<string[]>('/api/car-brands'),
    staleTime: 5 * 60_000,
  });
}

export function useApprovers(department?: string) {
  return useQuery({
    queryKey: ['approvers', department ?? null],
    queryFn: () =>
      api.get<ApproverOption[]>(
        `/api/approvers${department ? `?department=${encodeURIComponent(department)}` : ''}`
      ),
    staleTime: 5 * 60_000,
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCarInput) => api.post('/api/cars', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car-brands'] });
    },
  });
}

export function useDeactivateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/cars/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cars'] }),
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDriverInput) => api.post('/api/drivers', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useDeactivateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/drivers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export function useRestoreCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/cars/${id}/restore`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cars'] }),
  });
}

export function useRestoreDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/drivers/${id}/restore`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}
