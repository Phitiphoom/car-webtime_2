'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { fetchWithAuth } from '@/lib/api';
import {
  PlusCircle,
  Trash,
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="max-w-md bg-white dark:bg-gray-800 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 text-lg font-semibold">
                Access Denied
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Only MIS department members can access user management.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                asChild
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                <Link href="/dashboard">Return to Dashboard</Link>
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-900 dark:text-white">
              Loading user data...
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Render error state
  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <AlertTriangle className="text-red-600 dark:text-red-400" />
                  Error Loading Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                >
                  Try Again
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-blue-900 text-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-white">
                User Management
              </h1>
              <p className="text-sm text-gray-300">
                Manage system users (MIS department only)
              </p>
            </div>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="bg-white text-blue-900 hover:bg-gray-100 rounded-md"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Search & actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-md">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800 rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create New User
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 dark:text-gray-400">
                    Add a new user to the system. They can log in with these
                    credentials.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                  {formError && (
                    <div className="p-3 text-sm bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 rounded-md">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Username *
                    </Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                      className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="department"
                      className="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Department *
                    </Label>
                    <Select
                      value={newDepartment}
                      onValueChange={setNewDepartment}
                      required
                    >
                      <SelectTrigger
                        id="department"
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
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
                      className="border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-md"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create User'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users table */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
                System Users
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                {filteredUsers.length} users found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Username
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Last Login
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.ID}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {user.USERNAME}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {user.NAME}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {user.EMAIL || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {user.DEPARTMENT}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {formatDate(user.CREATED_AT)}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {formatDate(user.LASTACTION)}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
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

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </AuthGuard>
  );
}
