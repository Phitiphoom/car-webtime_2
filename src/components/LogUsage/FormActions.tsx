/* File: src/components/LogUsage/FormActions.tsx */
'use client';
import React from 'react';
import { Card, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export function FormActions({ loading }: { loading: boolean }) {
  return (
    <Card className="border-none shadow-none">
      <CardFooter className="justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard">ยกเลิก</Link>
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            'ส่งคำขออนุมัติ'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
