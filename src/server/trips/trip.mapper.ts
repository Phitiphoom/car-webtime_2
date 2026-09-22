// src/server/trips/trip.mapper.ts
import { Prisma } from '@prisma/client';
import { TripStatus } from '@/server/shared/enums';

export const tripWithRelationsInclude = Prisma.validator<Prisma.TripInclude>()({
  car: { include: { brand: true } },
  department: true,
  recordBy: true,
  approvedBy: true,
  items: true,
  drivers: { include: { driver: true } },
  approvers: { orderBy: { id: 'asc' } },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tripWithRelations = Prisma.validator<Prisma.TripDefaultArgs>()({
  include: tripWithRelationsInclude,
});
export type TripWithRelations = Prisma.TripGetPayload<typeof tripWithRelations>;

export interface TripDTO {
  id: number;
  startPoint: string;
  endPoint: string;
  car: { id: number; brand: string; model: string; plateNumber: string };
  date: string;
  time: string | null;
  locations: string | null;
  purpose: string | null;
  purposeText: string | null;
  remark: string | null;
  department: string;
  status: TripStatus;
  recordBy: { id: number; name: string };
  approvedBy: { id: number; name: string } | null;
  approvedAt: string | null;
  approvers: {
    id: number;
    email: string;
    name: string | null;
    decision: 'APPROVED' | 'REJECTED' | null;
    decidedAt: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
  items: { id: number; startPoint: string; endPoint: string }[];
  drivers: { id: number; driverId: number; name: string }[];
}

export function toTripDTO(trip: TripWithRelations): TripDTO {
  return {
    id: trip.id,
    startPoint: trip.startPoint,
    endPoint: trip.endPoint,
    car: {
      id: trip.car.id,
      brand: trip.car.brand.name,
      model: trip.car.model,
      plateNumber: trip.car.plateNumber,
    },
    date: trip.date.toISOString(),
    time: trip.time ? trip.time.toISOString() : null,
    locations: trip.locations,
    purpose: trip.purpose,
    purposeText: trip.purposeText,
    remark: trip.remark,
    department: trip.department.name,
    status: trip.status as TripStatus,
    recordBy: { id: trip.recordBy.id, name: trip.recordBy.name },
    approvedBy: trip.approvedBy
      ? { id: trip.approvedBy.id, name: trip.approvedBy.name }
      : null,
    approvedAt: trip.approvedAt ? trip.approvedAt.toISOString() : null,
    approvers: trip.approvers.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      decision: a.decision as 'APPROVED' | 'REJECTED' | null,
      decidedAt: a.decidedAt ? a.decidedAt.toISOString() : null,
    })),
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    items: trip.items.map((i) => ({
      id: i.id,
      startPoint: i.startPoint,
      endPoint: i.endPoint,
    })),
    drivers: trip.drivers.map((d) => ({
      id: d.id,
      driverId: d.driverId,
      name: d.driver.name,
    })),
  };
}
