'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { TripStats } from '@/types/trip';

export function useStats(
  p0: string,
  period: 'day' | 'week' | 'month' | 'year'
) {
  const [stats, setStats] = useState<TripStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // ตรวจสอบว่ามี token หรือไม่ ถ้าไม่มีให้รอก่อน
        const token = localStorage.getItem('carWebtime_token');
        if (!token) {
          console.log('No token found, waiting for authentication');
          setTimeout(load, 1000); // รอ 1 วินาทีแล้วลองใหม่
          return;
        }

        // เรียกใช้ API
        const data = await fetchWithAuth(
          `/api/stats/car-usage?period=${period}`
        );
        if (!canceled) {
          // console.log('Stats loaded:', data); // เพิ่ม log เพื่อดูข้อมูลที่ได้รับ
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
        if (!canceled)
          setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [period]);

  return { stats, loading, error };
}
