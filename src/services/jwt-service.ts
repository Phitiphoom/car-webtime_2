// src/services/jwt-service.ts
import jwt, { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';

/**
 * Custom payload สำหรับ JWT
 * Extend จาก jsonwebtoken.JwtPayload เพื่อให้รองรับ exp/iat อัตโนมัติ
 */
export interface JwtPayload extends BaseJwtPayload {
  sub: string; // User ID
  name: string; // User name
  email: string; // User email
  role: 'admin' | 'approver' | 'user'; // User role
  department?: string; // User department
  ip?: string; // User IP (optional)
  jti?: string; // JWT ID (unique identifier)
}

export class JWTService {
  private static secret = process.env.JWT_SECRET || 'your-secret-key';
  private static refreshSecret =
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

  /**
   * ✅ Verify access token
   * @param token JWT access token
   * @returns Decoded payload
   * @throws Error if token invalid or expired
   */
  static async verifyToken(token: string): Promise<JwtPayload> {
    if (!this.secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
      const decoded = jwt.verify(token, this.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * ✅ Sign access token
   * @param user ข้อมูล user
   * @param ip IP address (optional)
   * @returns JWT access token (string)
   */
  static async signToken(
    user: {
      id: string;
      name: string;
      email: string;
      role: 'admin' | 'approver' | 'user';
      department?: string;
    },
    ip?: string
  ): Promise<string> {
    if (!this.secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Generate random JWT ID
    const jwtId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    return jwt.sign(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        ip,
        jti: jwtId,
      },
      this.secret,
      {
        expiresIn: '30m', // Access token valid 30 minutes
      }
    );
  }

  /**
   * ✅ Sign refresh token
   * ใช้เก็บ session ระยะยาว (เช่น 7 วัน)
   * @param userId User ID
   * @returns Refresh token
   */
  static async signRefreshToken(userId: string): Promise<string> {
    if (!this.refreshSecret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not defined in environment variables'
      );
    }

    // Generate random token ID
    const tokenId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    return jwt.sign(
      {
        sub: userId,
        jti: tokenId,
      },
      this.refreshSecret,
      {
        expiresIn: '7d', // Refresh token valid for 7 days
      }
    );
  }

  /**
   * ✅ Verify refresh token
   * @param token Refresh token
   * @returns Decoded payload (sub, jti, exp)
   */
  static async verifyRefreshToken(
    token: string
  ): Promise<{ sub: string; jti?: string; exp?: number }> {
    if (!this.refreshSecret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not defined in environment variables'
      );
    }

    try {
      const decoded = jwt.verify(token, this.refreshSecret) as {
        sub: string;
        jti?: string;
        exp?: number;
      };
      return decoded;
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      throw new Error('Invalid refresh token');
    }
  }
}
