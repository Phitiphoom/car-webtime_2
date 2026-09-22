// src/components/trip-form/TripDetails.tsx
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApproverCombobox } from './ApproverCombobox';
import { DepartmentCombobox } from '@/components/shared/DepartmentCombobox';
import type { TripFormReturn } from '@/hooks/useTripForm';

export function TripDetails({ form }: { form: TripFormReturn }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="department">แผนก</Label>
        <Controller
          control={control}
          name="department"
          render={({ field }) => (
            <DepartmentCombobox
              id="department"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.department && (
          <p className="text-xs text-destructive">
            {errors.department.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="purposeText">วัตถุประสงค์</Label>
        <Textarea
          id="purposeText"
          rows={2}
          {...register('purposeText')}
          placeholder="เช่น ขนส่งสินค้าไปยังคลังกลางประจำสัปดาห์"
        />
      </div>

      <div className="space-y-1.5">
        <Label>ผู้อนุมัติ</Label>
        <p className="text-xs text-muted-foreground">
          เลือกได้หลายคน — ผู้อนุมัติคนใดคนหนึ่งตัดสินก็เพียงพอ
        </p>
        <Controller
          control={control}
          name="approverEmails"
          render={({ field }) => (
            <ApproverCombobox value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remark">หมายเหตุ</Label>
        <Textarea
          id="remark"
          rows={2}
          {...register('remark')}
          placeholder="ไม่บังคับ"
        />
      </div>
    </div>
  );
}
