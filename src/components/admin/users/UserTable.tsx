// src/components/admin/users/UserTable.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RoleBadge } from './RoleBadge';
import { EditUserDialog } from './EditUserDialog';
import { Edit, RotateCcw, Trash2 } from 'lucide-react';
import { useDeactivateUser, useUpdateUser } from '@/hooks/queries/useUsers';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { UserDTO } from '@/server/users/user.schema';

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ';

export function UserTable({ users }: { users: UserDTO[] }) {
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [deleting, setDeleting] = useState<UserDTO | null>(null);
  const deactivateUser = useDeactivateUser();
  const updateUser = useUpdateUser();

  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        ไม่พบผู้ใช้
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed min-w-[760px]">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[22%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-dashed border-foreground/25 text-left text-muted-foreground">
              <th className="py-2 px-4 font-medium text-xs">ชื่อ</th>
              <th className="py-2 px-4 font-medium text-xs">อีเมล</th>
              <th className="py-2 px-4 font-medium text-xs">แผนก</th>
              <th className="py-2 px-4 font-medium text-xs">สิทธิ์</th>
              <th className="py-2 px-4 font-medium text-xs">สถานะ</th>
              <th className="py-2 px-4 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-foreground/20">
            {users.map((user) => (
              <tr
                key={user.id}
                className={`hover:bg-muted/50 ${user.isActive ? '' : 'opacity-60'}`}
              >
                <td className="py-2.5 px-4 truncate">{user.name}</td>
                <td className="py-2.5 px-4 text-muted-foreground truncate">
                  {user.email || '—'}
                </td>
                <td className="py-2.5 px-4 truncate">
                  {user.department || '—'}
                </td>
                <td className="py-2.5 px-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="py-2.5 px-4 text-xs font-medium">
                  {user.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                </td>
                <td className="py-2.5 px-4 text-right whitespace-nowrap">
                  {user.isActive ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingUser(user)}
                        aria-label="แก้ไขผู้ใช้"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleting(user)}
                        aria-label="ปิดใช้งานผู้ใช้"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      disabled={updateUser.isPending}
                      onClick={() =>
                        updateUser.mutate(
                          { id: user.id, input: { isActive: true } },
                          {
                            onSuccess: () => toast.success('กู้คืนผู้ใช้แล้ว'),
                            onError: (err) => toast.error(errorMessage(err)),
                          }
                        )
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
        open={!!deleting}
        title="ปิดใช้งานผู้ใช้นี้?"
        description={
          deleting
            ? `${deleting.name} จะล็อกอินไม่ได้และไม่แสดงในรายชื่อผู้อนุมัติ ประวัติทริปเดิมไม่หาย และกู้คืนได้ภายหลัง`
            : ''
        }
        confirmLabel="ปิดใช้งาน"
        loading={deactivateUser.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          deactivateUser.mutate(deleting.id, {
            onSuccess: () => {
              toast.success('ปิดใช้งานผู้ใช้แล้ว');
              setDeleting(null);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}
    </>
  );
}
