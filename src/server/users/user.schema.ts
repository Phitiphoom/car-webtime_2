// src/server/users/user.schema.ts
import { z } from 'zod';
import { RoleSchema } from '@/server/shared/enums';

export const CreateUserSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(6),
  name: z.string().trim().min(1),
  email: z.string().email().optional(),
  // Optional: departments are never auto-assigned; an admin sets this.
  department: z.string().trim().optional(),
  role: RoleSchema.optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  department: z.string().trim().optional(),
  role: RoleSchema.optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export interface UserDTO {
  id: string;
  username: string;
  name: string;
  email: string;
  role: z.infer<typeof RoleSchema>;
  department: string;
  isActive: boolean;
  createdAt: string;
  lastAction: string | null;
}

// One row of the Excel bulk import. No password column: imported accounts get
// a random unusable password and sign in with AD (see UserService.importMany).
export const ImportUserRowSchema = z.object({
  username: z.string().trim().min(3, 'username สั้นเกินไป (อย่างน้อย 3 ตัว)'),
  name: z.string().trim().min(1, 'ต้องระบุชื่อ'),
  email: z
    .string()
    .trim()
    .email('อีเมลไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
  department: z.string().trim().optional(),
  role: RoleSchema,
});
export type ImportUserRow = z.infer<typeof ImportUserRowSchema>;

export const ImportUsersSchema = z.object({
  users: z.array(ImportUserRowSchema).min(1).max(1000),
});

export interface ImportUsersResult {
  created: number;
  skipped: { username: string; reason: string }[];
}
