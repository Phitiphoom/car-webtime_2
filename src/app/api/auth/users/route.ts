import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { AuthService } from '@/services/auth-service';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';
import { handleError } from '@/utils/error-handler';

const NewUserSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(6),
  name: z.string().trim().min(1),
  department: z.string().trim().min(1),
  email: z.string().email().optional(),
});

// GET ─ list all users
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const users = await prisma.tV_USERNAME.findMany({
      select: {
        ID: true,
        USERNAME: true,
        NAME: true,
        EMAIL: true,
        DEPARTMENT: true,
        CREATED_AT: true,
        LASTACTION: true,
      },
      orderBy: { NAME: 'asc' },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error('Error listing users:', err);
    return handleError(err);
  }
}

// POST ─ create user (admin only)
export async function POST(request: NextRequest) {
  try {
    // Auth guard
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only allow admins (MIS) to create users
    if (auth.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create users' },
        { status: 403 }
      );
    }

    // Validate body via zod
    const body = await request.json();
    const data = NewUserSchema.parse(body);

    // ✅ Destructure เอาแค่ user ไม่ให้ nested { token, user }
    const { user } = await AuthService.createUser(auth.user.id, data);

    return NextResponse.json({
      message: 'User created successfully',
      user,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('Error creating user:', err);
    return handleError(err);
  }
}
