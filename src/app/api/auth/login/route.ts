import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JWTService } from '@/services/jwt-service';
import { handleError } from '@/utils/error-handler';
import { AuthService } from '@/services/auth-service';
import { mapRole } from '@/lib/auth-middleware'; // ใช้ function mapRole

/* ── schema สำหรับ body ------------------------------------------------- */
const LoginBodySchema = z.object({
  username: z.string().trim().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

export async function POST(req: Request) {
  try {
    // อ่าน body
    const bodyText = await req.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error('Invalid JSON:', bodyText, e);
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    const { username, password } = LoginBodySchema.parse(body);

    // ตรวจสอบ LDAP config (ถ้าไม่ใช่ dev)
    if (
      process.env.NODE_ENV !== 'development' &&
      (!process.env.LDAP_URL || !process.env.LDAP_BASE)
    ) {
      console.error('LDAP configuration is missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // authenticate ผ่าน LDAP หรือ DB
    const authResult = await AuthService.authenticate(username, password);

    if (!authResult?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication failed: Invalid username or password' },
        { status: 401 }
      );
    }

    // ✅ ใช้ mapRole เพื่อคำนวณ role จาก department
    const role = mapRole(authResult.user.department || '');
    console.log('🟦 Final mapped role:', role, 'from department:', authResult.user.department);

    // ✅ สร้าง JWT token พร้อม role ที่ถูกต้อง
    const token = await JWTService.signToken({
      id: String(authResult.user.id),
      name: authResult.user.name,
      email: authResult.user.email,
      department: authResult.user.department,
      role,
    });

    return NextResponse.json({
      token,
      user: { ...authResult.user, role, permissions: {} },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Login route error:', err);
    return handleError(err);
  }
}
