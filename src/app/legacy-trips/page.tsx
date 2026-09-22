// src/app/legacy-trips/page.tsx
//
// "Log เก่า": the trips recorded in the OLD system, shown read-only. The data
// was free text (departments, cars, people typed by hand), so it is NOT
// reliable and is not part of the new records — kept only for reference.
'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { PaginationControls } from '@/components/PaginationControls';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLegacyTrip, useLegacyTrips } from '@/hooks/queries/useLegacyTrips';
import { TriangleAlert } from 'lucide-react';

const oldNumber = (id: number) => `OLD-${String(id).padStart(4, '0')}`;

function formatDate(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString('th-TH', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      })
    : '—';
}

function formatTime(iso: string | null) {
  // The old TIME column is a wall-clock time stored as 1970-01-01Thh:mm:ssZ.
  return iso ? iso.slice(11, 16) : '—';
}

const TH =
  'py-2 px-4 text-xs font-medium text-muted-foreground border-b border-dashed border-foreground/25';

function LegacyBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-[3px] border border-warning/50 border-l-4 border-l-warning bg-warning/10 px-4 py-3 text-sm"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div>
        <p className="font-medium">
          ข้อมูลเก่าจากระบบก่อนเปลี่ยน — อาจไม่ถูกต้อง
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          แผนก รถ และชื่อผู้บันทึกในรายการเหล่านี้เป็นข้อความที่พิมพ์เอง
          ไม่ตรงกับข้อมูลหลักของระบบใหม่ ใช้เพื่ออ้างอิงเท่านั้น
          แก้ไขหรืออนุมัติไม่ได้
        </p>
      </div>
    </div>
  );
}

function LegacyDetail({
  id,
  onClose,
}: {
  id: number | null;
  onClose: () => void;
}) {
  const { data: trip, isLoading } = useLegacyTrip(id);

  return (
    <Dialog open={id !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {id !== null ? oldNumber(id) : ''} · ข้อมูลเก่า
          </DialogTitle>
          <DialogDescription>
            อาจไม่ถูกต้อง — ใช้เพื่ออ้างอิงเท่านั้น
          </DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className="h-40 w-full" />}
        {trip && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ['เส้นทาง', `${trip.startPoint} → ${trip.endPoint}`, true],
              ['วันที่', formatDate(trip.date)],
              ['เวลา', formatTime(trip.time)],
              ['ยี่ห้อรถ', trip.carBrand],
              ['แผนก (ตามที่พิมพ์)', trip.department],
              ['ผู้บันทึก', trip.recordBy],
              ['สถานะ (ตามที่บันทึก)', trip.status],
              ['ผู้อนุมัติ', trip.approvedBy],
              ['อีเมลผู้อนุมัติ', trip.approveEmail],
              ['วัตถุประสงค์', trip.purposeText || trip.purpose, true],
              ['หมายเหตุ', trip.remark, true],
            ].map(([label, value, wide]) => (
              <div
                key={label as string}
                className={`border-b border-dashed border-foreground/25 pb-2 ${wide ? 'sm:col-span-2' : ''}`}
              >
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 font-medium">
                  {(value as string | null) || '—'}
                </dd>
              </div>
            ))}
            {trip.items.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">จุดแวะ</dt>
                <dd className="mt-0.5 space-y-0.5">
                  {trip.items.map((i) => (
                    <p key={i.id}>
                      {i.startPoint || '—'} → {i.endPoint || '—'}
                    </p>
                  ))}
                </dd>
              </div>
            )}
            {trip.drivers.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">คนขับ</dt>
                <dd className="mt-0.5 font-medium">
                  {trip.drivers.map((d) => d.name).join(', ')}
                </dd>
              </div>
            )}
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function LegacyTripsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);

  // Wait for a pause in typing before querying.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, error } = useLegacyTrips({ page, limit, search });

  return (
    <AuthGuard>
      <AppShell title="Log เก่า">
        <LegacyBanner />

        <Input
          placeholder="ค้นหา เส้นทาง แผนก ยี่ห้อรถ ผู้บันทึก..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full max-w-md"
        />

        <Card className="border-border shadow-none">
          <CardContent className="p-0">
            {isLoading && (
              <div className="space-y-3 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {error && (
              <div className="p-8 text-center text-sm text-destructive">
                ไม่สามารถโหลดข้อมูลเก่าได้
              </div>
            )}
            {data && data.data.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                ไม่พบรายการ
              </div>
            )}
            {data && data.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className={TH}>เลขเดิม</th>
                      <th className={TH}>เส้นทาง</th>
                      <th className={TH}>ยี่ห้อรถ</th>
                      <th className={TH}>วันที่</th>
                      <th className={TH}>ผู้บันทึก</th>
                      <th className={TH}>แผนก (ตามที่พิมพ์)</th>
                      <th className={TH}>สถานะเดิม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-foreground/20">
                    {data.data.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {oldNumber(t.id)}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => setOpenId(t.id)}
                            className="text-left font-medium hover:underline"
                          >
                            {t.startPoint} → {t.endPoint}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {t.carBrand || '—'}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {t.recordBy || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {t.department || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {t.status || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                limitOptions={[25, 50, 100]}
              />
            </CardContent>
          </Card>
        )}

        <LegacyDetail id={openId} onClose={() => setOpenId(null)} />
      </AppShell>
    </AuthGuard>
  );
}
