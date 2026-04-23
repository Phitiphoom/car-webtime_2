/* File: src/components/EditTrip/AdditionalStops.tsx */
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AdditionalStops({
  stops,
  onAdd,
  onRemove,
  onChange,
}: {
  stops: Array<{ START_POINT: string; END_POINT: string }>;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, f: 'START_POINT' | 'END_POINT', v: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Stops</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stops.map((s, i) => (
          <div key={i} className="grid sm:grid-cols-2 gap-4 items-end">
            <div>
              <Label>Start Point</Label>
              <Input
                value={s.START_POINT}
                onChange={(e) => onChange(i, 'START_POINT', e.target.value)}
              />
            </div>
            <div>
              <Label>End Point</Label>
              <Input
                value={s.END_POINT}
                onChange={(e) => onChange(i, 'END_POINT', e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => onRemove(i)}>
              ×
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={onAdd}>
          + Add Stop
        </Button>
      </CardContent>
    </Card>
  );
}
