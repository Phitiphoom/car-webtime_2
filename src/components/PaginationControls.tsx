/* -------------------------------------------------------------------------- */
/*  File: src/components/PaginationControls.tsx                               */
/*  คอนโทรลแบ่งหน้า + เลือกจำนวนรายการต่อหน้า                               */
/* -------------------------------------------------------------------------- */
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationMeta } from '@/types/trip';

/* ---------- ประเภทพร็อพ ---------- */
interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
  limitOptions?: number[];
  showPageInfo?: boolean;
  maxPageButtons?: number;
  className?: string;
}

export function PaginationControls({
  pagination,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
  limitOptions = [10, 25, 50, 100],
  showPageInfo = true,
  maxPageButtons = 5,
  className = '',
}: PaginationControlsProps) {
  const { page, limit, totalCount, totalPages, hasNext, hasPrev } = pagination;
  const [maxButtons, setMaxButtons] = useState(maxPageButtons);

  /* ปรับจำนวนปุ่มตามขนาดจอ */
  useEffect(() => {
    const updateMax = () => {
      const base = window.innerWidth < 640 ? 3 : maxPageButtons;
      setMaxButtons(base);
    };
    updateMax();
    window.addEventListener('resize', updateMax);
    return () => window.removeEventListener('resize', updateMax);
  }, [maxPageButtons]);

  /* สร้างรายการปุ่มหน้า */
  const pageButtons = useMemo(() => {
    if (totalPages <= 1) return null;

    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    const items: React.ReactNode[] = [];

    /* ปุ่มหน้าแรก + ... */
    if (start > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (start > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    /* ปุ่มที่อยู่ในช่วง */
    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === page}
            onClick={() => i !== page && onPageChange(i)}
            aria-label={`ไปหน้าที่ ${i}`}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    /* ... + ปุ่มหน้าสุดท้าย */
    if (end < totalPages) {
      if (end < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => onPageChange(totalPages)}
            aria-label="ไปหน้าสุดท้าย"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  }, [page, totalPages, maxButtons, onPageChange]);

  if (totalCount === 0) return null;

  return (
    <div
      className={`
        flex flex-col sm:flex-row items-center justify-between
        gap-3 p-2 ${className}
      `}
    >
      {/* ---------- ข้อความสรุป ---------- */}
      {showPageInfo && (
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          แสดง {Math.min((page - 1) * limit + 1, totalCount)} -{' '}
          {Math.min(page * limit, totalCount)} จาก {totalCount} รายการ
        </div>
      )}

      {/* ---------- ตัวเลือกจำนวน & ปุ่มแบ่งหน้า ---------- */}
      <div className="flex items-center gap-4">
        {/* เลือกจำนวนต่อหน้า */}
        {showLimitSelector && onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">แสดง:</span>
            <Select
              value={String(limit)}
              onValueChange={(v) => onLimitChange(+v)}
            >
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {limitOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ปุ่มแบ่งหน้า */}
        <Pagination>
          <PaginationContent className="flex-wrap gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => hasPrev && onPageChange(page - 1)}
                className={!hasPrev ? 'opacity-50 pointer-events-none' : ''}
                aria-label="หน้าก่อนหน้า"
              />
            </PaginationItem>

            {pageButtons}

            <PaginationItem>
              <PaginationNext
                onClick={() => hasNext && onPageChange(page + 1)}
                className={!hasNext ? 'opacity-50 pointer-events-none' : ''}
                aria-label="หน้าถัดไป"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
