import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export interface Car {
  CAR_ID: number;
  CAR_CODE: string;
  BRAND: string;
  MODEL: string;
  PLATE_NUMBER: string;
}

export function useCars() {
  const [cars, setCars] = useState<Car[]>([]); // Changed from drivers to cars
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    const fetchCars = async () => {
      // Changed function name to match purpose
      try {
        setIsLoading(true);

        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/cars', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch cars'); // Updated error message
        }

        const { data } = await response.json();
        setCars(Array.isArray(data) ? data : []); // Added safety check
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cars');
        console.error('Error fetching cars:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCars();
  }, [token, router]);

  return {
    cars, // Changed from drivers to cars
    isLoading,
    error,
    // Helper functions
    getCarById: (id: number) => cars.find((car) => car.CAR_ID === id),
    getCarByPlate: (plate: string) =>
      cars.find((car) => car.PLATE_NUMBER === plate),
  };
}
