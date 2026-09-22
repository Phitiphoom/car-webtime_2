// src/server/users/user.mapper.ts
import { Prisma } from '@prisma/client';
import { Role } from '@/server/shared/enums';
import { UserDTO } from './user.schema';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const userWithDepartment = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { department: true },
});
export type UserWithDepartment = Prisma.UserGetPayload<
  typeof userWithDepartment
>;

export function toUserDTO(user: UserWithDepartment): UserDTO {
  return {
    id: user.id.toString(),
    username: user.username,
    name: user.name,
    email: user.email ?? '',
    role: user.role as Role,
    department: user.department?.name ?? '',
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    lastAction: user.lastAction ? user.lastAction.toISOString() : null,
  };
}
