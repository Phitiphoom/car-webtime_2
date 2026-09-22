// src/app/trips/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationControls } from '@/components/PaginationControls';
import { TripTable } from '@/components/trips/TripTable';
import { useTrips } from '@/hooks/queries/useTrips';
import { useDepartments, useCarBrands } from '@/hooks/queries/useReferenceData';
import { Plus } from 'lucide-react';
import { TRIP_STATUSES, TripStatus } from '@/server/shared/enums';

const STATUS_LABELS: Record<TripStatus, string> = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  CANCELLED: 'ยกเลิก',
};

const ALL = '__all__';

export default function TripsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string>(ALL);
  const [department, setDepartment] = useState<string>(ALL);
  const [carBrand, setCarBrand] = useState<string>(ALL);

  const { data, isLoading, error } = useTrips({
    page,
    limit,
    status: status === ALL ? undefined : (status as TripStatus),
    department: department === ALL ? undefined : department,
    carBrand: carBrand === ALL ? undefined : carBrand,
  });
  const { data: departments } = useDepartments();
  const { data: carBrands } = useCarBrands();

  return (
    <AuthGuard>
      <AppShell title="Log ปัจจุบัน">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/log-usage">
              <Plus className="mr-2 h-4 w-4" />
              บันทึกการใช้รถ
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกสถานะ</SelectItem>
              {TRIP_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={department}
            onValueChange={(v) => {
              setDepartment(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="แผนก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกแผนก</SelectItem>
              {(departments ?? []).map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={carBrand}
            onValueChange={(v) => {
              setCarBrand(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="ยี่ห้อรถ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกยี่ห้อ</SelectItem>
              {(carBrands ?? []).map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border shadow-none">
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {error && (
              <div className="p-8 text-center text-sm text-destructive">
                ไม่สามารถโหลดข้อมูลทริปได้
              </div>
            )}
            {!isLoading && !error && <TripTable trips={data?.data ?? []} />}
          </CardContent>
        </Card>

        {data && data.pagination.totalCount > 0 && (
          <Card className="border-border shadow-none">
            <CardContent className="p-2">
              <PaginationControls
                pagination={data.pagination}
                onPageChange={setPage}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
                showLimitSelector
                limitOptions={[10, 25, 50, 100]}
              />
            </CardContent>
          </Card>
        )}
      </AppShell>
    </AuthGuard>
  );
}
