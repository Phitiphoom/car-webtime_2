// src/server/reference-data/car-brand.service.ts
//
// Read-only lookup — replaces the old distinct()-scan over
// TRAVEL_DETAIL.CARBARND and the "add a brand = insert a soft-deleted dummy
// trip row" hack. CarBrand rows are created implicitly by admin car
// creation (CarService.create, upsert-by-name) — there's no standalone
// "add brand" UI/route. Used only by CarDetail.brandId now; Trip books a
// specific CarDetail directly (see Trip.carId in prisma/schema.prisma).
import prisma from '@/lib/prisma';

export class CarBrandService {
  static async list() {
    const brands = await prisma.carBrand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return brands.map((b) => b.name);
  }
}
