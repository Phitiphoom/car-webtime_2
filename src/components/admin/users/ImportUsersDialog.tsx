// src/components/admin/users/ImportUsersDialog.tsx
//
// Bulk-add users from an Excel file: download template -> fill in -> upload ->
// preview (with per-row errors) -> import. Existing usernames are skipped.
'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useImportUsers } from '@/hooks/queries/useUsers';
import {
  downloadUserTemplate,
  parseUserFile,
  ParsedUserRow,
} from '@/lib/users-excel';
import type { ImportUsersResult } from '@/server/users/user.schema';

export function ImportUsersDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedUserRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportUsersResult | null>(null);
  const [reading, setReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const importUsers = useImportUsers();

  const valid = rows?.filter((r) => r.data) ?? [];
  const invalid = rows?.filter((r) => !r.data) ?? [];

  const reset = () => {
    setRows(null);
    setFileName('');
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setResult(null);
    try {
      setRows(await parseUserFile(file));
      setFileName(file.name);
    } catch (err) {
      setRows(null);
      toast.error(err instanceof Error ? err.message : 'อ่านไฟล์ไม่สำเร็จ');
    } finally {
      setReading(false);
    }
  };

  const onImport = () =>
    importUsers.mutate(
      valid.map((r) => r.data!),
      {
        onSuccess: (res) => {
          setResult(res);
          setRows(null);
          if (inputRef.current) inputRef.current.value = '';
          toast.success(`เพิ่มผู้ใช้แล้ว ${res.created} คน`);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'นำเข้าไม่สำเร็จ'),
      }
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          นำเข้าจาก Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>นำเข้าผู้ใช้จาก Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-dashed border-foreground/30 p-3">
            <p className="text-muted-foreground">
              1. ดาวน์โหลดแม่แบบ แล้วกรอกรายชื่อ — ไม่ต้องใส่รหัสผ่าน
              (ล็อกอินด้วยรหัส AD)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadUserTemplate().catch(() =>
                  toast.error('สร้างแม่แบบไม่สำเร็จ')
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              ดาวน์โหลดแม่แบบ
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">2. เลือกไฟล์ที่กรอกแล้ว</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="block w-full text-sm file:mr-3 file:rounded-[3px] file:border file:border-foreground/30 file:bg-card file:px-3 file:py-1.5 file:text-sm"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            {reading && (
              <p className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังอ่านไฟล์...
              </p>
            )}
          </div>

          {rows && (
            <div className="space-y-2">
              <p className="flex flex-wrap items-center gap-x-2 font-medium">
                <FileSpreadsheet className="h-4 w-4" />
                {fileName}: พร้อมนำเข้า {valid.length} แถว
                {invalid.length > 0 && (
                  <span className="text-destructive">
                    · มีข้อผิดพลาด {invalid.length} แถว (จะไม่ถูกนำเข้า)
                  </span>
                )}
              </p>
              <div className="max-h-56 overflow-auto rounded-[3px] border border-foreground/20">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card text-left text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5">แถว</th>
                      <th className="px-2 py-1.5">username</th>
                      <th className="px-2 py-1.5">ชื่อ</th>
                      <th className="px-2 py-1.5">สิทธิ์</th>
                      <th className="px-2 py-1.5">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-foreground/20">
                    {rows.map((r) => (
                      <tr key={r.line}>
                        <td className="px-2 py-1 font-mono">{r.line}</td>
                        <td className="px-2 py-1 font-mono">
                          {r.data?.username ?? '—'}
                        </td>
                        <td className="px-2 py-1">{r.data?.name ?? '—'}</td>
                        <td className="px-2 py-1">{r.data?.role ?? '—'}</td>
                        <td
                          className={`px-2 py-1 ${r.data ? 'text-muted-foreground' : 'text-destructive'}`}
                        >
                          {r.data ? 'พร้อม' : r.errors.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-1 rounded-[3px] border border-foreground/20 p-3">
              <p className="font-medium">
                เพิ่มสำเร็จ {result.created} คน
                {result.skipped.length > 0 &&
                  ` · ข้าม ${result.skipped.length} คน`}
              </p>
              {result.skipped.length > 0 && (
                <ul className="max-h-32 overflow-auto text-xs text-muted-foreground">
                  {result.skipped.map((s) => (
                    <li key={s.username}>
                      <span className="font-mono">{s.username}</span> —{' '}
                      {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ปิด
          </Button>
          <Button
            onClick={onImport}
            disabled={valid.length === 0 || importUsers.isPending}
          >
            {importUsers.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            นำเข้า {valid.length > 0 ? `${valid.length} คน` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
