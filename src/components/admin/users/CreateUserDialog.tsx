// src/components/admin/users/CreateUserDialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { CreateUserSchema, CreateUserInput } from '@/server/users/user.schema';
import { useCreateUser } from '@/hooks/queries/useUsers';
import { ROLES } from '@/server/shared/enums';

const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
  ADMIN: 'แอดมิน',
  APPROVER: 'ผู้อนุมัติ',
  USER: 'พนักงาน',
};

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { role: 'USER' },
  });

  const onSubmit = handleSubmit((values) => {
    createUser.mutate(values, {
      onSuccess: () => {
        toast.success('เพิ่มผู้ใช้แล้ว');
        reset();
        setOpen(false);
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : 'เพิ่มผู้ใช้ไม่สำเร็จ'
        ),
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มผู้ใช้
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="username">ชื่อผู้ใช้</Label>
            <Input id="username" {...register('username')} />
            {errors.username && (
              <p className="text-xs text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">ชื่อ-นามสกุล</Label>
            <Input id="name" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" {...register('email')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department">แผนก (ไม่บังคับ)</Label>
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
            {errors.department && (
              <p className="text-xs text-destructive">
                {errors.department.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>สิทธิ์</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              เพิ่มผู้ใช้
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
