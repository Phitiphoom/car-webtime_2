// src/components/TripDetailsPage/DriversList.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Driver {
  DRIVER_ID: string;
  DRIVER_NAME: string;
}

interface DriversListProps {
  drivers?: Driver[];
  selectedDriverIds?: string[];
  disabled?: boolean;
  onDriverSelect?: (driverId: string, selected: boolean) => void;
}

export function DriversList({ drivers }: DriversListProps) {
  if (!drivers || drivers.length === 0) return null;

  const listVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          รายชื่อคนขับ
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <motion.ul
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {drivers.map((d, index) => (
            <motion.li
              key={d.DRIVER_ID}
              variants={itemVariants}
              className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {index + 1}
              </div>
              <span className="font-medium text-foreground">
                {d.DRIVER_NAME}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </CardContent>
    </Card>
  );
}
