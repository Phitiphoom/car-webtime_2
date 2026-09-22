// src/server/users/user.service.ts
//
// The single user domain — replaces the old three overlapping
// implementations (/api/users*, /api/auth/users, AuthService/UserService's
// createUser). Authorization (admin-only) is enforced by the route handler
// via requireRole before any of these are called; this layer assumes the
// caller is already authorized and focuses on the data operation.
import prisma from '@/lib/prisma';
import { hash } from 'bcrypt';
import {
  CreateUserInput,
  UpdateUserInput,
  ImportUserRow,
  ImportUsersResult,
} from './user.schema';
import { randomUUID } from 'crypto';
import { DepartmentService } from '@/server/reference-data/department.service';
import { toUserDTO } from './user.mapper';

export class UserService {
  static async list(includeInactive = false) {
    const users = await prisma.user.findMany({
      where: includeInactive ? {} : { isActive: true, deletedAt: null },
      include: { department: true },
      orderBy: { name: 'asc' },
    });
    return users.map(toUserDTO);
  }

  static async getById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });
    return user ? toUserDTO(user) : null;
  }

  static async create(input: CreateUserInput) {
    const exists = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (exists) {
      const err = new Error('Username already exists') as Error & {
        status?: number;
      };
      err.status = 409;
      throw err;
    }

    const department = input.department
      ? await DepartmentService.requireByName(input.department)
      : null;
    const hashed = await hash(input.password, 10);

    const created = await prisma.user.create({
      data: {
        username: input.username,
        password: hashed,
        name: input.name,
        email: input.email ?? null,
        role: input.role ?? 'USER',
        departmentId: department?.id,
      },
      include: { department: true },
    });

    return toUserDTO(created);
  }

  /**
   * Bulk-create users (Excel import). Existing usernames are skipped, never
   * overwritten. Passwords are random and unusable — people sign in with AD,
   * which refreshes name/email on first login and leaves the role and
   * department set here untouched.
   */
  static async importMany(rows: ImportUserRow[]): Promise<ImportUsersResult> {
    const skipped: ImportUsersResult['skipped'] = [];
    const seen = new Set<string>();
    const fresh: ImportUserRow[] = [];

    const existing = await prisma.user.findMany({
      where: { username: { in: rows.map((r) => r.username) } },
      select: { username: true },
    });
    const existingNames = new Set(
      existing.map((u) => u.username.toLowerCase())
    );

    for (const row of rows) {
      const key = row.username.toLowerCase();
      if (seen.has(key)) {
        skipped.push({ username: row.username, reason: 'ซ้ำในไฟล์' });
      } else if (existingNames.has(key)) {
        skipped.push({ username: row.username, reason: 'มีผู้ใช้นี้อยู่แล้ว' });
      } else {
        fresh.push(row);
      }
      seen.add(key);
    }

    // Departments must come from the official list. A row naming an unknown
    // department is skipped (not silently created) so typos get fixed in the file.
    const official = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    const deptIds = new Map(official.map((d) => [d.name, d.id]));
    const ok: ImportUserRow[] = [];
    for (const r of fresh) {
      const name = r.department?.trim();
      if (name && !deptIds.has(name)) {
        skipped.push({
          username: r.username,
          reason: `ไม่พบแผนก "${name}" ในรายการ`,
        });
      } else {
        ok.push(r);
      }
    }

    // Cost 4: the password is never used, so don't spend ~100ms hashing it.
    const data = await Promise.all(
      ok.map(async (r) => ({
        username: r.username,
        password: await hash(randomUUID(), 4),
        name: r.name,
        email: r.email || null,
        role: r.role,
        departmentId: r.department?.trim()
          ? deptIds.get(r.department.trim())
          : undefined,
      }))
    );
    if (data.length) await prisma.user.createMany({ data });

    return { created: data.length, skipped };
  }

  static async update(id: number, input: UpdateUserInput) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('User not found') as Error & { status?: number };
      err.status = 404;
      throw err;
    }

    const department = input.department
      ? await DepartmentService.requireByName(input.department)
      : undefined;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        isActive: input.isActive,
        // Keep the soft-delete marker in step with isActive so a restored
        // user is fully restored (and a deactivated one fully hidden).
        deletedAt:
          input.isActive === undefined
            ? undefined
            : input.isActive
              ? null
              : new Date(),
        departmentId: department?.id,
        password: input.password ? await hash(input.password, 10) : undefined,
        editDate: new Date(),
      },
      include: { department: true },
    });

    return toUserDTO(updated);
  }

  static async deactivate(id: number) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      const err = new Error('User not found') as Error & { status?: number };
      err.status = 404;
      throw err;
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
