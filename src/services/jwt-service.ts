// src/services/jwt-service.ts
import jwt, { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import { Role } from '@/server/shared/enums';
import { env } from '@/env';
import { logger } from '@/lib/logger';

// Role is now embedded directly from User.role (the DB column) at sign time —
// it is no longer re-derived from department on every verify. See
// src/server/auth/role-mapping.ts and src/server/auth/guards.ts.
export interface JwtPayload extends BaseJwtPayload {
  sub: string; // User ID
  name: string; // User name
  email: string; // User email
  role: Role;
  ip?: string; // User IP (optional, session-pinning warning only)
  jti?: string; // JWT ID (unique identifier)
}

export class JWTService {
  // env.ts fails the process boot if these are unset — no insecure fallback.
  private static secret = env.JWT_SECRET;
  private static refreshSecret = env.JWT_REFRESH_SECRET;

  static async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch (error) {
      logger.warn({ err: error }, 'Access token verification failed');
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  static async signToken(
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
    },
    ip?: string
  ): Promise<string> {
    const jwtId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    return jwt.sign(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ip,
        jti: jwtId,
      },
      this.secret,
      { expiresIn: '30m' } // Access token valid 30 minutes
    );
  }

  static async signRefreshToken(userId: string): Promise<string> {
    const tokenId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    return jwt.sign({ sub: userId, jti: tokenId }, this.refreshSecret, {
      expiresIn: '7d', // Refresh token valid for 7 days
    });
  }

  static async verifyRefreshToken(
    token: string
  ): Promise<{ sub: string; jti?: string; exp?: number }> {
    try {
      return jwt.verify(token, this.refreshSecret) as {
        sub: string;
        jti?: string;
        exp?: number;
      };
    } catch (error) {
      logger.warn({ err: error }, 'Refresh token verification failed');
      throw new Error('Invalid refresh token');
    }
  }
}
