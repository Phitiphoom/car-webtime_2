// src/server/stats/car-usage.service.ts
//
// Rebuilt to surface real DB errors via handleError() instead of the old
// behavior of swallowing any database error and silently returning
// zeroed/fake data — that made a broken stats query indistinguishable from
// "there's genuinely no data yet."
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '@/server/auth/guards';
import { CarUsageQuery } from './car-usage.schema';

function periodStart(period: CarUsageQuery['period'], end: Date): Date {
  const start = new Date(end);
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }
  return start;
}

function countBy<T>(items: T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item) || 'Unknown';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([value, count]) => ({
    value,
    count,
  }));
}

export class CarUsageStatsService {
  static async getStats(query: CarUsageQuery, requester: AuthenticatedUser) {
    const today = new Date();
    const end = query.endDate ?? today;
    const start = query.startDate ?? periodStart(query.period, end);

    const where: Prisma.TripWhereInput = {
      deletedAt: null,
      date: { gte: start, lte: end },
    };

    // Role-scoped: a plain user only sees their own trips; an approver sees
    // their department's trips; admin sees everything.
    if (requester.role === 'USER') {
      where.recordById = requester.id;
    } else if (requester.role === 'APPROVER') {
      const approver = await prisma.user.findUnique({
        where: { id: requester.id },
        include: { department: true },
      });
      where.departmentId = approver?.departmentId ?? -1;
    }

    const trips = await prisma.trip.findMany({
      where,
      include: { car: { include: { brand: true } }, department: true },
    });

    return {
      totalTrips: trips.length,
      period: { start, end, type: query.period },
      byStatus: countBy(trips, (t) => t.status),
      byCarBrand: countBy(trips, (t) => t.car.brand.name),
      byPurpose: countBy(
        trips.filter((t) => t.purpose),
        (t) => t.purpose ?? ''
      ),
      byDepartment: countBy(trips, (t) => t.department.name),
    };
  }
}
