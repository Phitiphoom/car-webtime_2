// src/components/trip-form/MainRoute.tsx
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCars } from '@/hooks/queries/useReferenceData';
import type { TripFormReturn } from '@/hooks/useTripForm';

export function MainRoute({ form }: { form: TripFormReturn }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const { data: cars } = useCars();

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">เส้นทางหลัก</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startPoint">จุดเริ่มต้น</Label>
          <Input
            id="startPoint"
            {...register('startPoint')}
            placeholder="เช่น โรงงาน 1"
          />
          {errors.startPoint && (
            <p className="text-xs text-destructive">
              {errors.startPoint.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endPoint">จุดหมาย</Label>
          <Input
            id="endPoint"
            {...register('endPoint')}
            placeholder="เช่น คลังสินค้ากลาง"
          />
          {errors.endPoint && (
            <p className="text-xs text-destructive">
              {errors.endPoint.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="date">วันที่</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && (
            <p className="text-xs text-destructive">{errors.date.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">เวลา</Label>
          <Input id="time" type="time" {...register('time')} />
        </div>
        <div className="space-y-1.5">
          <Label>รถ</Label>
          <Controller
            control={control}
            name="carId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรถ" />
                </SelectTrigger>
                <SelectContent>
                  {(cars ?? []).map((car) => (
                    <SelectItem key={car.id} value={String(car.id)}>
                      {car.brand.name} {car.model} ({car.plateNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.carId && (
            <p className="text-xs text-destructive">{errors.carId.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
