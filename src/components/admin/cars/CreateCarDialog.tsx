// src/components/admin/cars/CreateCarDialog.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  CreateCarSchema,
  CreateCarInput,
} from '@/server/reference-data/car.schema';
import { useCreateCar } from '@/hooks/queries/useReferenceData';

export function CreateCarDialog() {
  const [open, setOpen] = useState(false);
  const createCar = useCreateCar();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCarInput>({ resolver: zodResolver(CreateCarSchema) });

  const onSubmit = handleSubmit((values) => {
    createCar.mutate(
      { ...values, year: values.year ? Number(values.year) : undefined },
      {
        onSuccess: () => {
          toast.success('เพิ่มรถแล้ว');
          reset();
          setOpen(false);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'เพิ่มรถไม่สำเร็จ'),
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มรถ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มรถใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="carCode">รหัสรถ</Label>
            <Input id="carCode" {...register('carCode')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand">ยี่ห้อ</Label>
            <Input
              id="brand"
              {...register('brand')}
              placeholder="เช่น Toyota"
            />
            {errors.brand && (
              <p className="text-xs text-destructive">{errors.brand.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">รุ่น</Label>
            <Input id="model" {...register('model')} />
            {errors.model && (
              <p className="text-xs text-destructive">{errors.model.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plateNumber">ทะเบียนรถ</Label>
            <Input id="plateNumber" {...register('plateNumber')} />
            {errors.plateNumber && (
              <p className="text-xs text-destructive">
                {errors.plateNumber.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="color">สี</Label>
              <Input id="color" {...register('color')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">ปี</Label>
              <Input
                id="year"
                type="number"
                {...register('year', { valueAsNumber: true })}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              เพิ่มรถ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
