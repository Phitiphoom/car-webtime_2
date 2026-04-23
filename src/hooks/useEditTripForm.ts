/* File: src/hooks/useEditTripForm.ts */
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTrips } from '@/hooks/useTrips';
import { Trip } from '@/types/trip';

interface Route {
  START_POINT: string;
  END_POINT: string;
}

export function useEditTripForm() {
  const { id } = useParams();
  const router = useRouter();
  const tripId = Number(id);
  const { fetchTripById, updateTrip } = useTrips();

  // Original trip
  const [originalTrip, setOriginalTrip] = useState<Trip | null>(null);
  // Form fields
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [additionalRoutes, setAdditionalRoutes] = useState<Route[]>([]);
  const [carBrand, setCarBrand] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [purposeText, setPurposeText] = useState('');
  const [remarks, setRemarks] = useState('');
  const [department, setDepartment] = useState('');
  const [approverEmail, setApproverEmail] = useState('');
  const [drivers, setDrivers] = useState<string[]>(['']);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helpers
  const formatDateInput = (d?: Date | string): string => {
    if (!d) return '';
    const iso = typeof d === 'string' ? d : d.toISOString();
    return iso.split('T')[0];
  };
  const formatTimeInput = (t?: Date | string): string => {
    if (!t) return '';
    const dt = typeof t === 'string' ? new Date(t) : t;
    const hh = dt.getHours().toString().padStart(2, '0');
    const mm = dt.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const trip = await fetchTripById(tripId);
        if (!trip) throw new Error('Trip not found');
        setOriginalTrip(trip);
        setStartPoint(trip.START_POINT || '');
        setEndPoint(trip.END_POINT || '');
        setCarBrand(trip.CARBARND || '');
        setDate(formatDateInput(trip.DATE));
        setTime(formatTimeInput(trip.TIME ?? undefined));
        setPurpose(trip.PURPOSE || '');
        setPurposeText(trip.PURPOSE_TEXT || '');
        setRemarks(trip.REMARK || '');
        setDepartment(trip.DEPARTMENT || '');
        setApproverEmail(trip.Approve_Email || '');
        setAdditionalRoutes(
          trip.items?.map((i) => ({
            START_POINT: i.START_POINT || '',
            END_POINT: i.END_POINT || '',
          })) || []
        );
        setDrivers(trip.drivers?.map((d) => d.DRIVER_NAME) || ['']);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tripId, fetchTripById]);

  // Handlers
  const handleRouteChange = (idx: number, field: keyof Route, val: string) =>
    setAdditionalRoutes((r) =>
      r.map((rt, i) => (i === idx ? { ...rt, [field]: val } : rt))
    );
  const addRoute = () =>
    setAdditionalRoutes((r) => [...r, { START_POINT: '', END_POINT: '' }]);
  const removeRoute = (i: number) =>
    setAdditionalRoutes((r) => r.filter((_, idx) => idx !== i));

  const handleDriverChange = (i: number, val: string) =>
    setDrivers((d) => d.map((x, idx) => (idx === i ? val : x)));
  const addDriver = () => setDrivers((d) => [...d, '']);
  const removeDriver = (i: number) =>
    setDrivers((d) => d.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (!startPoint || !endPoint || !carBrand || !date || !department) {
        throw new Error('Please fill required fields');
      }
      const payload: Partial<Trip> = {
        START_POINT: startPoint,
        END_POINT: endPoint,
        CARBARND: carBrand,
        DATE: new Date(date),
        TIME: time ? new Date(`1970-01-01T${time}:00`) : null,
        PURPOSE: purpose,
        PURPOSE_TEXT: purpose === 'Other' ? purposeText : '',
        REMARK: remarks,
        DEPARTMENT: department,
        Approve_Email: approverEmail,
      };
      const validRoutes = additionalRoutes.filter(
        (r) => r.START_POINT && r.END_POINT
      );
      if (validRoutes.length)
        payload.items = validRoutes.map((r, i) => ({
          ITEM_ID: i + 1,
          START_POINT: r.START_POINT,
          END_POINT: r.END_POINT,
        }));
      const validDrivers = drivers.filter((d) => d.trim());
      if (validDrivers.length)
        payload.drivers = validDrivers.map((n, i) => ({
          DriverID: i + 1,
          DRIVER_NAME: n,
        }));
      const ok = await updateTrip(tripId, payload);
      if (!ok) throw new Error('Update failed');
      setSuccess('Trip updated');
      setTimeout(() => router.push(`/trips/${tripId}`), 1500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    originalTrip,
    startPoint,
    setStartPoint,
    endPoint,
    setEndPoint,
    additionalRoutes,
    handleRouteChange,
    addRoute,
    removeRoute,
    carBrand,
    setCarBrand,
    date,
    setDate,
    time,
    setTime,
    purpose,
    setPurpose,
    purposeText,
    setPurposeText,
    remarks,
    setRemarks,
    department,
    setDepartment,
    approverEmail,
    setApproverEmail,
    drivers,
    handleDriverChange,
    addDriver,
    removeDriver,
    loading,
    submitting,
    error,
    success,
    handleSubmit,
  };
}
