// src/app/admin/users/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/users/UserTable';
import { CreateUserDialog } from '@/components/admin/users/CreateUserDialog';
import { ImportUsersDialog } from '@/components/admin/users/ImportUsersDialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { ShowInactiveToggle } from '@/components/admin/ConfirmDialog';
import { exportUsers } from '@/lib/users-excel';
import { useUsers } from '@/hooks/queries/useUsers';

export default function AdminUsersPage() {
  const [showInactive, setShowInactive] = useState(false);
  const { data: users, isLoading, error } = useUsers(showInactive);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <AuthGuard requiredRole="ADMIN">
      <AppShell title="จัดการผู้ใช้">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="ค้นหาชื่อหรือรหัสผู้ใช้"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 max-w-full"
            />
            <ShowInactiveToggle
              checked={showInactive}
              onChange={setShowInactive}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              disabled={!users?.length}
              onClick={() =>
                exportUsers(users ?? []).catch(() =>
                  toast.error('ส่งออกไม่สำเร็จ')
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              ส่งออก Excel
            </Button>
            <ImportUsersDialog />
            <CreateUserDialog />
          </div>
        </div>

        <Card className="border-border shadow-none">
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {error && (
              <div className="p-8 text-center text-sm text-destructive">
                ไม่สามารถโหลดรายชื่อผู้ใช้ได้
              </div>
            )}
            {!isLoading && !error && <UserTable users={filtered} />}
          </CardContent>
        </Card>
      </AppShell>
    </AuthGuard>
  );
}
