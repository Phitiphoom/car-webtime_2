// src/components/admin/drivers/DriverTable.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';
import {
  useDeactivateDriver,
  useRestoreDriver,
  type DriverOption,
} from '@/hooks/queries/useReferenceData';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ';

export function DriverTable({ drivers }: { drivers: DriverOption[] }) {
  const deactivateDriver = useDeactivateDriver();
  const restoreDriver = useRestoreDriver();
  const [target, setTarget] = useState<DriverOption | null>(null);

  if (drivers.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีคนขับในระบบ
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-dashed border-foreground/25 text-left text-muted-foreground">
              <th className="py-2 px-4 font-medium text-xs">ชื่อ</th>
              <th className="py-2 px-4 font-medium text-xs">แผนก</th>
              <th className="py-2 px-4 font-medium text-xs">เบอร์โทร</th>
              <th className="py-2 px-4 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-foreground/20">
            {drivers.map((driver) => (
              <tr
                key={driver.id}
                className={`hover:bg-muted/50 ${driver.isActive ? '' : 'opacity-60'}`}
              >
                <td className="py-2.5 px-4">
                  {driver.name}
                  {!driver.isActive && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (ปิดใช้งาน)
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">
                  {driver.department?.name || '—'}
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">
                  {driver.phone || '—'}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {driver.isActive ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setTarget(driver)}
                      aria-label="ปิดใช้งานคนขับ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      disabled={restoreDriver.isPending}
                      onClick={() =>
                        restoreDriver.mutate(driver.id, {
                          onSuccess: () => toast.success('กู้คืนคนขับแล้ว'),
                          onError: (err) => toast.error(errorMessage(err)),
                        })
                      }
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      กู้คืน
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!target}
        title="ปิดใช้งานคนขับคนนี้?"
        description={
          target
            ? `${target.name} จะไม่แสดงในฟอร์มบันทึกการใช้รถ ประวัติทริปเดิมไม่หาย และกู้คืนได้ภายหลัง`
            : ''
        }
        confirmLabel="ปิดใช้งาน"
        loading={deactivateDriver.isPending}
        onClose={() => setTarget(null)}
        onConfirm={() =>
          target &&
          deactivateDriver.mutate(target.id, {
            onSuccess: () => {
              toast.success('ปิดใช้งานคนขับแล้ว');
              setTarget(null);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </>
  );
}
