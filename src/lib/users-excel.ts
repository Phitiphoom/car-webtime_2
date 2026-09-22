// src/lib/users-excel.ts
//
// Excel template / export / parse for bulk user management. Client-side only;
// exceljs is loaded on demand so it isn't in the main bundle. The export uses
// the same columns as the import template, so export -> edit -> import works.
import type { ImportUserRow, UserDTO } from '@/server/users/user.schema';
import { ImportUserRowSchema } from '@/server/users/user.schema';

const SHEET = 'ผู้ใช้';
const HEADERS = [
  'username',
  'ชื่อ-นามสกุล',
  'อีเมล',
  'แผนก',
  'สิทธิ์ (ADMIN / APPROVER / USER)',
];
const ROLE_ALIASES: Record<string, ImportUserRow['role']> = {
  admin: 'ADMIN',
  แอดมิน: 'ADMIN',
  approver: 'APPROVER',
  ผู้อนุมัติ: 'APPROVER',
  user: 'USER',
  พนักงาน: 'USER',
};

async function loadExcel() {
  const mod = await import('exceljs');
  return mod.default ?? mod;
}

function download(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function styleHeader(sheet: import('exceljs').Worksheet) {
  const row = sheet.getRow(1);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC8102E' },
  };
  sheet.columns = [
    { width: 22 },
    { width: 30 },
    { width: 32 },
    { width: 28 },
    { width: 34 },
  ];
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function addRoleDropdown(sheet: import('exceljs').Worksheet) {
  for (let r = 2; r <= 1000; r++) {
    sheet.getCell(`E${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"ADMIN,APPROVER,USER"'],
    };
  }
}

export async function downloadUserTemplate() {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();

  const sheet = wb.addWorksheet(SHEET);
  sheet.addRow(HEADERS);
  styleHeader(sheet);
  addRoleDropdown(sheet);

  const help = wb.addWorksheet('วิธีใช้');
  help.columns = [{ width: 26 }, { width: 80 }];
  help.addRows([
    ['คอลัมน์', 'คำอธิบาย'],
    ['username', 'ชื่อผู้ใช้ตอนล็อกอิน (ตรงกับ AD) — บังคับ อย่างน้อย 3 ตัว'],
    ['ชื่อ-นามสกุล', 'บังคับ (จะถูกอัปเดตจาก AD ตอนล็อกอินครั้งแรก)'],
    [
      'อีเมล',
      'ไม่บังคับ แต่ผู้อนุมัติควรมี เพื่อให้ค้นหาและรับอีเมลอนุมัติได้',
    ],
    ['แผนก', 'ไม่บังคับ — ต้องเป็นชื่อแผนกในรายการของระบบ (ตรงตัวอักษร) ถ้าไม่ตรงแถวนั้นจะถูกข้าม'],
    ['สิทธิ์', 'ADMIN, APPROVER หรือ USER (เว้นว่าง = USER)'],
    [],
    ['ตัวอย่าง', 'somchai.j | สมชาย ใจดี | somchai.j@snc.co.th | | APPROVER'],
    ['หมายเหตุ', 'username ที่มีอยู่แล้วในระบบจะถูกข้าม ไม่ถูกทับ'],
    ['', 'ไม่ต้องใส่รหัสผ่าน — ผู้ใช้ล็อกอินด้วยรหัส AD (แผนกไม่ถูกดึงจาก AD)'],
  ]);
  help.getRow(1).font = { bold: true };

  download(await wb.xlsx.writeBuffer(), 'users-import-template.xlsx');
}

export async function exportUsers(users: UserDTO[]) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet(SHEET);
  sheet.addRow(HEADERS);
  for (const u of users) {
    sheet.addRow([u.username, u.name, u.email, u.department, u.role]);
  }
  styleHeader(sheet);
  addRoleDropdown(sheet);

  const stamp = new Date().toISOString().slice(0, 10);
  download(await wb.xlsx.writeBuffer(), `users-${stamp}.xlsx`);
}

export interface ParsedUserRow {
  line: number; // Excel row number, for error messages
  data?: ImportUserRow;
  errors: string[];
}

function cellText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    const v = value as { text?: unknown; result?: unknown; richText?: unknown };
    if (typeof v.text === 'string') return v.text.trim();
    if (v.result != null) return String(v.result).trim();
    if (Array.isArray(v.richText)) {
      return v.richText
        .map((r: { text?: string }) => r.text ?? '')
        .join('')
        .trim();
    }
    return '';
  }
  return String(value).trim();
}

export async function parseUserFile(file: File): Promise<ParsedUserRow[]> {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const sheet = wb.getWorksheet(SHEET) ?? wb.worksheets[0];
  if (!sheet) throw new Error('ไม่พบชีตในไฟล์');

  // Locate columns by header text so a reordered / extra-column file still works.
  const col: Partial<
    Record<'username' | 'name' | 'email' | 'department' | 'role', number>
  > = {};
  sheet.getRow(1).eachCell((cell, n) => {
    const h = cellText(cell.value).toLowerCase();
    if (h.includes('username')) col.username = n;
    else if (h.includes('ชื่อ') || h === 'name') col.name = n;
    else if (h.includes('อีเมล') || h.includes('email')) col.email = n;
    else if (h.includes('แผนก') || h.includes('department')) col.department = n;
    else if (h.includes('สิทธิ์') || h.includes('role')) col.role = n;
  });
  if (!col.username || !col.name) {
    throw new Error(
      'หัวตารางไม่ถูกต้อง — ต้องมีคอลัมน์ username และ ชื่อ-นามสกุล (ดาวน์โหลดแม่แบบมาใช้)'
    );
  }

  const get = (row: import('exceljs').Row, key: keyof typeof col) =>
    col[key] ? cellText(row.getCell(col[key]!).value) : '';

  const out: ParsedUserRow[] = [];
  sheet.eachRow((row, line) => {
    if (line === 1) return;
    const raw = {
      username: get(row, 'username'),
      name: get(row, 'name'),
      email: get(row, 'email'),
      department: get(row, 'department'),
      role: get(row, 'role'),
    };
    if (Object.values(raw).every((v) => !v)) return; // blank line

    const roleKey = raw.role.toLowerCase();
    const role = raw.role ? ROLE_ALIASES[roleKey] : 'USER';
    if (!role) {
      out.push({ line, errors: [`สิทธิ์ "${raw.role}" ไม่ถูกต้อง`] });
      return;
    }

    const parsed = ImportUserRowSchema.safeParse({ ...raw, role });
    out.push(
      parsed.success
        ? { line, data: parsed.data, errors: [] }
        : { line, errors: parsed.error.issues.map((i) => i.message) }
    );
  });

  if (out.length === 0) throw new Error('ไม่พบข้อมูลในไฟล์');
  return out;
}
