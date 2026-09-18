/* -------------------------------------------------------------------------- */
/*  File: src/components/StatsSection.tsx                                     */
/*  ส่วนแสดงสถิติ (เฉพาะแอดมิน)                                             */
/* -------------------------------------------------------------------------- */
'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from './StatCard';
import { useStats } from '@/hooks/useStats';
import { useAuth } from '@/hooks/useAuth';
import {
  CarIcon,
  ClockIcon,
  CheckCircleIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/* ประเภทข้อมูลสถิติ */
type StatsData = {
  totalTrips: number;
  byStatus: { status: string; count: number }[];
  byCarBrand: { carBrand: string; count: number }[];
};

/* ช่วงเวลา */
type StatsPeriod = 'day' | 'week' | 'month' | 'year';

export function StatsSection() {
  const { user } = useAuth(); // ผู้ใช้ปัจจุบัน
  const [period, setPeriod] = React.useState<StatsPeriod>('month');
  const { stats, loading, error } = useStats('carUsage', period);

  /* ------------------------------------------------------------------ */
  /*  ฟังก์ชันแสดงเนื้อหา (โหลด / error / สถิติ)                      */
  /* ------------------------------------------------------------------ */
  const renderContent = () => {
    /* ---------- สถานะโหลด ---------- */
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-md" />
          ))}
        </div>
      );
    }

    /* ---------- สถานะ error ---------- */
    if (error) {
      return (
        <Card className="border-border shadow-none">
          <CardContent className="p-6 text-destructive">
            ไม่สามารถโหลดสถิติได้: {error}
          </CardContent>
        </Card>
      );
    }

    /* ---------- ไม่ใช่แอดมิน ---------- */
    if (user?.role !== 'admin') {
      return null;
    }

    /* ---------- แสดงสถิติ ---------- */
    const defaultStats: StatsData = {
      totalTrips: 0,
      byStatus: [
        { status: 'Pending', count: 0 },
        { status: 'Approve', count: 0 },
        { status: 'Rejected', count: 0 },
      ],
      byCarBrand: [],
    };

    const displayStats = stats || defaultStats;
    const mostUsedCar =
      displayStats.byCarBrand?.length > 0
        ? displayStats.byCarBrand.sort((a, b) => b.count - a.count)[0].carBrand
        : 'ไม่ระบุ';

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CarIcon />}
          title="จำนวนทริปรวม"
          value={displayStats.totalTrips}
          intent="info"
        />
        <StatCard
          icon={<ClockIcon />}
          title="รออนุมัติ"
          value={
            displayStats.byStatus.find((s) => s.status === 'Pending')?.count ??
            0
          }
          intent="warning"
        />
        <StatCard
          icon={<CheckCircleIcon />}
          title="อนุมัติแล้ว"
          value={
            displayStats.byStatus.find((s) => s.status === 'Approve')?.count ??
            0
          }
          intent="success"
        />
        <StatCard
          icon={<TrendingUpIcon />}
          title="ยี่ห้อรถที่ใช้บ่อย"
          value={mostUsedCar}
          intent="accent"
        />
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  ส่วนแสดงตัวเลือกช่วงเวลา (เฉพาะแอดมิน) + เนื้อหา                */
  /* ------------------------------------------------------------------ */
  return (
    <section className="space-y-6">
      {user?.role === 'admin' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            สถิติการเดินทาง
          </h2>

          {/* ตัวเลือกช่วงเวลา */}
          <Tabs
            value={period}
            onValueChange={(v: string) => setPeriod(v as StatsPeriod)}
            className="bg-muted rounded-md p-1"
          >
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              {(['day', 'week', 'month', 'year'] as const).map((p) => (
                <TabsTrigger
                  key={p}
                  value={p}
                  className="rounded-sm data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  {p === 'day'
                    ? '24 ชม.'
                    : p.charAt(0).toUpperCase() + p.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* เรนเดอร์เนื้อหา */}
      {renderContent()}
    </section>
  );
}
