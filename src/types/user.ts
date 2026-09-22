// src/types/user.ts
//
// Only used by the src/lib/auth-middleware.ts backward-compat shim now.
// New code should use UserDTO from src/server/users/user.schema.ts instead
// — the old CreateUserDTO/UserFields here referenced fields (ROLE_ID, MENU,
// IS_REVIEW, ...) that never matched the real schema and have been removed.
import { Role } from '@/server/shared/enums';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
};
