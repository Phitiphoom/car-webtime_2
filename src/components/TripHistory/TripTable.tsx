/* -------------------------------------------------------------------------- */
/*  File: src/components/TripTable.tsx                                        */
/*  ตารางรายการทริป                                                          */
/* -------------------------------------------------------------------------- */
'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { Trip } from '@/types/trip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye, Pencil } from 'lucide-react';
/* ---------- ประเภทพร็อพ ---------- */
interface TripTableProps {
  trips: Trip[];
  isRefreshing: boolean;
}

/* ---------- ฟังก์ชันช่วย ---------- */
const formatDate = (d: string | Date) =>
  d
    ? new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(d))
    : '—';

const statusPalette: Record<
  string,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: string }
> = {
  approve: { variant: 'secondary', icon: '✓' },
  pending: { variant: 'outline', icon: '⏳' },
  rejected: { variant: 'destructive', icon: '✗' },
};

const getStatusBadge = (s?: string | null) =>
  statusPalette[s?.toLowerCase() || 'pending'];

/* -------------------------------------------------------------------------- */
/*  คอมโพเนนต์ตาราง                                                          */
/* -------------------------------------------------------------------------- */
const TripTable = forwardRef<HTMLDivElement, TripTableProps>(
  ({ trips, isRefreshing }, ref) => {
    return (
      <div ref={ref} className="relative">
        <Card
          className="
            bg-white
            dark:bg-gray-900
            border-none
            shadow-lg
            rounded-2xl
            overflow-hidden
            transition-all
            duration-300
            hover:shadow-xl
          "
          role="region"
          aria-label="ตารางทริป"
        >
          <CardContent className="p-0 overflow-x-auto">
            {/* ---------- Overlay โหลดข้อมูล ---------- */}
            {isRefreshing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="
                  absolute
                  inset-0
                  bg-white/70
                  dark:bg-gray-900/70
                  backdrop-blur-sm
                  flex
                  items-center
                  justify-center
                  z-10
                "
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, type: "tween", ease: "linear" }}
                >
                  <RefreshCw className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
              </motion.div>
            )}

            {/* ---------- ตาราง ---------- */}
            <table className="w-full text-sm">
              <thead
                className="
                  bg-gradient-to-r
                  from-indigo-50
                  to-blue-50
                  dark:from-indigo-900
                  dark:to-blue-900
                "
              >
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-800 dark:text-gray-200 rounded-tl-2xl">
                    รายละเอียดทริป
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-800 dark:text-gray-200">
                    รถที่ใช้
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-800 dark:text-gray-200">
                    เส้นทาง
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-800 dark:text-gray-200">
                    แผนก
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-800 dark:text-gray-200">
                    สถานะ
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-200 rounded-tr-2xl no-print">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {trips.length > 0 ? (
                  trips.map((trip) => {
                    const badge = getStatusBadge(trip.APPROVE_STATUS);
                    return (
                      <motion.tr
                        key={trip.TID}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="
                          border-b
                          border-gray-100
                          dark:border-gray-800
                          last:border-none
                          hover:bg-indigo-50/50
                          dark:hover:bg-gray-800/50
                          transition-all
                          duration-200
                        "
                      >
                        {/* วันที่ / วัตถุประสงค์ */}
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            {formatDate(trip.DATE ?? '')}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                            {trip.PURPOSE || '-'}
                          </div>
                        </td>

                        {/* รถ / ผู้บันทึก */}
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            {trip.CARBARND || 'ไม่ระบุ'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            โดย {trip.RECORD_BY_NAME || trip.RECORD_BY || 'ไม่ระบุ'}
                          </div>
                        </td>

                        {/* เส้นทาง */}
                        <td
                          className="
                                px-4 sm:px-6 py-4 whitespace-nowrap
                                font-medium text-gray-900 dark:text-gray-100
                                max-w-[12rem]   /* กำหนดกรอบความกว้าง */
                                truncate         /* ตัดคำเกินด้วย … */
                              "
                          title={`${trip.START_POINT} → ${trip.END_POINT}`} /* hover ดูเต็ม ๆ ได้ */
                        >
                          {trip.START_POINT} → {trip.END_POINT}
                        </td>

                        {/* แผนก */}
                        <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                          {trip.DEPARTMENT || 'ไม่ระบุ'}
                        </td>

                        {/* สถานะ */}
                        <td className="px-4 sm:px-6 py-4">
                          <Badge
                            variant={badge.variant}
                            className={`
                              font-medium
                              py-1
                              px-2
                              rounded-full
                              shadow-sm
                              ${
                                badge.variant === 'secondary'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                  : badge.variant === 'destructive'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                              }
                            `}
                          >
                            <span className="mr-1">{badge.icon}</span>
                            {trip.APPROVE_STATUS || 'Pending'}
                          </Badge>
                        </td>

                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap flex justify-end gap-1 no-print">
                          {/* ปุ่มดูรายละเอียด */}
                          <Link href={`/trips/${trip.TID}`} passHref>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="ดูรายละเอียด"
                              className="
                                text-indigo-600 dark:text-indigo-400
                                hover:bg-indigo-100/60 dark:hover:bg-gray-800
                              "
                              title="ดูรายละเอียด"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {/* ปุ่มแก้ไข (แสดงเฉพาะถ้ายังไม่ Approved) */}
                          {trip.APPROVE_STATUS?.toLowerCase() !== 'approve' && (
                            <Link href={`/trips/${trip.TID}/edit`} passHref>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="แก้ไข"
                                className="
                                  text-indigo-600 dark:text-indigo-400
                                  hover:bg-indigo-100/60 dark:hover:bg-gray-800
                                "
                                title="แก้ไข"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-gray-500 dark:text-gray-400 text-base"
                    >
                      ไม่พบข้อมูลทริป
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ---------- ส่วนเฉพาะตอนสั่งพิมพ์ ---------- */}
        <div className="print-only" style={{ display: 'none' }}>
          <h1
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}
          >
            รายงานการใช้รถ
          </h1>
          <p style={{ fontSize: '0.9rem' }}>
            วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')}
          </p>
          <hr style={{ margin: '10px 0 20px 0', borderColor: '#e5e7eb' }} />
        </div>
      </div>
    );
  }
);

TripTable.displayName = 'TripTable';

export default TripTable;
