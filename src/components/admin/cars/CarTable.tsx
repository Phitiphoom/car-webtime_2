// src/components/admin/cars/CarTable.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';
import {
  useDeactivateCar,
  useRestoreCar,
  type CarOption,
} from '@/hooks/queries/useReferenceData';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ';

export function CarTable({ cars }: { cars: CarOption[] }) {
  const deactivateCar = useDeactivateCar();
  const restoreCar = useRestoreCar();
  const [target, setTarget] = useState<CarOption | null>(null);

  if (cars.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีรถในระบบ
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="border-b border-dashed border-foreground/25 text-left text-muted-foreground">
              <th className="py-2 px-4 font-medium text-xs">ยี่ห้อ/รุ่น</th>
              <th className="py-2 px-4 font-medium text-xs">ทะเบียน</th>
              <th className="py-2 px-4 font-medium text-xs">สี</th>
              <th className="py-2 px-4 font-medium text-xs">สถานะ</th>
              <th className="py-2 px-4 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-foreground/20">
            {cars.map((car) => (
              <tr
                key={car.id}
                className={`hover:bg-muted/50 ${car.isActive ? '' : 'opacity-60'}`}
              >
                <td className="py-2.5 px-4">
                  {car.brand.name} {car.model}
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">
                  {car.plateNumber}
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">
                  {car.color || '—'}
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">
                  {car.isActive ? car.status || '—' : 'ปิดใช้งาน'}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {car.isActive ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setTarget(car)}
                      aria-label="ปิดใช้งานรถ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      disabled={restoreCar.isPending}
                      onClick={() =>
                        restoreCar.mutate(car.id, {
                          onSuccess: () => toast.success('กู้คืนรถแล้ว'),
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
        title="ปิดใช้งานรถคันนี้?"
        description={
          target
            ? `${target.brand.name} ${target.model} (${target.plateNumber}) จะไม่แสดงในฟอร์มบันทึกการใช้รถ ประวัติทริปเดิมไม่หาย และกู้คืนได้ภายหลัง`
            : ''
        }
        confirmLabel="ปิดใช้งาน"
        loading={deactivateCar.isPending}
        onClose={() => setTarget(null)}
        onConfirm={() =>
          target &&
          deactivateCar.mutate(target.id, {
            onSuccess: () => {
              toast.success('ปิดใช้งานรถแล้ว');
              setTarget(null);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </>
  );
}
