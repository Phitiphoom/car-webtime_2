// src/services/auth-service.ts
import prisma from '@/lib/prisma';
import { LDAPService } from './ldap-service';
import { UserService } from './user-service';
import { JWTService } from './jwt-service';
import { hash, compare } from 'bcrypt';
import { User } from '@/types/user';
import { mapRole } from '@/lib/auth-middleware';

/** Prisma DB user row */
type DbUserRow = {
  ID: number;
  USERNAME: string;
  PASSWORD: string;
  NAME: string;
  EMAIL: string | null;
  DEPARTMENT: string | null;
};

/** LDAP/Service user row */
type ServiceUserRow = {
  id: string;
  name: string;
  email?: string;
  department?: string;
};

/** Union type สำหรับ response จาก DB หรือ LDAP */
type UserRow = DbUserRow | ServiceUserRow;

export class AuthService {
  /** Authenticate via LDAP first, then DB */
  static async authenticate(username: string, password: string) {
    try {
      // 1. Database authentication
      const dbResult = await this.tryDatabaseAuthentication(username, password);
      if (dbResult) return dbResult;

      // 2. LDAP authentication
      const ldapResult = await this.tryLdapAuthentication(username, password);
      if (ldapResult) return ldapResult;

      throw new Error('Invalid username or password');
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Authentication failed');
    }
  }

  /** Database authentication */
  private static async tryDatabaseAuthentication(
    username: string,
    password: string
  ) {
    try {
      console.log(`Database login attempt: ${username}`);

      const row = await prisma.tV_USERNAME.findUnique({
        where: { USERNAME: username },
        select: {
          ID: true,
          USERNAME: true,
          PASSWORD: true,
          NAME: true,
          EMAIL: true,
          DEPARTMENT: true,
          IS_ACTIVE: true,
        },
      });

      if (!row) {
        console.log(`User not found: ${username}`);
        return null;
      }

      if (row.IS_ACTIVE === false) {
        console.log(`User is deactivated: ${username}`);
        return null;
      }

      const passwordMatch = await compare(password, row.PASSWORD);
      if (!passwordMatch) {
        console.log(`Invalid password for user: ${username}`);
        return null;
      }

      console.log(`Successful login for user: ${username}`);

      await prisma.tV_USERNAME.update({
        where: { ID: row.ID },
        data: {
          LOGDATE: new Date(),
          LASTACTION: new Date(),
        },
      });

      return this.createUserResponse(row);
    } catch (error) {
      console.error('Database authentication error:', error);
      return null;
    }
  }

  /** LDAP authentication */
  private static async tryLdapAuthentication(
    username: string,
    password: string
  ) {
    try {
      const ldapUser = await LDAPService.authenticate(username, password);
      if (!ldapUser.sAMAccountName) return null;

      // Find or create in DB
      const record = await UserService.findOrCreateUser(
        {
          sAMAccountName: ldapUser.sAMAccountName,
          cn: ldapUser.cn,
          mail: ldapUser.mail,
          department: ldapUser.department,
        },
        new Date()
      );

      return this.createUserResponse(record);
    } catch (error) {
      console.error('LDAP authentication error:', error);
      return null;
    }
  }

  /** Create user response object */
  private static createUserResponse(row: UserRow) {
    const id =
      'ID' in row ? row.ID.toString() : row.id.toString();
    const name =
      'NAME' in row ? row.NAME : row.name;
    const email =
      'EMAIL' in row ? row.EMAIL ?? '' : row.email ?? '';

    // ✅ เลือก department อย่างปลอดภัย
    let department =
      'DEPARTMENT' in row
        ? row.DEPARTMENT || 'Unknown'
        : row.department || 'Unknown';

    // ✅ ถ้า department จาก LDAP ว่าง ให้ fallback เป็นของ DB
    if (
      (department === 'Unknown' || department.trim() === '') &&
      'DEPARTMENT' in row &&
      row.DEPARTMENT &&
      row.DEPARTMENT !== 'Unknown'
    ) {
      department = row.DEPARTMENT;
    }

    // ✅ คำนวณ role จาก department จริง
    const role = mapRole(department);

    // ✅ สร้าง JWT
    const token = JWTService.signToken({
      id,
      name,
      email,
      role,
      department,
    });

    const user: User = { id, name, email, role, department };
    return { token, user };
  }

  /** Create new user (MIS only) */
  static async createUser(
    creatorId: string,
    userData: {
      username: string;
      password: string;
      name: string;
      email?: string;
      department: string;
    }
  ) {
    const creator = await prisma.tV_USERNAME.findUnique({
      where: { ID: parseInt(creatorId, 10) },
    });
    if (!creator || creator.DEPARTMENT.trim().toLowerCase() !== 'mis') {
      throw new Error('Only MIS department members can create users');
    }

    const exists = await prisma.tV_USERNAME.findUnique({
      where: { USERNAME: userData.username },
    });
    if (exists) throw new Error('Username already exists');

    const hashed = await hash(userData.password, 10);
    const newRow = await prisma.tV_USERNAME.create({
      data: {
        USERNAME: userData.username,
        PASSWORD: hashed,
        NAME: userData.name,
        EMAIL: userData.email || null,
        DEPARTMENT: userData.department,
        CREATED_AT: new Date(),
        LOGDATE: new Date(),
      },
    });

    return this.createUserResponse(newRow);
  }
}
