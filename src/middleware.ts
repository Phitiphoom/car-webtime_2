// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// กำหนด interface ให้ payload
interface JwtPayload extends Record<string, unknown> {
  exp?: number;
  role?: string;
}

// กำหนด interface สำหรับผลลัพธ์การตรวจสอบ token
interface TokenVerificationResult {
  valid: boolean;
  expired: boolean;
  payload?: JwtPayload;
}

// ฟังก์ชันตรวจสอบ token
async function verifyToken(token: string): Promise<TokenVerificationResult> {
  try {
    const secretKey = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );
    const { payload } = await jwtVerify(token, secretKey);

    // ตรวจสอบว่า token หมดอายุหรือไม่ โดยเช็คด้วยตัวเอง
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowInSeconds) {
      return { valid: false, expired: true };
    }

    return { valid: true, expired: false, payload: payload as JwtPayload };
  } catch (error: unknown) {
    // ใช้ unknown แทน any และ type checking
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Token validation error:', errorMessage);

    // ตรวจสอบว่า token หมดอายุหรือไม่
    if (errorMessage.includes('expired')) {
      return { valid: false, expired: true };
    }
    return { valid: false, expired: false };
  }
}

export async function middleware(request: NextRequest) {
  // ป้องกันการวนลูป redirect
  // ดึง URL จาก request
  const url = new URL(request.url);

  // หากเป็นหน้า login และมี parameter expired=true หรือ error=token_validation
  // ไม่ต้องตรวจสอบ token อีก
  if (
    url.pathname === '/login' &&
    (url.searchParams.has('expired') || url.searchParams.has('error'))
  ) {
    return NextResponse.next();
  }

  // ดึง token จาก cookie
  const token = request.cookies.get('carWebtime_token')?.value;

  // ตรวจสอบว่าผู้ใช้กำลังเข้าถึง route ที่ต้องการ authentication หรือไม่
  const isAuthRoute = ['/dashboard', '/log-usage', '/trips', '/admin'].some(
    (route) => request.nextUrl.pathname.startsWith(route)
  );

  // ถ้าเป็น API routes ให้ปล่อยผ่านไป (จะจัดการ auth ใน API handlers)
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // ถ้าเป็น public assets, ปล่อยผ่านไป
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/public') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // ตรวจสอบการเข้าถึงหน้า admin
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // ถ้ามี token ให้ตรวจสอบความถูกต้องและอายุ
  if (token) {
    try {
      const tokenStatus = await verifyToken(token);

      // ถ้า token หมดอายุหรือไม่ถูกต้อง และ ผู้ใช้พยายามเข้าถึงหน้าที่ต้องการ authentication
      if ((tokenStatus.expired || !tokenStatus.valid) && isAuthRoute) {
        // สร้าง redirect URL ที่มี parameter บอกสาเหตุ
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('expired', 'true');

        // ลบ cookie ที่หมดอายุ
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete('carWebtime_token');
        return response;
      }

      // ถ้า token ยังใช้ได้ แต่กำลังเข้าหน้า login หรือหน้าแรก ให้ redirect ไปที่ dashboard
      if (
        tokenStatus.valid &&
        !tokenStatus.expired &&
        (request.nextUrl.pathname === '/login' ||
          request.nextUrl.pathname === '/')
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // ตรวจสอบสิทธิ์สำหรับหน้า admin (เฉพาะ admin เท่านั้น)
      if (isAdminRoute && tokenStatus.valid && !tokenStatus.expired) {
        const userRole = tokenStatus.payload?.role;
        if (userRole !== 'admin') {
          // ถ้าไม่ใช่ admin ให้ redirect ไปหน้า dashboard
          return NextResponse.redirect(
            new URL('/dashboard?access=denied', request.url)
          );
        }
      }

      // token ถูกต้องและมีสิทธิ์เข้าถึง ปล่อยให้ดำเนินการต่อไป
      return NextResponse.next();
    } catch (error) {
      console.error('Unexpected error in token validation:', error);
      // กรณีมีข้อผิดพลาดในการตรวจสอบ token ให้ทำเหมือน token ไม่ถูกต้อง
      const response = NextResponse.redirect(
        new URL('/login?error=token_validation', request.url)
      );
      response.cookies.delete('carWebtime_token');
      return response;
    }
  }

  // ถ้าเข้าถึง protected routes แต่ไม่มี token ให้ redirect ไปที่หน้า login
  if (isAuthRoute) {
    // บันทึก original URL เพื่อ redirect กลับมาหลังจาก login
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set(
      'callbackUrl',
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(redirectUrl);
  }

  // ถ้าเป็น root path "/" และไม่มี token ให้ redirect ไปที่หน้า login
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// ระบุ routes ที่ middleware นี้จะทำงาน
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
