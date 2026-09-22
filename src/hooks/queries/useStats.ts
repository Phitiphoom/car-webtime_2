// src/hooks/queries/useStats.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CarUsageStats {
  totalTrips: number;
  period: { start: string; end: string; type: string };
  byStatus: { value: string; count: number }[];
  byCarBrand: { value: string; count: number }[];
  byPurpose: { value: string; count: number }[];
  byDepartment: { value: string; count: number }[];
}

export function useCarUsageStats(
  period: 'day' | 'week' | 'month' | 'year' = 'month'
) {
  return useQuery({
    queryKey: ['stats', 'car-usage', period],
    queryFn: () =>
      api.get<CarUsageStats>(`/api/stats/car-usage?period=${period}`),
  });
}
