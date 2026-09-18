// src/components/TripDetailsPage/AdditionalStopsList.tsx
'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export type RawStop = {
  START_POINT: string;
  END_POINT: string;
};

export interface AdditionalStopsListProps {
  items?: RawStop[];
  className?: string;
  listClassName?: string;
  itemClassName?: string;
}

const listVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export function AdditionalStopsList({
  items,
  className = '',
  listClassName = '',
  itemClassName = '',
}: AdditionalStopsListProps) {
  if (!items || items.length === 0) return null;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          จุดแวะเพิ่มเติม
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <motion.ul
          role="list"
          className={`space-y-4 ${listClassName}`}
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {items.map((stop, idx) => {
            const startPoint = stop.START_POINT;
            const endPoint = stop.END_POINT;
            const key = `${startPoint}-${endPoint}-${idx}`;

            return (
              <motion.li
                key={key}
                role="listitem"
                variants={itemVariants}
                className={`flex items-center gap-2 bg-muted/40 p-3 rounded-lg border border-border ${itemClassName}`}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {idx + 1}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">
                    {startPoint}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-foreground">
                    {endPoint}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </CardContent>
    </Card>
  );
}
