/* -------------------------------------------------------------------------- */
/*  File: src/components/StatCard.tsx                                         */
/*  การ์ดสถิติ — สไตล์สมุดบัญชี: ตัวเลข mono ในกรอบกระดาษเส้นประ              */
/* -------------------------------------------------------------------------- */
'use client';

import React from 'react';

type StatCardProps = {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  intent: 'info' | 'warning' | 'success' | 'accent';
};

const valueTone: Record<StatCardProps['intent'], string> = {
  info: 'text-foreground',
  warning: 'text-warning',
  success: 'text-success',
  accent: 'text-foreground',
};

export function StatCard({ icon, title, value, intent }: StatCardProps) {
  return (
    <div
      className="rounded-[3px] border border-dashed border-foreground/30 bg-card p-4"
      role="region"
      aria-label={`การ์ดสถิติ ${title}`}
    >
      <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5" aria-hidden="true">
          {icon}
        </span>
        <p className="text-xs">{title}</p>
      </div>
      <p
        className={`font-mono text-2xl font-medium tracking-tight ${valueTone[intent]}`}
      >
        {value}
      </p>
    </div>
  );
}
