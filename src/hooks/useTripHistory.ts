// File: src/hooks/useTripHistory.ts
'use client';
import { useState, useMemo } from 'react';
import { TripFilters } from '@/types/trip';
import { useTrips } from '@/hooks/useTrips';

export function useTripHistory() {
  const {
    trips,
    loading,
    error,
    fetchTrips,
    pagination,
    goToPage,
    changeLimit,
  } = useTrips();

  // Search term for client-side filtering
  const [searchTerm, setSearchTerm] = useState('');

  // Server-side filters
  const [filters, setFilters] = useState<TripFilters>({} as TripFilters);

  // Loading state for manual refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Client-side filtered view
  const filteredTrips = useMemo(() => {
    if (!searchTerm) return trips;
    const term = searchTerm.toLowerCase();
    return trips.filter((t) =>
      [
        t.START_POINT,
        t.END_POINT,
        t.PURPOSE,
        t.CARBARND,
        t.RECORD_BY,
        t.DEPARTMENT,
      ].some((val) => val?.toLowerCase().includes(term))
    );
  }, [trips, searchTerm]);

  // Unique options for filters
  const uniqueCarBrands = useMemo(
    () => [...new Set(trips.map((t) => t.CARBARND).filter(Boolean))],
    [trips]
  );
  const uniqueDepartments = useMemo(
    () => [...new Set(trips.map((t) => t.DEPARTMENT).filter(Boolean))],
    [trips]
  );

  // Apply server filters and reset to page 1
  function applyFilters(serverFilters: TripFilters) {
    setFilters(serverFilters);
    fetchTrips(serverFilters, { page: 1, limit: pagination.limit });
  }

  // Clear all filters
  function clearFilters() {
    setFilters({} as TripFilters);
    setSearchTerm('');
    fetchTrips(
      {
        search: '',
      },
      { page: 1, limit: pagination.limit }
    );
  }

  // Manual refresh using current server filters
  async function refresh() {
    setIsRefreshing(true);
    await fetchTrips(filters, {
      page: pagination.page,
      limit: pagination.limit,
    });
    setIsRefreshing(false);
  }

  return {
    trips,
    filteredTrips,
    loading,
    error,
    pagination,
    goToPage,
    changeLimit,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    uniqueCarBrands,
    uniqueDepartments,
    applyFilters,
    clearFilters,
    refresh,
    isRefreshing,
  };
}
