// src/components/dashboard/StatsSection.tsx
'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from './StatCard';
import { useCarUsageStats } from '@/hooks/queries/useStats';
import { useAuth } from '@/hooks/useAuth';
import {
  CarIcon,
  ClockIcon,
  CheckCircleIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type StatsPeriod = 'day' | 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  day: '24 ชม.',
  week: 'สัปดาห์',
  month: 'เดือน',
  year: 'ปี',
};

export function StatsSection() {
  const { user } = useAuth();
  const [period, setPeriod] = React.useState<StatsPeriod>('month');
  const { data: stats, isLoading, error } = useCarUsageStats(period);

  if (user?.role !== 'ADMIN') return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-md" />
          ))}
        </div>
      );
    }

    if (error || !stats) {
      return (
        <Card className="border-border shadow-none">
          <CardContent className="p-6 text-destructive">
            ไม่สามารถโหลดสถิติได้
          </CardContent>
        </Card>
      );
    }

    const mostUsedCar =
      stats.byCarBrand.length > 0
        ? [...stats.byCarBrand].sort((a, b) => b.count - a.count)[0].value
        : 'ไม่ระบุ';

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CarIcon />}
          title="จำนวนทริปรวม"
          value={stats.totalTrips}
          intent="info"
        />
        <StatCard
          icon={<ClockIcon />}
          title="รออนุมัติ"
          value={stats.byStatus.find((s) => s.value === 'PENDING')?.count ?? 0}
          intent="warning"
        />
        <StatCard
          icon={<CheckCircleIcon />}
          title="อนุมัติแล้ว"
          value={stats.byStatus.find((s) => s.value === 'APPROVED')?.count ?? 0}
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

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-foreground">สถิติการเดินทาง</h2>

        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as StatsPeriod)}
          className="bg-muted rounded-md p-1"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            {(Object.keys(PERIOD_LABELS) as StatsPeriod[]).map((p) => (
              <TabsTrigger
                key={p}
                value={p}
                className="rounded-sm data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {PERIOD_LABELS[p]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {renderContent()}
    </section>
  );
}
