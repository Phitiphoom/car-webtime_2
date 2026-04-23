// src/components/TripDetailsPage/Header.tsx
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Check,
  X,
  Send,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Trip } from '@/types/trip';

export function Header({
  trip,
  canModify,
  canApprove,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onSend,
  onPrint,
}: {
  trip: Trip;
  canModify: boolean;
  canApprove: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSend: () => void;
  onPrint?: () => void;
}) 

{
  useEffect(() => {
  console.log('🧭 Trip data:', trip);
}, [trip]);
  return (
    <div className="bg-gradient-to-r from-blue-200 via-blue-100 to-indigo-200 text-gray-800 p-5 rounded-b-lg shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors hidden sm:flex"
            aria-label="ย้อนกลับไปแดชบอร์ด"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold mb-1">
              รายละเอียดทริป #{trip.TID}
            </h1>
            <p className="text-sm flex items-center gap-2">
              <span>
                บันทึกโดย: <strong>{trip.RECORD_BY_NAME || trip.RECORD_BY || 'ไม่ระบุ'}</strong>
              </span>
              <span className="bg-white/70 px-2 py-0.5 rounded-full text-xs border border-gray-300 text-gray-700">
                {trip.DEPARTMENT || 'ไม่ระบุแผนก'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          {canModify && trip.APPROVE_STATUS?.toLowerCase() !== 'approve' && (
            <>
              <Button
                type="button"
                onClick={onEdit}
                size="sm"
                className="bg-blue-300 hover:bg-blue-400 text-gray-800 border border-blue-400"
              >
                <Pencil className="mr-2 h-4 w-4" />
                แก้ไข
              </Button>
              <Button
                type="button"
                onClick={onDelete}
                size="sm"
                className="bg-red-300 hover:bg-red-400 text-gray-800 border border-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                ลบ
              </Button>
            </>
          )}

          {canApprove && trip.APPROVE_STATUS === 'Pending' && (
            <>
              <Button
                type="button"
                onClick={onApprove}
                size="sm"
                className="bg-green-300 hover:bg-green-400 text-gray-800 border border-green-400"
              >
                <Check className="mr-2 h-4 w-4" />
                อนุมัติ
              </Button>
              <Button
                type="button"
                onClick={onReject}
                size="sm"
                className="bg-red-300 hover:bg-red-400 text-gray-800 border border-red-400"
              >
                <X className="mr-2 h-4 w-4" />
                ปฏิเสธ
              </Button>
            </>
          )}

          {trip.APPROVE_STATUS === 'Pending' && (
            <Button
              type="button"
              onClick={onSend}
              size="sm"
              className="bg-indigo-300 hover:bg-indigo-400 text-gray-800 border border-indigo-400"
            >
              <Send className="mr-2 h-4 w-4" />
              ส่งคำขอ
            </Button>
          )}

          {onPrint && (
            <Button
              type="button"
              onClick={onPrint}
              size="sm"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
            >
              <Printer className="mr-2 h-4 w-4 text-gray-600" />
              พิมพ์
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
