// src/server/reference-data/department.service.ts
//
// The department list is the official one imported from SAP. It is the ONLY
// source of departments: nothing creates a department implicitly any more
// (not login, not trip / user / driver creation). Every place that takes
// a department must pick one from this list — requireByName() enforces that on
// the server so a typo can't slip in as a new row.
import prisma from '@/lib/prisma';

export class DepartmentService {
  static async list() {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return departments.map((d) => d.name);
  }

  /** The active department with exactly this name, or a 400. */
  static async requireByName(name: string) {
    const trimmed = name.trim();
    const department = await prisma.department.findFirst({
      where: { name: trimmed, isActive: true },
    });
    if (!department) {
      const err = new Error(`ไม่พบแผนก "${trimmed}" ในรายการ`) as Error & {
        status?: number;
      };
      err.status = 400;
      throw err;
    }
    return department;
  }
}
