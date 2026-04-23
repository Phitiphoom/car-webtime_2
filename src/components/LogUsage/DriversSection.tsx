/* File: src/components/LogUsage/DriversSection.tsx */
'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Props {
  drivers: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, value: string) => void;
}

export function DriversSection({ drivers, onAdd, onRemove, onChange }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">คนขับ</CardTitle>
        <Button
          onClick={onAdd}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          เพิ่มคนขับ
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {drivers.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
            ยังไม่มีคนขับ คลิกที่ &quot;เพิ่มคนขับ&quot; เพื่อเพิ่มคนขับใหม่
          </div>
        ) : (
          drivers.map((d, i) => (
            <div
              key={i}
              className="border border-gray-100 dark:border-gray-700 p-3 rounded-md bg-gray-50 dark:bg-gray-800 relative"
            >
              <Label htmlFor={`driver-${i}`} className="mb-2 block">
                คนขับที่ {i + 1}
              </Label>
              <div className="flex gap-3 items-center">
                <Input
                  id={`driver-${i}`}
                  placeholder={`ชื่อคนขับ ${i + 1}`}
                  value={d}
                  onChange={(e) => onChange(i, e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(i)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                  disabled={drivers.length <= 1}
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
