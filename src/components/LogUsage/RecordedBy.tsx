/* File: src/components/LogUsage/RecordedBy.tsx */
'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RecordedBy({ user }: { user: any }) {
  return (
    <Card>
      <CardContent className="py-4">
        <Label>บันทึกโดย</Label>
        <Input value={user?.name || ''} readOnly />
      </CardContent>
    </Card>
  );
}
