// src/server/reference-data/approver.service.ts
import prisma from '@/lib/prisma';

export class ApproverService {
  static async list(department?: string) {
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        isActive: true,
        ...(department ? { department: { name: department } } : {}),
      },
      include: { department: true },
      orderBy: { name: 'asc' },
    });

    return users.map((u) => ({
      id: u.id.toString(),
      username: u.username,
      name: u.name,
      email: u.email,
      department: u.department?.name ?? '',
      role: u.role,
    }));
  }
}
