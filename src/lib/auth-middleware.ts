// src/lib/auth-middleware.ts
import { NextRequest } from 'next/server';
import { JWTService } from '@/services/jwt-service';
import { User } from '@/types/user';
import prisma from './prisma';

interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  department?: string;
  ip?: string;
  jti?: string;
  exp: number;
  iat: number;
}

export interface AuthResult {
  isAuthenticated: boolean;
  user: User | null;
  message?: string;
  tokenExpired?: boolean;
}

// --- Role mapping helper ---
const APPROVER_DEPARTMENTS = new Set([
  'supply chain department',
  'vice president',
  'acoec',
  'adv. coec',
  'md',
  'md scm',
  'md prd',
  'md qc',
  'md acc',
  'md mkt',
]);

const DEPARTMENT_ALIAS: Record<string, string> = {
  'mis department': 'mis',
  'it mis': 'mis',
};

// 👇 robust mapRole
export function mapRole(department: string): 'admin' | 'approver' | 'user' {
  console.log('🟦 mapRole input raw:', JSON.stringify(department));

  const dept = department
    .normalize('NFKC') // normalize unicode
    .replace(/\s+/g, ' ') // multiple spaces → single space
    .trim()
    .toLowerCase();

  console.log('🟦 mapRole normalized:', dept);

  const normalized = DEPARTMENT_ALIAS[dept] || dept;

  if (normalized === 'mis') return 'admin';
  if (APPROVER_DEPARTMENTS.has(normalized)) return 'approver';
  return 'user';
}

export async function verifyJwtMiddleware(
  request: NextRequest,
  requireRoles?: ('admin' | 'approver' | 'user')[]
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      isAuthenticated: false,
      user: null,
      message: 'Missing or invalid authorization header',
    };
  }

  const token = authHeader.substring(7);
  if (token.split('.').length !== 3) {
    return {
      isAuthenticated: false,
      user: null,
      message: 'Invalid token format',
    };
  }

  try {
    const payload = (await JWTService.verifyToken(token)) as JwtPayload;
    console.log('💠 JWT Verified. sub:', payload.sub, 'exp:', payload.exp);

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return {
        isAuthenticated: false,
        user: null,
        message: 'Token expired',
        tokenExpired: true,
      };
    }

    const requestIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (payload.ip && payload.ip !== requestIp) {
      console.warn(`⚠️ IP mismatch: token=${payload.ip}, request=${requestIp}`);
    }

    // --- department resolve ---
    let deptName = payload.department || '';
    if (!deptName) {
      const userId = Number(payload.sub);
      if (!Number.isNaN(userId)) {
        const dbUser = await prisma.tV_USERNAME.findUnique({
          where: { ID: userId },
          select: { DEPARTMENT: true },
        });
        deptName = dbUser?.DEPARTMENT || '';
      }
    }

    // 👇 ป้องกัน fallback "Unknown" overwrite ค่า MIS เดิม
    if (deptName === 'Unknown' || deptName === '') {
      const userId = Number(payload.sub);
      if (!Number.isNaN(userId)) {
        const dbUser = await prisma.tV_USERNAME.findUnique({
          where: { ID: userId },
          select: { DEPARTMENT: true },
        });
        if (dbUser?.DEPARTMENT) {
          deptName = dbUser.DEPARTMENT;
        }
      }
    }

    // --- map role ---
    const role = mapRole(deptName);

    const user: User = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role,
      department: deptName,
    };

    if (requireRoles && !requireRoles.includes(user.role)) {
      return {
        isAuthenticated: false,
        user,
        message: `Access denied. Required roles: ${requireRoles.join(', ')}`,
      };
    }

    const userId = Number(user.id);
    if (!Number.isNaN(userId)) {
      prisma.tV_USERNAME
        .update({
          where: { ID: userId },
          data: { LASTACTION: new Date() },
        })
        .catch((err) => console.warn('⚠️ Failed to update LASTACTION:', err));
    }

    console.log(`[AUTH] User ${user.id} (${user.name}) authenticated, role: ${user.role}`);
    return { isAuthenticated: true, user };
  } catch (error) {
    console.error('❌ JWT verification error:', error);
    const msg = error instanceof Error ? error.message : 'Invalid token';
    const expired = msg === 'Token has expired';
    return {
      isAuthenticated: false,
      user: null,
      message: msg,
      tokenExpired: expired,
    };
  }
}
