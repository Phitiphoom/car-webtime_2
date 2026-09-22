// src/server/reference-data/car.service.ts
import prisma from '@/lib/prisma';
import { CreateCarInput } from './car.schema';

function notFound(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 404;
  return err;
}

export class CarService {
  static async list(includeInactive = false) {
    return prisma.carDetail.findMany({
      where: includeInactive ? {} : { isActive: true, deletedAt: null },
      include: { brand: true },
      orderBy: { brand: { name: 'asc' } },
    });
  }

  static async create(input: CreateCarInput) {
    const brand = await prisma.carBrand.upsert({
      where: { name: input.brand.trim() },
      update: {},
      create: { name: input.brand.trim() },
    });

    return prisma.carDetail.create({
      data: {
        carCode: input.carCode,
        brandId: brand.id,
        model: input.model,
        plateNumber: input.plateNumber,
        color: input.color,
        year: input.year,
        status: input.status || 'Available',
      },
      include: { brand: true },
    });
  }

  static async restore(id: number) {
    const car = await prisma.carDetail.findUnique({ where: { id } });
    if (!car) throw notFound('Car not found');

    await prisma.carDetail.update({
      where: { id },
      data: { isActive: true, deletedAt: null },
    });
  }

  static async deactivate(id: number) {
    const car = await prisma.carDetail.findUnique({ where: { id } });
    if (!car || car.deletedAt) throw notFound('Car not found');

    await prisma.carDetail.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
