// src/utils/error-handler.ts
import { NextResponse } from 'next/server';

export function handleError(error: unknown): NextResponse {
  console.error('Unhandled error:', error);

  // ตรวจสอบประเภทของ error และดึงข้อความ
  const message = error instanceof Error ? error.message : 'Unknown error';

  // ตรวจสอบประเภทของ error เพื่อกำหนด HTTP status
  const status =
    error instanceof Error && error.message === 'Invalid Credentials'
      ? 401
      : 500;

  // ส่งคืน JSON response เสมอ ไม่ใช่ HTML
  return NextResponse.json({ error: message }, { status });
}
