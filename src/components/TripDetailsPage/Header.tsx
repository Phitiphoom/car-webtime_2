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
}) {
  useEffect(() => {
    console.log('🧭 Trip data:', trip);
  }, [trip]);
  return (
    <div className="bg-card border-b border-border p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-muted transition-colors hidden sm:flex"
            aria-label="ย้อนกลับไปแดชบอร์ด"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold mb-1 text-foreground">
              รายละเอียดทริป #{trip.TID}
            </h1>
            <p className="text-sm flex items-center gap-2 text-muted-foreground">
              <span>
                บันทึกโดย:{' '}
                <strong className="text-foreground">
                  {trip.RECORD_BY_NAME || trip.RECORD_BY || 'ไม่ระบุ'}
                </strong>
              </span>
              <span className="bg-muted px-2 py-0.5 rounded-full text-xs border border-border text-muted-foreground">
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
                variant="outline"
              >
                <Pencil className="mr-2 h-4 w-4" />
                แก้ไข
              </Button>
              <Button
                type="button"
                onClick={onDelete}
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
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
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                <Check className="mr-2 h-4 w-4" />
                อนุมัติ
              </Button>
              <Button
                type="button"
                onClick={onReject}
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <X className="mr-2 h-4 w-4" />
                ปฏิเสธ
              </Button>
            </>
          )}

          {trip.APPROVE_STATUS === 'Pending' && (
            <Button type="button" onClick={onSend} size="sm">
              <Send className="mr-2 h-4 w-4" />
              ส่งคำขอ
            </Button>
          )}

          {onPrint && (
            <Button type="button" onClick={onPrint} size="sm" variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              พิมพ์
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
