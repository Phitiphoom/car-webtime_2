'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';

export type Approver = {
  id: string;
  email: string;
  name: string;
};

export function useFormOptions() {
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [approverEmails, setApproverEmails] = useState<Approver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [brandsData, deptsData, usersData] = await Promise.all([
          fetchWithAuth('/api/car-brands'),
          fetchWithAuth('/api/departments'),
          fetchWithAuth('/api/users'),
        ]);

        if (canceled) return;

        setCarBrands(brandsData);
        setDepartments(deptsData);

        // คัดกรอง approver ตามแผนกที่กำหนด
        const allowed = [
          'Supply Chain Department',
          'MIS',
          'Vice President',
          'ACoEC',
          'ADV. COEC',
          'MD',
          'MD SCM',
          'MD PRD',
          'MD QC',
          'MD ACC',
          'MD MKT',
        ];
        const approvers: Approver[] = usersData
          .filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (u: any) => u.EMAIL?.trim() && allowed.includes(u.DEPARTMENT ?? '')
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((u: any) => ({
            id: String(u.ID),
            email: u.EMAIL.trim(),
            name: u.NAME,
          }));

        setApproverEmails(approvers);
      } catch (err) {
        if (!canceled) setError('Failed to load form data');
        console.error(err);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  return { carBrands, departments, approverEmails, loading, error };
}
