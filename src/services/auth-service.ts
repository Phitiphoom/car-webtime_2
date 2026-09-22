// src/services/auth-service.ts
//
// Authenticates via a locally-stored password OR Webtime (TigerSoft HR) — this
// replaces the old LDAP/AD path. A successful Webtime login auto-provisions a
// local User row the same way LDAP used to (username = PersonCode, name from
// PNT_Person, role defaults to USER — never ADMIN/APPROVER — and department is
// left unset: departments come ONLY from the official SAP list, never from
// Webtime, and an admin assigns one afterward). An admin can still promote the
// role or set the department at any time via /admin/users.
import prisma from '@/lib/prisma';
import { compare, hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { WebtimeService } from './webtime-service';
import { JWTService } from './jwt-service';
import { Role } from '@/server/shared/enums';
import { logger } from '@/lib/logger';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  department: string;
}

type UserRow = {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: string;
  department: { name: string } | null;
};

function httpError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

export class AuthService {
  /** Authenticate via DB first (existing local-password accounts), then Webtime. */
  static async authenticate(username: string, password: string) {
    try {
      const dbResult = await this.tryDatabaseAuthentication(username, password);
      if (dbResult) return dbResult;

      const webtimeResult = await this.tryWebtimeAuthentication(
        username,
        password
      );
      if (webtimeResult) return webtimeResult;

      throw new Error('Invalid username or password');
    } catch (error) {
      // A specific, intentional error (has .status) is surfaced as-is — e.g.
      // "this account hasn't been created yet" is useful to someone who just
      // proved their identity via Webtime. Anything else is masked to a
      // generic message, same as before, so failed attempts don't reveal
      // which check (username vs. password) actually failed.
      if (error instanceof Error && (error as { status?: number }).status) {
        throw error;
      }
      logger.warn({ err: error, username }, 'Authentication failed');
      throw new Error('Authentication failed');
    }
  }

  private static async tryDatabaseAuthentication(
    username: string,
    password: string
  ) {
    const row = await prisma.user.findUnique({
      where: { username },
      include: { department: true },
    });

    if (!row || !row.isActive) return null;

    const passwordMatch = await compare(password, row.password);
    if (!passwordMatch) return null;

    await prisma.user.update({
      where: { id: row.id },
      data: { logDate: new Date(), lastAction: new Date() },
    });

    return this.createUserResponse(this.toAppUser(row));
  }

  /**
   * Webtime (TigerSoft HR system) replaces LDAP as the second auth source.
   * A successful check auto-provisions a local User row the first time
   * someone logs in (see the module comment) — mirrors the old LDAP
   * auto-provisioning, just against Webtime instead of AD.
   */
  private static async tryWebtimeAuthentication(
    username: string,
    password: string
  ) {
    const webtimeUser = await WebtimeService.authenticate(username, password);
    if (!webtimeUser) return null;

    const now = new Date();
    const existing = await prisma.user.findUnique({
      where: { username },
      include: { department: true },
    });

    if (existing) {
      if (!existing.isActive) {
        throw httpError(403, 'บัญชีนี้ถูกปิดใช้งาน');
      }

      const updated = await prisma.user.update({
        where: { id: existing.id },
        // Name is refreshed from Webtime (HR is the source of truth for it);
        // role and department are set by an admin and are never touched here.
        data: {
          name: webtimeUser.name || existing.name,
          logDate: now,
          lastAction: now,
        },
        include: { department: true },
      });
      return this.createUserResponse(this.toAppUser(updated));
    }

    const created = await prisma.user.create({
      data: {
        username: webtimeUser.personCode,
        // Webtime-provisioned accounts authenticate via Webtime, never this
        // hash — it must still be unique/unguessable per user (never a shared
        // literal string; that was the old LDAP-provisioning bug).
        password: await hash(randomUUID(), 10),
        name: webtimeUser.name || webtimeUser.personCode,
        role: 'USER', // never ADMIN/APPROVER at auto-provisioning time
        logDate: now,
        lastAction: now,
      },
      include: { department: true },
    });
    logger.info(
      { userId: created.id },
      'Provisioned new user from Webtime login'
    );
    return this.createUserResponse(this.toAppUser(created));
  }

  private static toAppUser(row: UserRow): AppUser {
    return {
      id: row.id.toString(),
      username: row.username,
      name: row.name,
      email: row.email ?? '',
      role: row.role as Role,
      department: row.department?.name ?? '',
    };
  }

  /** Role comes straight from the DB record set when the account was
   * created — it is never re-derived from anything at login time. */
  private static async createUserResponse(user: AppUser) {
    const token = await JWTService.signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return { token, user };
  }
}
