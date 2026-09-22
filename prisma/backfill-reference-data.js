// prisma/backfill-reference-data.js
//
// One-time copy of Department/CarBrand/CarDetail/DriverDetail from the old
// (@@ignore'd, still-live) legacy tables into the new schema's tables. Not
// part of the app's runtime code — run manually once via:
//   node prisma/backfill-reference-data.js
//
// Safe to re-run: each section skips itself if the target table already has
// rows, so it won't create duplicates.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPROVER_DEPARTMENTS = new Set([
  'supply chain department',
  'vice president',
  'acoec',
  'adv. coec',
  'md',
  'md scm',
  'md prd',
  'md qc',
  'md acc',
  'md mkt',
]);
const ADMIN_DEPARTMENTS = new Set(['mis']);

function normalize(name) {
  return name.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

async function backfillDepartments() {
  // No skip-if-nonempty guard here (unlike the other sections) — a
  // Department row can already exist from login-time auto-provisioning
  // (UserService.findOrCreateUser upserts one per LDAP department seen)
  // before this script ever runs. upsert() below makes re-running safe
  // regardless of what's already there.
  const fromUsers = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT DEPARTMENT AS name FROM TV_USERNAME WHERE DEPARTMENT IS NOT NULL AND LTRIM(RTRIM(DEPARTMENT)) <> ''`
  );
  const fromTrips = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT DEPARTMENT AS name FROM TRAVEL_DETAIL WHERE DEPARTMENT IS NOT NULL AND LTRIM(RTRIM(DEPARTMENT)) <> ''`
  );

  const names = new Set();
  for (const row of [...fromUsers, ...fromTrips]) {
    const trimmed = normalize(row.name);
    if (trimmed && trimmed.toLowerCase() !== 'unknown') names.add(trimmed);
  }

  let created = 0;
  for (const name of names) {
    const lower = name.toLowerCase();
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: {
        name,
        isAdminDept: ADMIN_DEPARTMENTS.has(lower),
        isApproverDept: APPROVER_DEPARTMENTS.has(lower),
      },
    });
    created++;
  }
  console.log(`Department: created ${created} rows.`);
}

async function backfillCarBrands() {
  const existing = await prisma.carBrand.count();
  if (existing > 0) {
    console.log(`CarBrand already has ${existing} rows, skipping.`);
    return;
  }

  const fromTrips = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT CARBARND AS name FROM TRAVEL_DETAIL WHERE CARBARND IS NOT NULL AND LTRIM(RTRIM(CARBARND)) <> ''`
  );
  const fromCars = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT BRAND AS name FROM CAR_DETAIL WHERE BRAND IS NOT NULL AND LTRIM(RTRIM(BRAND)) <> ''`
  );

  const names = new Set();
  for (const row of [...fromTrips, ...fromCars]) {
    const trimmed = normalize(row.name);
    if (trimmed) names.add(trimmed);
  }

  let created = 0;
  for (const name of names) {
    await prisma.carBrand.upsert({ where: { name }, update: {}, create: { name } });
    created++;
  }
  console.log(`CarBrand: created ${created} rows.`);
}

async function backfillCars() {
  const existing = await prisma.carDetail.count();
  if (existing > 0) {
    console.log(`CarDetail already has ${existing} rows, skipping.`);
    return;
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT CAR_ID, CAR_CODE, BRAND, MODEL, PLATE_NUMBER, COLOR, YEAR, STATUS, IS_ACTIVE, CREATED_AT, DELETED_AT FROM CAR_DETAIL`
  );

  let created = 0;
  for (const row of rows) {
    const brandName = normalize(row.BRAND || 'ไม่ระบุ');
    const brand = await prisma.carBrand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });

    await prisma.carDetail.create({
      data: {
        carCode: row.CAR_CODE,
        brandId: brand.id,
        model: row.MODEL,
        plateNumber: row.PLATE_NUMBER,
        color: row.COLOR,
        year: row.YEAR,
        status: row.STATUS ?? 'Available',
        isActive: row.IS_ACTIVE ?? true,
        createdAt: row.CREATED_AT ?? new Date(),
        deletedAt: row.DELETED_AT,
      },
    });
    created++;
  }
  console.log(`CarDetail: created ${created} rows.`);
}

async function backfillDrivers() {
  const existing = await prisma.driverDetail.count();
  if (existing > 0) {
    console.log(`DriverDetail already has ${existing} rows, skipping.`);
    return;
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT DRIVER_ID, DRIVER_CODE, DRIVER_NAME, DEPARTMENT, LICENSE_NUMBER, PHONE, EMAIL, IS_ACTIVE, CREATED_AT, DELETED_AT FROM DRIVER_DETAIL`
  );

  let created = 0;
  for (const row of rows) {
    let departmentId = null;
    const deptName = row.DEPARTMENT ? normalize(row.DEPARTMENT) : '';
    if (deptName) {
      const dept = await prisma.department.upsert({
        where: { name: deptName },
        update: {},
        create: { name: deptName },
      });
      departmentId = dept.id;
    }

    await prisma.driverDetail.create({
      data: {
        driverCode: row.DRIVER_CODE,
        name: row.DRIVER_NAME,
        departmentId,
        licenseNumber: row.LICENSE_NUMBER,
        phone: row.PHONE,
        email: row.EMAIL,
        isActive: row.IS_ACTIVE ?? true,
        createdAt: row.CREATED_AT ?? new Date(),
        deletedAt: row.DELETED_AT,
      },
    });
    created++;
  }
  console.log(`DriverDetail: created ${created} rows.`);
}

async function main() {
  await backfillDepartments();
  await backfillCarBrands();
  await backfillCars();
  await backfillDrivers();
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
