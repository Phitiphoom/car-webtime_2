/* File: src/components/EditTrip/DriversSection.tsx */
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DriversSection({
  drivers,
  onAdd,
  onRemove,
  onChange,
}: {
  drivers: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, v: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drivers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {drivers.map((d, i) => (
          <div key={i} className="flex gap-3 items-center">
            <Input
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={`Driver ${i + 1}`}
            />
            {drivers.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => onRemove(i)}>
                ×
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" onClick={onAdd}>
          + Add Driver
        </Button>
      </CardContent>
    </Card>
  );
}
