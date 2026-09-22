// src/components/admin/users/EditUserDialog.tsx
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DepartmentCombobox } from '@/components/shared/DepartmentCombobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  UpdateUserSchema,
  UpdateUserInput,
  UserDTO,
} from '@/server/users/user.schema';
import { useUpdateUser } from '@/hooks/queries/useUsers';
import { ROLES } from '@/server/shared/enums';

const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
  ADMIN: 'แอดมิน',
  APPROVER: 'ผู้อนุมัติ',
  USER: 'พนักงาน',
};

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    values: {
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      isActive: user.isActive,
    },
  });

  const onSubmit = handleSubmit((values) => {
    updateUser.mutate(
      { id: user.id, input: values },
      {
        onSuccess: () => {
          toast.success('บันทึกการแก้ไขแล้ว');
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ'),
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แก้ไขผู้ใช้ — {user.username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">ชื่อ-นามสกุล</Label>
            <Input id="edit-name" {...register('name')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">อีเมล</Label>
            <Input id="edit-email" type="email" {...register('email')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-department">แผนก</Label>
            <Controller
              control={control}
              name="department"
              render={({ field }) => (
                <DepartmentCombobox
                  id="edit-department"
                  value={field.value}
                  onChange={field.onChange}
                  clearable
                />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-password">รหัสผ่านใหม่ (ไม่บังคับ)</Label>
            <Input
              id="edit-password"
              type="password"
              {...register('password')}
            />
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
          <div className="flex items-center gap-2 pt-1">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Checkbox
                  id="edit-active"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              )}
            />
            <Label htmlFor="edit-active">ใช้งานอยู่</Label>
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
