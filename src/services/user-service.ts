import prisma from '@/lib/prisma';
import { compare, hash } from 'bcrypt';

export interface AppUser {
  USER_ID: string;
  id: string;
  username: string;
  name: string;
  email: string;
  department: string;
}

export class UserService {
  /**
   * Find or create a user based on LDAP data
   */
  static async findOrCreateUser(
    ldapUser: {
      sAMAccountName: string;
      cn?: string;
      mail?: string;
      department?: string;
    },
    now: Date
  ): Promise<AppUser> {
    try {
      // 1. ดูค่าจาก LDAP มาเป็นอันดับแรก
      console.log('[LDAP INPUT] sAMAccountName:', ldapUser.sAMAccountName);
      console.log('[LDAP INPUT] cn:', ldapUser.cn);
      console.log('[LDAP INPUT] mail:', ldapUser.mail);
      console.log('[LDAP INPUT] department:', ldapUser.department);

      // 2. ดึงข้อมูล user จาก Prisma
      const found = await prisma.tV_USERNAME.findUnique({
        where: { USERNAME: ldapUser.sAMAccountName },
      });
      console.log('[PRISMA] findUnique result:', found);

      let user = found;
      if (user) {
        // 3. อัปเดตกรณี user มีอยู่แล้ว
        const updated = await prisma.tV_USERNAME.update({
          where: { ID: user.ID },
          data: {
            LOGDATE: now,
            LASTACTION: now,
            // เพิ่มบรรทัดเหล่านี้
            DEPARTMENT: ldapUser.department ?? user.DEPARTMENT,
            NAME: ldapUser.cn || user.NAME,
            EMAIL: ldapUser.mail || user.EMAIL,
          },
        });
        console.log('[PRISMA] update result:', updated);
        user = updated;
      } else {
        // 4. สร้างใหม่ ถ้ายังไม่มี
        const created = await prisma.tV_USERNAME.create({
          data: {
            USERNAME: ldapUser.sAMAccountName,
            PASSWORD: await hash('ldap-auth-user', 10),
            NAME: ldapUser.cn || ldapUser.sAMAccountName,
            EMAIL: ldapUser.mail || '',
            DEPARTMENT: ldapUser.department || '',
            LOGDATE: now,
            LASTACTION: now,
            CREATED_AT: now,
          },
        });
        console.log('[PRISMA] create result:', created);
        user = created;
      }

      // 5. ตรวจสอบค่าก่อนจะส่งกลับ
      console.log('[MAPPING] user.DEPARTMENT:', user.DEPARTMENT);

      return {
        USER_ID: user.ID.toString(),
        id: user.ID.toString(),
        username: user.USERNAME,
        name: user.NAME,
        email: user.EMAIL || '',
        department: user.DEPARTMENT,
      };
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with database credentials
   */
  static async findOrCreateFromCredentials(
    username: string,
    password: string
  ): Promise<AppUser> {
    try {
      const user = await prisma.tV_USERNAME.findUnique({
        where: { USERNAME: username },
      });

      if (user) {
        // Verify password
        if (!user.PASSWORD) {
          throw new Error('User account has no password');
        }

        const passwordValid = await compare(password, user.PASSWORD);
        if (!passwordValid) {
          const err = new Error('Invalid username or password');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (err as any).status = 401;
          throw err;
        }

        // Update login time
        await prisma.tV_USERNAME.update({
          where: { ID: user.ID },
          data: { LOGDATE: new Date(), LASTACTION: new Date() },
        });

        return {
          USER_ID: user.ID.toString(),
          id: user.ID.toString(),
          username: user.USERNAME,
          name: user.NAME,
          email: user.EMAIL || '',
          department: user.DEPARTMENT,
        };
      }

      // Create new account if not exist
      const hashedPassword = await hash(password, 10);
      const newUser = await prisma.tV_USERNAME.create({
        data: {
          USERNAME: username,
          PASSWORD: hashedPassword,
          NAME: username,
          EMAIL: '',
          DEPARTMENT: '',
          LOGDATE: new Date(),
          LASTACTION: new Date(),
          CREATED_AT: new Date(),
        },
      });

      return {
        USER_ID: newUser.ID.toString(),
        id: newUser.ID.toString(),
        username: newUser.USERNAME,
        name: newUser.NAME,
        email: newUser.EMAIL || '',
        department: newUser.DEPARTMENT,
      };
    } catch (error) {
      console.error('Error in findOrCreateFromCredentials:', error);
      throw error;
    }
  }
}
