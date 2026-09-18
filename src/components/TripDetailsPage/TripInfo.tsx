// src/components/TripDetailsPage/TripInfo.tsx
'use client';

import React from 'react';
import {
  Calendar,
  Car,
  MapPin,
  Briefcase,
  User,
  Mail,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Trip } from '@/types/trip';
import { motion } from 'framer-motion';

export function TripInfo({ trip }: { trip: Trip }) {
  // ฟังก์ชันช่วยแปลงวันที่ / เวลา
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fmtDate = (d: any) =>
    new Date(d).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fmtTime = (t: any) =>
    t
      ? new Date(t).toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  const rowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // ข้อมูลที่จะแสดงเป็นแถว
  const rows = [
    {
      label: 'วันที่ / เวลา',
      icon: <Calendar className="text-primary" />,
      value: `${fmtDate(trip.DATE)} ${fmtTime(trip.TIME)}`,
    },
    {
      label: 'รถที่ใช้',
      icon: <Car className="text-primary" />,
      value: trip.CARBARND,
    },
    {
      label: 'เส้นทาง',
      icon: <MapPin className="text-primary" />,
      value: (
        <div className="flex items-center gap-2">
          <span className="font-medium">{trip.START_POINT}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{trip.END_POINT}</span>
        </div>
      ),
    },
    {
      label: 'วัตถุประสงค์',
      icon: <Briefcase className="text-primary" />,
      value: trip.PURPOSE || '—',
    },
    {
      label: 'แผนก',
      icon: <User className="text-primary" />,
      value: trip.DEPARTMENT || '—',
    },
    {
      label: 'ผู้อนุมัติ',
      icon: <Mail className="text-primary" />,
      value: trip.Approve_Email || '—',
    },
    {
      label: 'หมายเหตุ',
      icon: <FileText className="text-primary" />,
      value: trip.REMARK || '—',
    },
    {
      label: 'สร้างเมื่อ',
      icon: <Clock className="text-primary" />,
      value: trip.CREATED_AT
        ? fmtDate(trip.CREATED_AT) + ' ' + fmtTime(trip.CREATED_AT)
        : '—',
    },
  ];

  // เรนเดอร์
  return (
    <motion.dl
      className="divide-y"
      variants={rowVariants}
      initial="hidden"
      animate="visible"
    >
      {rows.map((r) => (
        <motion.div
          key={r.label}
          className="p-4 flex gap-2 items-start hover:bg-muted/50 transition-colors"
          variants={itemVariants}
        >
          {/* ไอคอน */}
          <div className="mt-1 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
            {r.icon}
          </div>

          {/* ป้ายกำกับ */}
          <dt className="font-medium w-40 text-foreground pt-1.5">{r.label}</dt>

          {/* ค่า */}
          <dd className="text-muted-foreground flex-1 pt-1.5">{r.value}</dd>
        </motion.div>
      ))}
    </motion.dl>
  );
}
