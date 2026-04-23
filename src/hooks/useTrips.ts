/* -------------------------------------------------------------------------- */
/*  src/hooks/useTrips.ts                                                     */
/* -------------------------------------------------------------------------- */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api';
import {
  Trip,
  TripFilters,
  PaginationOptions,
  ApiResponse,
} from '@/types/trip';

/* -------------------------------------------------------------------------- */
/*  Type helpers                                                              */
/* -------------------------------------------------------------------------- */
type PaginationState = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */
export function useTrips() {
  /* ── State ───────────────────────────────────────────────────────────── */
  const [trips, setTrips] = useState<Trip[]>([]); // ← ALWAYS an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  /* ── Query-string helper ─────────────────────────────────────────────── */
  const buildQueryString = (
    filters?: TripFilters,
    opts?: PaginationOptions
  ): string => {
    const p = new URLSearchParams();

    if (filters?.carBrand) p.append('carBrand', filters.carBrand);
    if (filters?.status) p.append('status', filters.status);
    if (filters?.startDate) p.append('startDate', filters.startDate);
    if (filters?.endDate) p.append('endDate', filters.endDate);
    if (filters?.userId) p.append('userId', filters.userId);
    if (filters?.department) p.append('department', filters.department);

    if (opts) {
      p.append('page', String(opts.page ?? 1));
      p.append('limit', String(opts.limit ?? 10));
      if (opts.sortBy) p.append('sortBy', opts.sortBy);
      if (opts.sortOrder) p.append('sortOrder', opts.sortOrder);
    }

    return p.toString() ? `?${p}` : '';
  };

  /* ── Core fetch ──────────────────────────────────────────────────────── */
  const fetchTrips = useCallback(
    async (filters?: TripFilters, opts?: PaginationOptions) => {
      setLoading(true);
      setError(null);

      try {
        const qs = buildQueryString(filters, {
          page: opts?.page ?? pagination.page,
          limit: opts?.limit ?? pagination.limit,
          sortBy: opts?.sortBy ?? 'DATE', // Default to sorting by DATE
          sortOrder: opts?.sortOrder ?? 'desc', // Default to descending order
        });

        const res: ApiResponse<Trip> | Trip[] = await fetchWithAuth(
          `/api/trips${qs}`
        );

        /* ── Normalize list ─────────────────────────────────────────── */
        const list = Array.isArray(res) ? res : res.data;
        setTrips(Array.isArray(list) ? list : []);

        /* ── Normalize pagination ──────────────────────────────────── */
        const p = Array.isArray(res) ? undefined : res.pagination;
        if (p) {
          setPagination({
            page: p.page,
            limit: p.limit,
            totalCount: p.totalCount,
            totalPages: p.totalPages,
            hasNext: p.hasNext,
            hasPrev: p.hasPrev,
          });
        }
      } catch (err) {
        console.error('Error fetching trips:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch trips');
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit]
  );

  /* ── Single trip fetch ──────────────────────────────────────────────── */
  const fetchTripById = useCallback(
    async (id: number): Promise<Trip | null> => {
      try {
        return await fetchWithAuth(`/api/trips/${id}`);
      } catch (err) {
        console.error(`Error fetching trip ${id}:`, err);
        setError(
          err instanceof Error ? err.message : `Failed to fetch trip ${id}`
        );
        return null;
      }
    },
    []
  );

  /* ── Pagination helpers ─────────────────────────────────────────────── */
  const goToPage = useCallback(
    (page: number) => fetchTrips(undefined, { page, limit: pagination.limit }),
    [fetchTrips, pagination.limit]
  );

  const changeLimit = useCallback(
    (limit: number) => fetchTrips(undefined, { page: 1, limit }),
    [fetchTrips]
  );

  const nextPage = useCallback(
    () => pagination.hasNext && goToPage(pagination.page + 1),
    [goToPage, pagination]
  );

  const prevPage = useCallback(
    () => pagination.hasPrev && goToPage(pagination.page - 1),
    [goToPage, pagination]
  );

  /* ── Mutation helpers (create / update / delete / approve / reject) ─── */
  const createTrip = useCallback(
    async (tripData: Partial<Trip>): Promise<Trip | null> => {
      // basic validation
      if (
        !tripData.START_POINT ||
        !tripData.END_POINT ||
        !tripData.CARBARND ||
        !tripData.DATE
      ) {
        throw new Error(
          'Missing required fields: start point, end point, vehicle, or date.'
        );
      }

      const payload = {
        ...tripData,
        DATE:
          tripData.DATE instanceof Date
            ? tripData.DATE.toISOString()
            : tripData.DATE,
        TIME:
          tripData.TIME instanceof Date
            ? tripData.TIME.toISOString()
            : tripData.TIME,
      };

      const data = await fetchWithAuth('/api/trips', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setTrips((prev) => [data, ...prev]);
      return data;
    },
    []
  );

  const updateTrip = useCallback(
    async (id: number, body: Partial<Trip>): Promise<Trip | null> => {
      const data = await fetchWithAuth(`/api/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setTrips((prev) => prev.map((t) => (t.TID === id ? data : t)));
      return data;
    },
    []
  );

  const deleteTrip = useCallback(async (id: number): Promise<boolean> => {
    await fetchWithAuth(`/api/trips/${id}`, { method: 'DELETE' });
    setTrips((prev) => prev.filter((t) => t.TID !== id));
    return true;
  }, []);

  const approveTrip = useCallback(async (id: number): Promise<Trip | null> => {
    const data = await fetchWithAuth(`/api/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ APPROVE_STATUS: 'Approved' }),
    });
    setTrips((prev) => prev.map((t) => (t.TID === id ? data : t)));
    return data;
  }, []);

  const rejectTrip = useCallback(async (id: number): Promise<Trip | null> => {
    const data = await fetchWithAuth(`/api/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ APPROVE_STATUS: 'Rejected' }),
    });
    setTrips((prev) => prev.map((t) => (t.TID === id ? data : t)));
    return data;
  }, []);

  /* ── Initial load ────────────────────────────────────────────────────── */
  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  /* ── Expose API ──────────────────────────────────────────────────────── */
  return {
    trips, // always []
    loading,
    error,
    pagination,

    /* Read */
    fetchTrips,
    fetchTripById,

    /* Mutations */
    createTrip,
    updateTrip,
    deleteTrip,
    approveTrip,
    rejectTrip,

    /* Pagination helpers */
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
  };
}
