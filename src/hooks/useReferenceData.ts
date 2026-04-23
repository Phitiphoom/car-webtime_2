/* File: src/hooks/useReferenceData.ts */
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';

export function useReferenceData() {
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [approverEmails, setApproverEmails] = useState<
    { id: string; email: string; name: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [brands, depts, users] = await Promise.all([
          fetchWithAuth('/api/car-brands'),
          fetchWithAuth('/api/departments'),
          fetchWithAuth('/api/users'),
        ]);
        setCarBrands(brands);
        setDepartments(depts);

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
        const approvers = users
          .filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (u: any) =>
              !!u.EMAIL?.trim() && allowed.includes(u.DEPARTMENT ?? '')
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((u: any) => ({
            id: String(u.ID),
            email: u.EMAIL.trim(),
            name: u.NAME,
          }));
        setApproverEmails(approvers);
      } catch (e) {
        console.error(e);
        setError('Failed to load reference data');
      }
    }
    load();
  }, []);

  return { carBrands, departments, approverEmails, error };
}
