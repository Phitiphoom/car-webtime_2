// src/app/trips/[id]/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { useTripDetails } from '@/hooks/useTripDetails';
import { Header } from '@/components/TripDetailsPage/Header';
import { StatusBanner } from '@/components/TripDetailsPage/StatusBanner';
import { TripInfo } from '@/components/TripDetailsPage/TripInfo';
import { AdditionalStopsList } from '@/components/TripDetailsPage/AdditionalStopsList';
import { DriversList } from '@/components/TripDetailsPage/DriversList';
import { DeleteConfirmDialog } from '@/components/TripDetailsPage/DeleteConfirmDialog';
import { EmailApprovalDialog } from '@/components/TripDetailsPage/EmailApprovalDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Printer,
  Send,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

/* ----------------------------- Loading UI ------------------------------ */
const TripDetailsLoading = () => (
  <div className="space-y-6 p-4">
    <Skeleton className="h-20 rounded-md" />
    <Skeleton className="h-12 rounded-md" />
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-md" />
      ))}
    </div>
  </div>
);

/* ---------------------------- Error UI --------------------------------- */
const TripDetailsError = ({ error }: { error: string }) => (
  <Alert variant="destructive" className="mt-6 mx-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
);

/* -------------------------------------------------------------------------- */
/*  ส่วนเนื้อหาหลักของหน้า (ใช้ข้อมูลจากฮุก)                                */
/* -------------------------------------------------------------------------- */
const TripDetailsContent = () => {
  const data = useTripDetails(); // โหลดข้อมูลทริป
  const [selectedDriverIds] = useState<string[]>([]); // รายชื่อคนขับที่เลือก (ถ้ามี)
  const [isPrinting, setIsPrinting] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  // ฟังก์ชันพิมพ์
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  /* กรณีโหลดข้อมูล */
  if (data.loading) return <TripDetailsLoading />;

  /* กรณีเกิดข้อผิดพลาด หรือไม่พบทริป */
  if (data.error || !data.trip)
    return <TripDetailsError error={data.error || 'ไม่พบข้อมูลทริป'} />;

  /* UI เมื่อโหลดเสร็จ */
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      {/* ส่วนหัวของหน้า */}
      <Header
        trip={data.trip}
        canModify={data.canModify}
        canApprove={data.canApprove}
        onEdit={() => (window.location.href = `/trips/${data.trip?.TID}/edit`)}
        onDelete={() => data.setShowDeleteConfirm(true)}
        onApprove={data.handleApprove}
        onReject={data.handleReject}
        onSend={() => data.setShowEmailDialog(true)}
      />

      <div className="p-4 space-y-6">
        {/* ปุ่มย้อนกลับและปุ่มพิมพ์ */}
        {data.trip.DEPARTMENT === 'MIS' && (
          <motion.div
            variants={itemVariants}
            className="flex justify-between items-center not-print"
          >
            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับสู่แดชบอร์ด
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="not-print flex items-center gap-2"
                onClick={handlePrint}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                พิมพ์รายงาน
              </Button>
              {data.trip.APPROVE_STATUS === 'Pending' && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  onClick={() => data.setShowEmailDialog(true)}
                >
                  <Send className="w-4 h-4" />
                  ส่งคำขออนุมัติ
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* แบนเนอร์สถานะการอนุมัติ */}
        <motion.div variants={itemVariants}>
          <StatusBanner
            status={data.trip.APPROVE_STATUS ?? undefined}
            approvedBy={data.trip.APPROVED_BY ?? undefined}
            approvedAt={
              data.trip.APPROVED_AT
                ? new Date(data.trip.APPROVED_AT).toLocaleDateString('th-TH')
                : undefined
            }
          />
        </motion.div>

        {/* ข้อความสำเร็จของแอ็กชันต่าง ๆ */}
        {data.actionSuccess && (
          <motion.div variants={itemVariants}>
            <Alert className="border border-green-200 bg-green-50 dark:bg-green-900/20">
              <AlertTitle className="font-medium text-green-800 dark:text-green-300">
                ดำเนินการสำเร็จ
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                {data.actionSuccess}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* ส่วนพิมพ์ - ส่วนหัวเอกสาร */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold mb-2">รายงานรายละเอียดการใช้รถ</h1>
          <p className="text-sm text-gray-500">หมายเลขทริป: #{data.trip.TID}</p>
          <p className="text-sm text-gray-500">
            วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')}
          </p>
          <hr className="my-4" />
        </div>

        {/* ข้อมูลทริปหลัก */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ข้อมูลทริป
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TripInfo trip={data.trip} />
            </CardContent>
          </Card>
        </motion.div>

        {/* รายการจุดแวะเพิ่มเติม (ถ้ามี) */}
        <motion.div variants={itemVariants}>
          <AdditionalStopsList
            items={data.trip.items?.map((item) => ({
              START_POINT: item.START_POINT ?? '',
              END_POINT: item.END_POINT ?? '',
            }))}
          />
        </motion.div>

        {/* รายชื่อคนขับ */}
        <motion.div variants={itemVariants}>
          <DriversList
            drivers={
              data.trip.drivers?.map((d) => ({
                DRIVER_ID: String(d.DriverID),
                DRIVER_NAME: d.DRIVER_NAME,
              })) ?? []
            }
            selectedDriverIds={selectedDriverIds}
            disabled={false}
          />
        </motion.div>

        {/* ส่วนล่างสำหรับการพิมพ์ */}
        <div className="hidden print:block mt-8 pt-8 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="font-bold mb-4">ลงชื่อผู้ขอใช้รถ:</p>
              <div className="border-b border-gray-300 mt-8 pt-4"></div>
              <p className="mt-2">({data.trip.RECORD_BY_NAME || data.trip.RECORD_BY || 'ไม่ระบุ'})</p>
              <p className="text-sm text-gray-500">
                วันที่: ........./........./.........
              </p>
            </div>
            <div>
              <p className="font-bold mb-4">ลงชื่อผู้อนุมัติ:</p>
              <div className="border-b border-gray-300 mt-8 pt-4"></div>
              <p className="mt-2">
                (
                {data.trip.APPROVED_BY || '...................................'}
                )
              </p>
              <p className="text-sm text-gray-500">
                วันที่: ........./........./.........
              </p>
            </div>
          </div>
        </div>

        {/* กล่องยืนยันการลบ */}
        <DeleteConfirmDialog
          open={data.showDeleteConfirm}
          onClose={() => data.setShowDeleteConfirm(false)}
          onDelete={data.handleDelete}
          loading={data.actionLoading}
        />

        {/* กล่องส่งอีเมลขออนุมัติ */}
        <EmailApprovalDialog
          open={data.showEmailDialog}
          onClose={() => data.setShowEmailDialog(false)}
          email={data.approverEmail}
          setEmail={data.setApproverEmail}
          onSend={data.handleSendEmail}
          loading={data.sendingEmail}
          sent={data.emailSent}
          error={data.emailError}
        />

        {/* สไตล์สำหรับการพิมพ์ */}
        <style jsx global>{`
          @media print {
            body {
              font-size: 12pt;
              color: #000;
              background: #fff;
            }
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            @page {
              size: A4;
              margin: 2cm;
            }
          }
        `}</style>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*  คอมโพเนนต์หลัก Export (ครอบด้วย AuthGuard และ Suspense)                  */
/* -------------------------------------------------------------------------- */
export default function TripDetailsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<TripDetailsLoading />}>
        <TripDetailsContent />
      </Suspense>
    </AuthGuard>
  );
}
