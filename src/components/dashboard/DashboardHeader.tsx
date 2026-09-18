/* -------------------------------------------------------------------------- */
/*  File: src/components/DashboardHeader.tsx                                  */
/*  เฮดเดอร์ของหน้าแดชบอร์ด                                                 */
/* -------------------------------------------------------------------------- */
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/hooks/useAuth';

export function DashboardHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  /* ฟังก์ชันออกจากระบบ */
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo และชื่อระบบ */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  SNC Car Reservation
                </h1>
                <p className="text-sm text-muted-foreground">ระบบจองรถยนต์</p>
              </div>
            </div>
          </div>

          {/* ปุ่มและเมนูผู้ใช้ */}
          <div className="flex items-center space-x-4">
            {/* ปุ่มบันทึกทริปใหม่ */}
            <Button asChild variant="default" size="sm">
              <Link href="/log-usage">
                <Car className="mr-2 h-4 w-4" />
                บันทึกทริป
              </Link>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Dropdown Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.department}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.department === 'MIS' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users">
                          <User className="mr-2 h-4 w-4" />
                          <span>จัดการผู้ใช้</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ออกจากระบบ</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
