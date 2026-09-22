// src/components/admin/drivers/CreateDriverDialog.tsx
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { DepartmentCombobox } from '@/components/shared/DepartmentCombobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import {
  CreateDriverSchema,
  CreateDriverInput,
} from '@/server/reference-data/driver.schema';
import { useCreateDriver } from '@/hooks/queries/useReferenceData';

export function CreateDriverDialog() {
  const [open, setOpen] = useState(false);
  const createDriver = useCreateDriver();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDriverInput>({ resolver: zodResolver(CreateDriverSchema) });

  const onSubmit = handleSubmit((values) => {
    createDriver.mutate(values, {
      onSuccess: () => {
        toast.success('เพิ่มคนขับแล้ว');
        reset();
        setOpen(false);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : 'เพิ่มคนขับไม่สำเร็จ'),
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มคนขับ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มคนขับใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="driverCode">รหัสคนขับ</Label>
            <Input id="driverCode" {...register('driverCode')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="driverName">ชื่อ-นามสกุล</Label>
            <Input id="driverName" {...register('driverName')} />
            {errors.driverName && (
              <p className="text-xs text-destructive">
                {errors.driverName.message}
              </p>
            )}
          </div>
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
                  clearable
                />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="licenseNumber">เลขใบขับขี่</Label>
            <Input id="licenseNumber" {...register('licenseNumber')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">เบอร์โทร</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" {...register('email')} />
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              เพิ่มคนขับ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
