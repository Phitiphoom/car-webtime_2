/* -------------------------------------------------------------------------- */
/*  File: src/components/PendingApprovals.tsx                                 */
/*  รายการทริปรออนุมัติ - Improved Responsive Design                         */
/* -------------------------------------------------------------------------- */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { fetchWithAuth } from '@/lib/api';
import { Trip } from '@/types/trip';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Calendar,
  Car,
  ClipboardCheck,
  Map,
  User,
  Clock,
  Briefcase,
  ArrowRight,
  FileText,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* แผนกที่สามารถเห็นทริปทั้งหมด */
const ALLOWED_DEPARTMENTS = [
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

export function PendingApprovals() {
  const { user } = useAuth();

  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>(
    {}
  );
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ------------------------------------------------------------ */
  /*  ดึงทริปรออนุมัติ                                           */
  /* ------------------------------------------------------------ */
  const fetchPendingApprovals = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      /* query string */
      const qs = new URLSearchParams({
        status: 'Pending',
        ...(user.role === 'admin'
          ? {}
          : user.department
            ? { department: user.department }
            : {}),
      }).toString();

      const res = await fetchWithAuth(`/api/trips?${qs}`);
      const trips = Array.isArray(res) ? res : (res.data ?? []);

      /* กรองตามบทบาท / แผนก */
      const list =
        user.role === 'admin' ||
        ALLOWED_DEPARTMENTS.includes(user.department ?? '')
          ? trips
          : trips.filter(
              (t: Trip) =>
                t.Approve_Email === user.email ||
                t.DEPARTMENT === user.department
            );

      setPendingTrips(list);
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      setError('ไม่สามารถโหลดทริปรออนุมัติ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  /* ------------------------------------------------------------ */
  /*  อนุมัติ / ปฏิเสธ                                           */
  /* ------------------------------------------------------------ */
  const mutateTrip = async (tripId: number, status: 'Approve' | 'Rejected') => {
    setActionLoading((s) => ({ ...s, [tripId]: true }));
    try {
      await fetchWithAuth(`/api/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify({
          APPROVE_STATUS: status,
          APPROVED_BY: user?.name ?? 'Unknown User',
          APPROVED_AT: new Date(),
        }),
      });

      setPendingTrips((prev) => prev.filter((t) => t.TID !== tripId));

      setNotification({
        type: 'success',
        message: `ดำเนินการ${
          status === 'Approve' ? 'อนุมัติ' : 'ปฏิเสธ'
        }สำเร็จแล้ว!`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(`Error updating trip ${tripId}:`, err);
      setError('เกิดข้อผิดพลาดในการบันทึกผล');
      setNotification({
        type: 'error',
        message: 'ไม่สามารถบันทึกผลได้ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setActionLoading((s) => ({ ...s, [tripId]: false }));
    }
  };

  const handleApprove = (id: number) => mutateTrip(id, 'Approve');
  const handleReject = (id: number) => mutateTrip(id, 'Rejected');
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingApprovals();
  };

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  /* ------------------------------------------------------------ */
  /*  Mobile Menu Renderer                                       */
  /* ------------------------------------------------------------ */
  const renderMobileMenu = () => (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sm:hidden fixed inset-x-0 top-0 z-50 bg-background shadow-lg"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">
                เมนูทริปรออนุมัติ
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <div className="p-4 space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full text-primary border-primary/20"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              รีเฟรช
            </Button>
            <Link href="/dashboard" className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-primary border-primary/20"
              >
                <FileText className="h-4 w-4 mr-2" />
                ดูทริปทั้งหมด
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ------------------------------------------------------------ */
  /*  Trip Details Renderer                                      */
  /* ------------------------------------------------------------ */
  const renderTripDetails = (trip: Trip) => (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Route */}
        <div className="flex items-start gap-3">
          <Map className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">เส้นทาง</p>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="truncate max-w-[120px]">{trip.START_POINT}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[120px]">{trip.END_POINT}</span>
            </div>
          </div>
        </div>

        {/* Requester */}
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">ผู้ขอใช้รถ</p>
            <p className="text-sm font-medium text-foreground truncate">
              {trip.RECORD_BY_NAME || trip.RECORD_BY || 'ไม่ระบุ'}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="sm:hidden flex flex-col space-y-2 mt-4">
        <Link href={`/trips/${trip.TID}`} className="w-full">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-primary border-primary/20 hover:bg-primary/10"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            ดูรายละเอียด
          </Button>
        </Link>
        <div className="flex space-x-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReject(trip.TID)}
            disabled={actionLoading[trip.TID]}
            className="w-1/2 border-destructive/20 bg-background text-destructive hover:bg-destructive/10"
          >
            {actionLoading[trip.TID] ? (
              <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-1.5" />
            )}
            ปฏิเสธ
          </Button>
          <Button
            size="sm"
            onClick={() => handleApprove(trip.TID)}
            disabled={actionLoading[trip.TID]}
            className="w-1/2 bg-success hover:bg-success/90 text-success-foreground"
          >
            {actionLoading[trip.TID] ? (
              <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1.5" />
            )}
            อนุมัติ
          </Button>
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------ */
  /*  Trip List Item Renderer                                    */
  /* ------------------------------------------------------------ */
  const renderTripListItem = (trip: Trip) => (
    <motion.div
      key={trip.TID}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="p-5 hover:bg-muted/50 transition-colors"
    >
      {/* Header Section */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground flex items-center gap-2 mb-1">
            <Car className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate max-w-[200px]">{trip.CARBARND}</span>
            {trip.PURPOSE && (
              <>
                <span className="mx-1.5 text-muted-foreground shrink-0">•</span>
                <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                  {trip.PURPOSE}
                </span>
              </>
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDate(trip.DATE)}</span>
            </div>
            {trip.DEPARTMENT && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[100px]">
                  {trip.DEPARTMENT}
                </span>
              </div>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-warning/10 text-warning-foreground border-warning/20 flex items-center gap-1 shrink-0 ml-2"
        >
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden sm:flex justify-between">
        <Link href={`/trips/${trip.TID}`}>
          <Button
            variant="outline"
            size="sm"
            className="text-primary border-primary/20 hover:bg-primary/10"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            ดูรายละเอียด
          </Button>
        </Link>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReject(trip.TID)}
            disabled={actionLoading[trip.TID]}
            className="border-destructive/20 bg-background text-destructive hover:bg-destructive/10"
          >
            {actionLoading[trip.TID] ? (
              <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-1.5" />
            )}
            ปฏิเสธ
          </Button>
          <Button
            size="sm"
            onClick={() => handleApprove(trip.TID)}
            disabled={actionLoading[trip.TID]}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            {actionLoading[trip.TID] ? (
              <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1.5" />
            )}
            อนุมัติ
          </Button>
        </div>
      </div>

      {/* Expandable Details for Mobile */}
      <div className="sm:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setExpandedTrip(expandedTrip === trip.TID ? null : trip.TID)
          }
          className="w-full justify-center text-primary mt-2"
        >
          {expandedTrip === trip.TID ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
        </Button>
        {expandedTrip === trip.TID && renderTripDetails(trip)}
      </div>
    </motion.div>
  );

  /* ------------------------------------------------------------ */
  /*  Loading State Renderer                                     */
  /* ------------------------------------------------------------ */
  if (loading && !refreshing)
    return (
      <Card className="overflow-hidden border-border shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span>ทริปรออนุมัติ</span>
          </CardTitle>
          <CardDescription>กำลังโหลดข้อมูล…</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex justify-between pt-2">
                <Skeleton className="h-9 w-28" />
                <div className="space-x-2">
                  <Skeleton className="h-9 w-24 inline-block" />
                  <Skeleton className="h-9 w-24 inline-block" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );

  /* ------------------------------------------------------------ */
  /*  Error State Renderer                                       */
  /* ------------------------------------------------------------ */
  if (error)
    return (
      <Card className="overflow-hidden border-border shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span>ทริปรออนุมัติ</span>
          </CardTitle>
          <CardDescription>ไม่สามารถโหลดข้อมูลได้</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-start gap-3">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">เกิดข้อผิดพลาด</p>
              <p className="text-sm">{error}</p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="mt-3 border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                ลองอีกครั้ง
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );

  /* ------------------------------------------------------------ */
  /*  Empty State Renderer                                       */
  /* ------------------------------------------------------------ */
  if (pendingTrips.length === 0)
    return (
      <Card className="overflow-hidden border-border shadow-none">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <span>ทริปรออนุมัติ</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 text-xs border-primary/20 text-primary"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`}
              />
              รีเฟรช
            </Button>
          </div>
          <CardDescription>ไม่มีทริปรออนุมัติ</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5">
            <ClipboardCheck className="h-10 w-10 text-primary" />
          </div>
          <p className="text-lg font-semibold mb-2 text-foreground">
            ทุกอย่างเรียบร้อย!
          </p>
          <p className="max-w-md mx-auto text-muted-foreground">
            ขณะนี้ไม่มีทริปรอการอนุมัติของคุณ กดรีเฟรชเพื่ออัปเดตข้อมูลอีกครั้ง
          </p>
        </CardContent>
      </Card>
    );

  /* ------------------------------------------------------------ */
  /*  Main Render                                                */
  /* ------------------------------------------------------------ */
  return (
    <Card className="overflow-hidden border-border shadow-none relative">
      {/* Mobile Menu */}
      {renderMobileMenu()}

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-3 right-3 z-10 rounded-lg px-4 py-3 shadow-md ${
              notification.type === 'success'
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {notification.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Header with Responsive Layout */}
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-foreground text-lg">
                ทริปรออนุมัติ
              </CardTitle>
              <CardDescription className="mt-1">
                {pendingTrips.length} รายการที่รอการอนุมัติของคุณ
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Toggle */}
            <div className="sm:hidden">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-primary"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 text-xs border-primary/20 text-primary hidden sm:inline-flex"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`}
              />
              รีเฟรช
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className={`p-0 ${refreshing ? 'opacity-50' : ''}`}>
        <div className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {pendingTrips.map((trip) => renderTripListItem(trip))}
          </AnimatePresence>
        </div>
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="p-4 bg-muted/50 border-t border-border flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {pendingTrips.length} รายการรออนุมัติ
        </p>
        <Link href="/dashboard">
          <Button variant="link" size="sm" className="h-8 text-primary">
            ดูทริปทั้งหมด
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
