// src/components/TripDetailsPage/StatusBanner.tsx
'use client';

import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

export function StatusBanner({
  status,
  approvedBy,
  approvedAt,
}: {
  status?: string;
  approvedBy?: string;
  approvedAt?: string;
}) {
  const info = (() => {
    switch (status?.toLowerCase()) {
      case 'approve':
        return {
          text: 'อนุมัติแล้ว',
          bg: 'bg-success/10',
          textColor: 'text-success',
          icon: <Check className="h-5 w-5 text-success" />,
          border: 'border-success/20',
        };
      case 'rejected':
        return {
          text: 'ถูกปฏิเสธ',
          bg: 'bg-destructive/10',
          textColor: 'text-destructive',
          icon: <X className="h-5 w-5 text-destructive" />,
          border: 'border-destructive/20',
        };
      default:
        return {
          text: 'รออนุมัติ',
          bg: 'bg-warning/10',
          textColor: 'text-warning-foreground',
          icon: <AlertTriangle className="h-5 w-5 text-warning" />,
          border: 'border-warning/20',
        };
    }
  })();

  const bannerVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        type: 'tween' as const,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={bannerVariants}
      initial="hidden"
      animate="visible"
      className={`${info.bg} ${info.border} border p-4 sm:p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}
      role="alert"
      aria-label={`สถานะทริป: ${info.text}`}
    >
      {/* ---------- ซ้าย: ไอคอน + ข้อความสถานะ ---------- */}
      <div className="flex items-center gap-2">
        <div className="bg-background/60 p-2 rounded-full">{info.icon}</div>
        <div>
          <span
            className={`${info.textColor} font-semibold text-sm sm:text-base`}
          >
            {info.text}
          </span>
          {status?.toLowerCase() === 'pending' && (
            <p className="text-xs text-warning-foreground/80 mt-1">
              ทริปนี้กำลังรอการอนุมัติ
            </p>
          )}
        </div>
      </div>

      {/* ---------- ขวา: ข้อมูลผู้อนุมัติ ---------- */}
      {approvedBy && approvedAt && (
        <div className="text-sm text-foreground flex flex-col sm:items-end gap-1 bg-background/60 px-3 py-2 rounded-lg">
          <span className="font-medium">โดย {approvedBy}</span>
          <span className="text-xs text-muted-foreground">
            เมื่อวันที่ {approvedAt}
          </span>
        </div>
      )}
    </motion.div>
  );
}
