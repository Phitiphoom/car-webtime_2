'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { fetchWithAuth } from '@/lib/api';
import {
  PlusCircle,
  Power,
  Edit,
  Search,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// User interface matching what the API returns
interface DatabaseUser {
  ID: number;
  USERNAME: string;
  NAME: string;
  EMAIL: string | null;
  DEPARTMENT: string;
  CREATED_AT: string;
  LASTACTION: string | null;
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New user form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user state
  const [editingUser, setEditingUser] = useState<DatabaseUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete user state
  const [deletingUser, setDeletingUser] = useState<DatabaseUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load users and departments
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch users and departments in parallel
        const [usersData, departmentsData] = await Promise.all([
          fetchWithAuth('/api/auth/users'),
          fetchWithAuth('/api/departments'),
        ]);

        setUsers(usersData);
        setDepartments(departmentsData);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Access control - only MIS department can access this page
  if (user && user.department !== 'MIS') {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-destructive text-lg font-semibold">
                ไม่มีสิทธิ์เข้าถึง
              </CardTitle>
              <CardDescription>
                เฉพาะแผนก MIS เท่านั้นที่สามารถจัดการผู้ใช้งานได้
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard">กลับไปแดชบอร์ด</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const searchFields = [
      user.USERNAME,
      user.NAME,
      user.EMAIL || '',
      user.DEPARTMENT,
    ].map((field) => field.toLowerCase());

    return searchFields.some((field) =>
      field.includes(searchQuery.toLowerCase())
    );
  });

  // Open edit dialog
  const openEditDialog = (dbUser: DatabaseUser) => {
    setEditingUser(dbUser);
    setEditName(dbUser.NAME);
    setEditEmail(dbUser.EMAIL || '');
    setEditDepartment(dbUser.DEPARTMENT);
    setEditPassword('');
    setEditError(null);
    setIsEditDialogOpen(true);
  };

  // Handle edit user submission
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setIsEditSubmitting(true);
    try {
      const body: Record<string, string> = {
        NAME: editName,
        DEPARTMENT: editDepartment,
      };
      if (editEmail) body.EMAIL = editEmail;
      if (editPassword) body.PASSWORD = editPassword;

      await fetchWithAuth(`/api/users/${editingUser.ID}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.ID === editingUser.ID
            ? {
                ...u,
                NAME: editName,
                EMAIL: editEmail || null,
                DEPARTMENT: editDepartment,
              }
            : u
        )
      );
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Failed to update user'
      );
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (dbUser: DatabaseUser) => {
    setDeletingUser(dbUser);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await fetchWithAuth(`/api/users/${deletingUser.ID}`, {
        method: 'DELETE',
      });
      setUsers((prev) => prev.filter((u) => u.ID !== deletingUser.ID));
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete user'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle form submission
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      // Validate form
      if (!newUsername || !newPassword || !newName || !newDepartment) {
        throw new Error('All fields except email are required');
      }
      // Refresh user list
      const updatedUsers = await fetchWithAuth('/api/auth/users');
      setUsers(updatedUsers);

      // Reset form and close dialog
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewEmail('');
      setNewDepartment('');
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error creating user:', err);
      setFormError(
        err instanceof Error ? err.message : 'Failed to create user'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-foreground">กำลังโหลดข้อมูลผู้ใช้งาน...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Render error state
  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <AlertTriangle className="text-destructive h-5 w-5" />
                  โหลดข้อมูลผู้ใช้งานไม่สำเร็จ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => window.location.reload()}>
                  ลองอีกครั้ง
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                จัดการผู้ใช้งาน
              </h1>
              <p className="text-sm text-muted-foreground">
                จัดการผู้ใช้งานระบบ (เฉพาะแผนก MIS)
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">แดชบอร์ด</Link>
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Search & actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ค้นหาผู้ใช้งาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  เพิ่มผู้ใช้งาน
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>สร้างผู้ใช้งานใหม่</DialogTitle>
                  <DialogDescription>
                    เพิ่มผู้ใช้งานใหม่เข้าระบบ
                    ผู้ใช้สามารถเข้าสู่ระบบด้วยข้อมูลนี้ได้
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                  {formError && (
                    <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="username">ชื่อผู้ใช้ *</Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">รหัสผ่าน *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                    <Input
                      id="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">แผนก *</Label>
                    <Select
                      value={newDepartment}
                      onValueChange={setNewDepartment}
                      required
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="เลือกแผนก" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังสร้าง...
                        </>
                      ) : (
                        'สร้างผู้ใช้งาน'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users table */}
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-foreground">
                ผู้ใช้งานทั้งหมด
              </CardTitle>
              <CardDescription>
                พบผู้ใช้งาน {filteredUsers.length} คน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        ชื่อผู้ใช้
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        ชื่อ-นามสกุล
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        อีเมล
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        แผนก
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        วันที่สร้าง
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        เข้าใช้งานล่าสุด
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          ไม่พบผู้ใช้งาน
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.ID}
                          className="border-b border-border last:border-none hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 text-foreground">
                            {user.USERNAME}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {user.NAME}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {user.EMAIL || '-'}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {user.DEPARTMENT}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {formatDate(user.CREATED_AT)}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {formatDate(user.LASTACTION)}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">แก้ไข</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Power className="h-4 w-4" />
                              <span className="sr-only">ปิดการใช้งาน</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขผู้ใช้งาน: {editingUser?.USERNAME}</DialogTitle>
            <DialogDescription>
              อัปเดตข้อมูลผู้ใช้งาน เว้นว่างช่องรหัสผ่านหากไม่ต้องการเปลี่ยน
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditUser} className="space-y-4 py-4">
            {editError && (
              <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                {editError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">ชื่อ-นามสกุล *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">อีเมล</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-department">แผนก *</Label>
              <Select
                value={editDepartment}
                onValueChange={setEditDepartment}
                required
              >
                <SelectTrigger id="edit-department">
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">รหัสผ่านใหม่</Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isEditSubmitting}>
                {isEditSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกการเปลี่ยนแปลง'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirm Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปิดการใช้งานผู้ใช้งาน</DialogTitle>
            <DialogDescription>
              ต้องการปิดการใช้งานของ{' '}
              <strong className="text-foreground">{deletingUser?.NAME}</strong>{' '}
              ({deletingUser?.USERNAME}) ใช่หรือไม่?
              ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้อีก จนกว่าจะเปิดการใช้งานใหม่
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
              {deleteError}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังปิดการใช้งาน...
                </>
              ) : (
                'ปิดการใช้งาน'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
