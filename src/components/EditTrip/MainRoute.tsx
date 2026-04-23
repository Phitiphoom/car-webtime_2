/* File: src/components/EditTrip/MainRoute.tsx */
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function MainRoute({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (f: 'start' | 'end', v: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Main Route</CardTitle>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Start Point *</Label>
          <Input
            value={start}
            onChange={(e) => onChange('start', e.target.value)}
          />
        </div>
        <div>
          <Label>End Point *</Label>
          <Input
            value={end}
            onChange={(e) => onChange('end', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
