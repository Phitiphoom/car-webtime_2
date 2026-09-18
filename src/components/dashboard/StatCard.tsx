/* -------------------------------------------------------------------------- */
/*  File: src/components/StatCard.tsx                                         */
/*  การ์ดแสดงสถิติ                                                             */
/* -------------------------------------------------------------------------- */
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

type StatCardProps = {
  icon: React.ReactNode; // ไอคอนที่จะแสดง
  title: string; // หัวข้อของสถิติ
  value: React.ReactNode; // ค่าของสถิติ
  intent: 'info' | 'warning' | 'success' | 'accent'; // โทนสี/เจตนา
};

/* พาเล็ตสีสำหรับเจตนาแต่ละแบบ */
const palette: Record<StatCardProps['intent'], { text: string; icon: string }> =
  {
    info: {
      text: 'text-primary',
      icon: 'bg-primary/10 text-primary',
    },
    warning: {
      text: 'text-warning-foreground',
      icon: 'bg-warning/10 text-warning-foreground',
    },
    success: {
      text: 'text-success',
      icon: 'bg-success/10 text-success',
    },
    accent: {
      text: 'text-foreground',
      icon: 'bg-muted text-muted-foreground',
    },
  };

export function StatCard({ icon, title, value, intent }: StatCardProps) {
  const style = palette[intent];

  return (
    <Card
      className="border-border shadow-none"
      role="region" /* ช่วยการเข้าถึง */
      aria-label={`การ์ดสถิติ ${title}`} /* label ภาษาไทย */
    >
      <CardContent className="p-5">
        <div className="flex items-center space-x-4">
          {/* กล่องไอคอน */}
          <div
            className={`p-2.5 rounded-lg ${style.icon}`}
            aria-hidden="true" /* ไม่ให้ screen reader อ่านไอคอน */
          >
            {icon}
          </div>

          {/* ส่วนข้อความ */}
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className={`text-xl font-semibold tracking-tight ${style.text}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
