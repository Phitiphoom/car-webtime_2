/* File: src/components/LogUsage/MainRoute.tsx */
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  start: string;
  end: string;
  onChange: (field: 'start' | 'end', value: string) => void;
}

export function MainRoute({ start, end, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>เส้นทางหลัก</CardTitle>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>จุดเริ่มต้น *</Label>
          <Input
            value={start}
            onChange={(e) => onChange('start', e.target.value)}
          />
        </div>
        <div>
          <Label>จุดสุดท้าย *</Label>
          <Input
            value={end}
            onChange={(e) => onChange('end', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
