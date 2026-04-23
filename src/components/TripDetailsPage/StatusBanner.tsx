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
          gradient:
            'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50',
          textColor: 'text-green-800 dark:text-green-200',
          icon: (
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          ),
          border: 'border-green-200 dark:border-green-800',
        };
      case 'rejected':
        return {
          text: 'ถูกปฏิเสธ',
          gradient:
            'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-800/50',
          textColor: 'text-red-800 dark:text-red-200',
          icon: <X className="h-5 w-5 text-red-600 dark:text-red-400" />,
          border: 'border-red-200 dark:border-red-800',
        };
      default:
        return {
          text: 'รออนุมัติ',
          gradient:
            'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/50 dark:to-yellow-800/50',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          icon: (
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          ),
          border: 'border-yellow-200 dark:border-yellow-800',
        };
    }
  })();

  const bannerVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 10
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        type: "tween" as const,
        ease: "easeOut"
      },
    },
  };

  return (
    <motion.div
      variants={bannerVariants}
      initial="hidden"
      animate="visible"
      className={`
        ${info.gradient}
        ${info.border}
        p-4
        sm:p-5
        rounded-xl
        shadow-md
        flex
        flex-col
        sm:flex-row
        justify-between
        items-start
        sm:items-center
        gap-3
        transition-all
        duration-300
        backdrop-blur-sm
        bg-opacity-80
        dark:bg-opacity-70
        border
      `}
      role="alert"
      aria-label={`สถานะทริป: ${info.text}`}
    >
      {/* ---------- ซ้าย: ไอคอน + ข้อความสถานะ ---------- */}
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="bg-white bg-opacity-50 dark:bg-black dark:bg-opacity-20 p-2 rounded-full"
        >
          {info.icon}
        </motion.div>
        <div>
          <span
            className={`
              ${info.textColor}
              font-semibold
              text-sm
              sm:text-base
              tracking-tight
            `}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {info.text}
          </span>
          {status?.toLowerCase() === 'pending' && (
            <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
              ทริปนี้กำลังรอการอนุมัติ
            </p>
          )}
        </div>
      </div>

      {/* ---------- ขวา: ข้อมูลผู้อนุมัติ ---------- */}
      {approvedBy && approvedAt && (
        <div
          className="
            text-sm
            text-gray-700
            dark:text-gray-300
            flex
            flex-col
            sm:items-end
            gap-1
            bg-white
            bg-opacity-50
            dark:bg-black
            dark:bg-opacity-20
            px-3
            py-2
            rounded-lg
          "
        >
          <span className="font-medium">โดย {approvedBy}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            เมื่อวันที่ {approvedAt}
          </span>
        </div>
      )}
    </motion.div>
  );
}
