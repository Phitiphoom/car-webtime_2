/* -------------------------------------------------------------------------- */
/*  File: src/components/StatCard.tsx                                         */
/*  การ์ดแสดงสถิติ                                                             */
/* -------------------------------------------------------------------------- */
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

type StatCardProps = {
  icon: React.ReactNode; // ไอคอนที่จะแสดง
  title: string; // หัวข้อของสถิติ
  value: React.ReactNode; // ค่าของสถิติ
  intent: 'info' | 'warning' | 'success' | 'accent'; // โทนสี/เจตนา
};

/* พาเล็ตสีสำหรับเจตนาแต่ละแบบ */
const palette: Record<
  StatCardProps['intent'],
  {
    gradient: string;
    text: string;
    icon: string;
    shadow: string;
  }
> = {
  info: {
    gradient:
      'bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15',
    text: 'text-primary',
    icon: 'bg-primary/10 backdrop-blur-sm text-primary',
    shadow: 'hover:shadow-primary/20',
  },
  warning: {
    gradient:
      'bg-gradient-to-br from-warning/5 to-warning/10 hover:from-warning/10 hover:to-warning/15',
    text: 'text-warning-foreground',
    icon: 'bg-warning/10 backdrop-blur-sm text-warning-foreground',
    shadow: 'hover:shadow-warning/20',
  },
  success: {
    gradient:
      'bg-gradient-to-br from-success/5 to-success/10 hover:from-success/10 hover:to-success/15',
    text: 'text-success',
    icon: 'bg-success/10 backdrop-blur-sm text-success',
    shadow: 'hover:shadow-success/20',
  },
  accent: {
    gradient:
      'bg-gradient-to-br from-accent/5 to-accent/10 hover:from-accent/10 hover:to-accent/15',
    text: 'text-accent-foreground',
    icon: 'bg-accent/10 backdrop-blur-sm text-accent-foreground',
    shadow: 'hover:shadow-accent/20',
  },
};

export function StatCard({ icon, title, value, intent }: StatCardProps) {
  const style = palette[intent];

  return (
    /* เอฟเฟ็กต์ยกขึ้นเล็กน้อยเมื่อ hover และกด */
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className={`
          ${style.gradient}
          border-none
          rounded-2xl
          shadow-lg
          ${style.shadow}
          transition-all
          duration-300
          ease-in-out
          backdrop-blur-sm
          bg-opacity-80
          dark:bg-opacity-70
        `}
        role="region" /* ช่วยการเข้าถึง */
        aria-label={`การ์ดสถิติ ${title}`} /* label ภาษาไทย */
      >
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center space-x-4">
            {/* กล่องไอคอน */}
            <div
              className={`
                p-3
                rounded-xl
                ${style.icon}
                shadow-sm
                transform
                transition-transform
                hover:scale-110
              `}
              aria-hidden="true" /* ไม่ให้ screen reader อ่านไอคอน */
            >
              {icon}
            </div>

            {/* ส่วนข้อความ */}
            <div className="flex-1">
              <p
                className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 tracking-wide"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {title}
              </p>
              <p
                className={`
                  text-xl sm:text-2xl
                  font-semibold
                  ${style.text}
                  tracking-tight
                `}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {value}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
