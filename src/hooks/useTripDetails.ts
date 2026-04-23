/* File: src/hooks/useTripDetails.ts */
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { Trip } from '@/types/trip';
import { fetchWithAuth } from '@/lib/api';

export function useTripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const tripId = Number(id);
  const { user } = useAuth();
  const { fetchTripById, approveTrip, rejectTrip, deleteTrip } = useTrips();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [approverEmail, setApproverEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (isNaN(tripId)) throw new Error('Invalid trip ID');
        const data = await fetchTripById(tripId);
        if (!data) throw new Error('Trip not found');
        setTrip(data);
        setApproverEmail(data.Approve_Email || '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tripId, fetchTripById]);

  const canApprove =
    !!trip &&
    (user?.role === 'admin' ||
      (user?.role === 'approver' && user.department === trip.DEPARTMENT));
  const canModify =
    !!trip && (user?.role === 'admin' || user?.id === trip.RECORD_BY);

  const handleApprove = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      const updated = await approveTrip(trip.TID);
      if (updated) {
        setTrip(updated);
        setActionSuccess('Trip approved successfully');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      const updated = await rejectTrip(trip.TID);
      if (updated) {
        setTrip(updated);
        setActionSuccess('Trip rejected');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      const ok = await deleteTrip(trip.TID);
      if (ok) {
        setActionSuccess('Trip deleted');
        setTimeout(() => router.push('/dashboard'), 1500);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSendEmail = async () => {
    if (!trip) return;
    setSendingEmail(true);
    setEmailError(null);
    try {
      const res = await fetchWithAuth(`/api/trips/${trip.TID}/send-approval`, {
        method: 'POST',
        body: JSON.stringify({ approverEmail }),
      });
      if (!res.success) throw new Error(res.error || 'Failed to send');
      setEmailSent(true);
      setTrip({ ...trip, Approve_Email: approverEmail });
      setTimeout(() => setShowEmailDialog(false), 1500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setEmailError(e.message);
    } finally {
      setSendingEmail(false);
    }
  };

  return {
    trip,
    loading,
    error,
    actionLoading,
    actionSuccess,
    canApprove,
    canModify,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showEmailDialog,
    setShowEmailDialog,
    approverEmail,
    setApproverEmail,
    sendingEmail,
    emailSent,
    emailError,
    handleApprove,
    handleReject,
    handleDelete,
    handleSendEmail,
  };
}
