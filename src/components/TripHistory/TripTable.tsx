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
          className="border-border shadow-none overflow-hidden"
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
                className="absolute inset-0 bg-background/70 flex items-center justify-center z-10"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    type: 'tween',
                    ease: 'linear',
                  }}
                >
                  <RefreshCw className="h-8 w-8 text-primary" />
                </motion.div>
              </motion.div>
            )}

            {/* ---------- ตาราง ---------- */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    รายละเอียดทริป
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    รถที่ใช้
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    เส้นทาง
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    แผนก
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    สถานะ
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground no-print">
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
                        className="border-b border-border last:border-none hover:bg-muted/50 transition-colors"
                      >
                        {/* วันที่ / วัตถุประสงค์ */}
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-medium text-foreground text-sm">
                            {formatDate(trip.DATE ?? '')}
                          </div>
                          <div className="text-muted-foreground text-xs mt-0.5">
                            {trip.PURPOSE || '-'}
                          </div>
                        </td>

                        {/* รถ / ผู้บันทึก */}
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-medium text-foreground text-sm">
                            {trip.CARBARND || 'ไม่ระบุ'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            โดย{' '}
                            {trip.RECORD_BY_NAME || trip.RECORD_BY || 'ไม่ระบุ'}
                          </div>
                        </td>

                        {/* เส้นทาง */}
                        <td
                          className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-foreground text-sm max-w-[12rem] truncate"
                          title={`${trip.START_POINT} → ${trip.END_POINT}`} /* hover ดูเต็ม ๆ ได้ */
                        >
                          {trip.START_POINT} → {trip.END_POINT}
                        </td>

                        {/* แผนก */}
                        <td className="px-4 sm:px-6 py-4 font-medium text-foreground text-sm">
                          {trip.DEPARTMENT || 'ไม่ระบุ'}
                        </td>

                        {/* สถานะ */}
                        <td className="px-4 sm:px-6 py-4">
                          <Badge
                            variant={badge.variant}
                            className={`font-medium py-1 px-2 rounded-full ${
                              badge.variant === 'secondary'
                                ? 'bg-success/10 text-success'
                                : badge.variant === 'destructive'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-warning/10 text-warning-foreground'
                            }`}
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
                              className="text-muted-foreground hover:text-foreground hover:bg-muted"
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
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
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
                      className="py-12 text-center text-muted-foreground text-base"
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
