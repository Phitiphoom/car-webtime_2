// src/server/reference-data/driver.service.ts
import prisma from '@/lib/prisma';
import { CreateDriverInput } from './driver.schema';
import { DepartmentService } from './department.service';

function notFound(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 404;
  return err;
}

export class DriverService {
  static async list(includeInactive = false) {
    return prisma.driverDetail.findMany({
      where: includeInactive ? {} : { isActive: true, deletedAt: null },
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  static async create(input: CreateDriverInput) {
    const department = input.department?.trim()
      ? await DepartmentService.requireByName(input.department)
      : null;

    return prisma.driverDetail.create({
      data: {
        driverCode: input.driverCode,
        name: input.driverName,
        departmentId: department?.id,
        licenseNumber: input.licenseNumber,
        phone: input.phone,
        email: input.email,
      },
      include: { department: true },
    });
  }

  static async restore(id: number) {
    const driver = await prisma.driverDetail.findUnique({ where: { id } });
    if (!driver) throw notFound('Driver not found');

    await prisma.driverDetail.update({
      where: { id },
      data: { isActive: true, deletedAt: null },
    });
  }

  static async deactivate(id: number) {
    const driver = await prisma.driverDetail.findUnique({ where: { id } });
    if (!driver || driver.deletedAt) throw notFound('Driver not found');

    await prisma.driverDetail.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
