// src/components/LogUsage/AdditionalStops.tsx
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';

interface Stop {
  start: string;
  end: string;
}

interface Props {
  stops: Stop[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, field: 'start' | 'end', value: string) => void;
}

export function AdditionalStops({ stops, onAdd, onRemove, onChange }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">จุดแวะเพิ่มเติม</CardTitle>
        <Button
          type="button"
          onClick={onAdd}
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary hover:bg-primary/10"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          เพิ่มจุดแวะ
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {stops.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground bg-muted rounded-md">
            ยังไม่มีจุดแวะเพิ่มเติม คลิกที่ &quot;เพิ่มจุดแวะ&quot;
            เพื่อเพิ่มจุดแวะใหม่
          </div>
        ) : (
          stops.map((s, i) => (
            <div
              key={i}
              className="grid sm:grid-cols-2 gap-4 items-end border border-border p-3 rounded-md bg-muted/40 relative"
            >
              <div>
                <Label htmlFor={`start-${i}`}>จุดเริ่มต้น</Label>
                <Input
                  id={`start-${i}`}
                  value={s.start}
                  onChange={(e) => onChange(i, 'start', e.target.value)}
                  placeholder="กรอกจุดเริ่มต้น"
                />
              </div>
              <div className="relative">
                <Label htmlFor={`end-${i}`}>จุดสุดท้าย</Label>
                <Input
                  id={`end-${i}`}
                  value={s.end}
                  onChange={(e) => onChange(i, 'end', e.target.value)}
                  placeholder="กรอกจุดสุดท้าย"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(i)}
                  className="absolute -top-1 -right-1 h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
