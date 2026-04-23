// src/app/not-found.tsx
'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// คอมโพเนนต์ที่ไม่ใช้ useSearchParams
function NotFoundContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          ไม่พบหน้าที่คุณต้องการ
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          ขออภัย เราไม่พบหน้าที่คุณกำลังมองหา
        </p>
        <div className="space-y-4">
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            <Link href="/dashboard">กลับสู่หน้าแดชบอร์ด</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">กลับสู่หน้าเข้าสู่ระบบ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// คอมโพเนนต์หลักที่ครอบด้วย Suspense
export default function NotFound() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  );
}
