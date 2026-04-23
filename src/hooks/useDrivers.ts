// src/hooks/useDrivers.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

interface Driver {
  DRIVER_ID: number;
  DRIVER_NAME: string;
  DEPARTMENT?: string;
}

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setIsLoading(true);

        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/drivers', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch drivers');
        }

        const { data } = await response.json();
        setDrivers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load drivers');
        console.error('Error fetching drivers:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivers();
  }, [token, router]);

  return {
    drivers,
    isLoading,
    error,
    getDriverName: (id: number) =>
      drivers.find((d) => d.DRIVER_ID === id)?.DRIVER_NAME,
    getDriverById: (id: number) => drivers.find((d) => d.DRIVER_ID === id),
  };
}

export default useDrivers;
