/* -------------------------------------------------------------------------- */
/*  src/app/api/departments/route.ts                                          */
/* -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';
import { handleError } from '@/utils/error-handler';

/* -------------------------------------------------------------------------- */
/*  zod schemas                                                               */
/* -------------------------------------------------------------------------- */
const NewDeptSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'name is required')
    .max(60, 'name must be at most 60 characters'),
});

/* -------------------------------------------------------------------------- */
/*  GET – distinct departments from users + trips                             */
/* -------------------------------------------------------------------------- */
// src/app/api/departments/route.ts
export async function GET(request: NextRequest) {
  try {
    /* auth guard */
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );

    /* pull departments from both tables */
    const [userRows, tripRows] = await Promise.all([
      prisma.tV_USERNAME.findMany({
        where: { DEPARTMENT: { not: '' } },
        select: { DEPARTMENT: true },
        distinct: ['DEPARTMENT'],
      }),
      prisma.tRAVEL_DETAIL.findMany({
        where: { is_deleted: false, DEPARTMENT: { not: null } },
        select: { DEPARTMENT: true },
        distinct: ['DEPARTMENT'],
      }),
    ]);

    // รวมข้อมูลจากทั้งสองแหล่ง
    const rawDepts = [
      ...userRows.map((r) => r.DEPARTMENT),
      ...tripRows.map((r) => r.DEPARTMENT),
    ].filter(Boolean) as string[];

    // กฎการแก้ไขเฉพาะ - อธิบายความหมายของคำที่มีความหมายเหมือนกัน
    const similarityRules: Record<string, string[]> = {
      // ความหมายเดียวกัน แต่พิมพ์ต่างกัน
      support: ['suppor', 'support'],
      yala: ['บ.ยะลาฟ้าสะอาด', 'บจก.ยะลาฟ้าสะอาด'],
      // เพิ่มกฎอื่นๆ ตามต้องการ
    };

    // ฟังก์ชันสำหรับ normalize ข้อความ
    const normalize = (text: string): string => {
      // 1. แปลงเป็นตัวพิมพ์เล็กทั้งหมด
      // 2. ตัดช่องว่างทั้งหมดที่ไม่จำเป็น (ตัดทั้งข้างหน้า ข้างหลัง และช่องว่างซ้ำในข้อความ)
      return text.toLowerCase().trim().replace(/\s+/g, ' '); // แทนที่ช่องว่างหลายช่องเป็นช่องว่างเดียว
    };

    // ฟังก์ชันสำหรับตรวจสอบว่าข้อความอยู่ในกลุ่มความหมายเดียวกันหรือไม่
    const findSimilarityGroup = (text: string): string | null => {
      const normalizedText = normalize(text);

      for (const [group, variants] of Object.entries(similarityRules)) {
        // ตรวจสอบว่าข้อความมีคำที่อยู่ในความหมายเดียวกันหรือไม่
        if (variants.some((v) => normalizedText.includes(normalize(v)))) {
          return group;
        }
      }

      return null;
    };

    // กลุ่มแผนกที่มีความหมายเหมือนกัน
    const departmentGroups = new Map<string, string[]>();

    // จัดกลุ่มแผนกที่มีความหมายเหมือนกันหลังจาก normalize
    for (const dept of rawDepts) {
      if (!dept) continue;

      const normalizedText = normalize(dept);
      // ตรวจสอบความหมายพิเศษ
      const similarityGroup = findSimilarityGroup(dept);

      // ใช้ similarity group ถ้ามี หรือไม่ก็ใช้ normalizedText
      const groupKey = similarityGroup || normalizedText;

      if (!departmentGroups.has(groupKey)) {
        departmentGroups.set(groupKey, []);
      }

      departmentGroups.get(groupKey)!.push(dept);
    }

    // เลือกรูปแบบแผนกที่ดีที่สุดจากแต่ละกลุ่ม
    const uniqueDepts = Array.from(departmentGroups.entries()).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      function ([_, variants]) {
        // เลือกรูปแบบที่มีตัวอักษรใหญ่ตรงตามรูปแบบมาตรฐาน (Title Case)
        // หรือรูปแบบที่ยาวที่สุดถ้าไม่สามารถเลือกได้
        // ลองหาชื่อแผนกที่เป็น Title Case (ขึ้นต้นด้วยตัวใหญ่)
        const titleCaseVariants = variants.filter((v) => {
          // ตรวจสอบว่าขึ้นต้นด้วยตัวพิมพ์ใหญ่หรือไม่
          const words = v.trim().split(/\s+/);
          return words.every(
            (word) => word.length > 0 && word[0] === word[0].toUpperCase()
          );
        });

        if (titleCaseVariants.length > 0) {
          // เลือกชื่อแผนกที่เป็น Title Case ที่ยาวที่สุด
          return titleCaseVariants.reduce((a, b) =>
            a.length >= b.length ? a : b
          );
        }

        // ถ้าไม่มี Title Case ให้เลือกชื่อที่ยาวที่สุด
        return variants.reduce((a, b) => (a.length >= b.length ? a : b));
      }
    );

    // กำหนดชื่อที่ถูกต้องบางแผนกที่ต้องการความเฉพาะ
    const finalCorrections: Record<string, string> = {
      Suppor: 'Support',
      'บจก.ยะลาฟ้าสะอาด ': 'บจก.ยะลาฟ้าสะอาด',
      // เพิ่มการแก้ไขอื่นๆ ตามต้องการ
    };

    // แก้ไขชื่อแผนกที่ต้องการความเฉพาะ
    const correctedDepts = uniqueDepts.map(
      (dept) => finalCorrections[dept] || dept
    );

    // เรียงลำดับตามตัวอักษร
    const sortedDepts = correctedDepts.sort((a, b) => a.localeCompare(b));

    console.log('Departments after advanced deduplication:', sortedDepts);
    console.log(
      'Original department count:',
      rawDepts.length,
      'Unique department count:',
      sortedDepts.length
    );

    return NextResponse.json(sortedDepts);
  } catch (err) {
    console.error('Error fetching departments:', err);
    return handleError(err);
  }
}

/* -------------------------------------------------------------------------- */
/*  POST – add department (admin only)                                        */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    /* auth guard */
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );

    if (auth.user?.role !== 'admin')
      return NextResponse.json(
        { error: 'Admin permission required' },
        { status: 403 }
      );

    /* validate body */
    const body = await request.json();
    const { name } = NewDeptSchema.parse(body);

    /* upsert placeholder row in tV_USERNAME (work-around) */
    const exists = await prisma.tV_USERNAME.findFirst({
      where: { DEPARTMENT: name },
    });

    if (!exists) {
      await prisma.tV_USERNAME.create({
        data: {
          USERNAME: `dept_${name.toLowerCase().replace(/\s+/g, '_')}_placeholder`,
          PASSWORD: '**PLACEHOLDER**',
          NAME: `Department: ${name}`,
          DEPARTMENT: name,
          FLAG: 'DEPARTMENT_PLACEHOLDER',
          CREATED_AT: new Date(),
        },
      });
    }

    /* return refreshed list */
    const rows = await prisma.tV_USERNAME.findMany({
      where: { DEPARTMENT: { not: '' } },
      select: { DEPARTMENT: true },
      distinct: ['DEPARTMENT'],
      orderBy: { DEPARTMENT: 'asc' },
    });

    const departments = rows
      .map((r) => r.DEPARTMENT)
      .filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      message: 'Department added successfully',
      departments,
    });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );

    console.error('Error adding department:', err);
    return handleError(err);
  }
}
