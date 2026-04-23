// src/middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';

// ใช้ in-memory cache สำหรับจำกัดอัตรา (rate limiting)
const ipRequestMap = new Map<string, { count: number; lastReset: number }>();

// ค่าคงที่สำหรับการจำกัดอัตรา
const MAX_REQUESTS_PER_MINUTE = 60; // จำนวนคำขอสูงสุดต่อนาที
const MAX_REQUESTS_PER_HOUR = 1000; // จำนวนคำขอสูงสุดต่อชั่วโมง
const WINDOW_SIZE_MINUTE = 60 * 1000; // 1 นาที (มิลลิวินาที)
const WINDOW_SIZE_HOUR = 60 * 60 * 1000; // 1 ชั่วโมง (มิลลิวินาที)

/**
 * Rate limit middleware สำหรับจำกัดจำนวนคำขอ API
 * ใช้หน่วยความจำ (in-memory storage)
 */
export async function rateLimitMiddleware(request: NextRequest) {
  // ดึง IP จาก header ที่เชื่อถือได้
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

  const path = request.nextUrl.pathname;

  // ตรวจสอบเฉพาะ API requests
  if (!path.startsWith('/api')) {
    return NextResponse.next();
  }

  // ให้ความสำคัญกับ API การเข้าสู่ระบบ ที่อาจถูกโจมตีมากกว่า
  const isLoginAttempt =
    path.includes('/api/auth/login') || path.includes('/api/auth/token');
  const maxRequests = isLoginAttempt ? 10 : MAX_REQUESTS_PER_MINUTE; // จำกัดการเข้าสู่ระบบมากกว่า

  try {
    const now = Date.now();
    const key = `${clientIp}:${path}`;

    // ตรวจสอบการใช้งานในนาที
    let minuteData = ipRequestMap.get(`${key}:minute`);

    // สร้างข้อมูลใหม่ถ้าไม่เคยมีหรือเกินช่วงเวลาไปแล้ว
    if (!minuteData || now - minuteData.lastReset > WINDOW_SIZE_MINUTE) {
      minuteData = { count: 1, lastReset: now };
      ipRequestMap.set(`${key}:minute`, minuteData);
    } else {
      // เพิ่มจำนวนคำขอ
      minuteData.count += 1;
      ipRequestMap.set(`${key}:minute`, minuteData);
    }

    // ตรวจสอบการใช้งานในชั่วโมง
    let hourData = ipRequestMap.get(`${key}:hour`);

    // สร้างข้อมูลใหม่ถ้าไม่เคยมีหรือเกินช่วงเวลาไปแล้ว
    if (!hourData || now - hourData.lastReset > WINDOW_SIZE_HOUR) {
      hourData = { count: 1, lastReset: now };
      ipRequestMap.set(`${key}:hour`, hourData);
    } else {
      // เพิ่มจำนวนคำขอ
      hourData.count += 1;
      ipRequestMap.set(`${key}:hour`, hourData);
    }

    // เพิ่ม rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit-Minute', String(maxRequests));
    response.headers.set(
      'X-RateLimit-Remaining-Minute',
      String(Math.max(0, maxRequests - minuteData.count))
    );
    response.headers.set(
      'X-RateLimit-Limit-Hour',
      String(MAX_REQUESTS_PER_HOUR)
    );
    response.headers.set(
      'X-RateLimit-Remaining-Hour',
      String(Math.max(0, MAX_REQUESTS_PER_HOUR - hourData.count))
    );

    // ตรวจสอบว่าเกินขีดจำกัดหรือไม่ (นาที หรือ ชั่วโมง)
    if (
      minuteData.count > maxRequests ||
      hourData.count > MAX_REQUESTS_PER_HOUR
    ) {
      // บันทึกข้อมูลการถูกจำกัดอัตรา
      console.warn(`Rate limit exceeded for ${clientIp} on ${path}`);

      // ส่งข้อความแสดงความผิดพลาด 429 Too Many Requests
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Please try again later',
          retryAfter: minuteData.count > maxRequests ? '60 seconds' : '1 hour',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': minuteData.count > maxRequests ? '60' : '3600',
          },
        }
      );
    }

    return response;
  } catch (error) {
    // ในกรณีที่มีข้อผิดพลาด ให้อนุญาตคำขอผ่านเพื่อไม่ให้ระบบล่ม
    console.error('Rate limit middleware error:', error);
    return NextResponse.next();
  }
}
