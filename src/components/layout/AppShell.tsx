// src/components/layout/AppShell.tsx
//
// Sidebar app shell used by every authenticated page. Paper-ledger identity
// (approved style "แบบ B"): dark warm-ink sidebar with an SNC red stripe,
// cream paper content area, dashed rules instead of solid borders.
//
// Responsive: from `md` up the sidebar is a fixed column; below that it
// becomes an off-canvas drawer opened by the hamburger in the header.
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  LayoutDashboard,
  Route,
  Archive,
  PlusCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

const NAV_ITEMS = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/trips', label: 'Log ปัจจุบัน', icon: Route },
  { href: '/log-usage', label: 'บันทึกการใช้รถ', icon: PlusCircle },
  { href: '/legacy-trips', label: 'Log เก่า', icon: Archive },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'แอดมิน',
  APPROVER: 'ผู้อนุมัติ',
  USER: 'พนักงาน',
};

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer after navigating.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // While the drawer is open: Esc closes it and the page behind doesn't scroll.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  const items = [
    ...NAV_ITEMS,
    ...(user?.role === 'ADMIN'
      ? [{ href: '/admin', label: 'จัดการระบบ', icon: Settings }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[228px_1fr]">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden print:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar as a ledger binder: an index of numbered tabs, and the active
          tab drawn as the paper sheet itself pulled out to meet the page. */}
      <aside
        id="app-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto border-t-[3px] border-sidebar-accent bg-sidebar py-5 pl-4 text-sidebar-foreground transition-transform duration-200 print:hidden',
          'md:sticky md:top-0 md:h-screen md:w-auto md:translate-x-0 md:self-start',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-start justify-between pb-5 pr-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 rotate-[-4deg] items-center justify-center rounded-[3px] border-2 border-sidebar-accent text-sidebar-accent">
              <Car className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-mono text-[13px] font-medium tracking-[0.18em]">
                SNC
              </span>
              <span className="block font-mono text-[10px] tracking-[0.14em] text-sidebar-foreground/55">
                CAR WEBTIME
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded p-1 text-sidebar-foreground/70 hover:text-white md:hidden"
            aria-label="ปิดเมนู"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-1 border-b border-dashed border-sidebar-foreground/20 pb-1.5 pr-4 font-mono text-[10px] tracking-[0.2em] text-sidebar-foreground/45">
          INDEX · สารบัญ
        </p>

        <nav className="flex flex-1 flex-col">
          {items.map((item, i) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-2.5 border-b border-dashed border-sidebar-foreground/15 py-3 pl-2 pr-4 text-sm transition-colors md:py-2.5',
                  active
                    ? '-ml-2 rounded-l-[3px] border-l-[3px] border-l-sidebar-accent border-b-transparent bg-background pl-[13px] font-medium text-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <span
                  className={cn(
                    'w-5 font-mono text-[10px]',
                    active
                      ? 'text-sidebar-accent'
                      : 'text-sidebar-foreground/40'
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="mt-4 pr-4">
            <div className="border border-dashed border-sidebar-foreground/30 px-3 py-2.5">
              <p className="font-mono text-[10px] tracking-[0.2em] text-sidebar-foreground/45">
                ผู้ใช้งาน
              </p>
              <p className="mt-0.5 truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/55">
                {user.department || '—'}
              </p>
              <span className="mt-2 inline-block rotate-[-2deg] border border-sidebar-accent px-1.5 py-px font-mono text-[10px] tracking-widest text-sidebar-accent">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="mt-2 flex w-full items-center gap-2 px-1 py-1.5 text-xs text-sidebar-foreground/60 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              ออกจากระบบ
            </button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-end justify-between gap-3 border-b-[3px] border-double border-foreground/30 bg-background px-4 pt-3 md:px-6 md:pt-4 print:hidden">
          <div className="flex min-w-0 items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 mb-1 h-9 w-9 shrink-0 md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="เปิดเมนู"
              aria-expanded={drawerOpen}
              aria-controls="app-sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* The title sits on the rule like an index tab: paper-colored,
                red top edge, overlapping the double line beneath it. */}
            <div className="relative top-[3px] min-w-0 rounded-t-[3px] border border-b-0 border-t-[3px] border-foreground/30 border-t-primary bg-card px-4 py-2.5 shadow-[2px_-2px_0_0_hsl(var(--foreground)/0.06)]">
              <h1 className="truncate text-base font-medium md:text-lg">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pb-2">
            <ThemeToggle />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-none"
                  >
                    <Avatar className="h-8 w-8 rounded-sm">
                      <AvatarFallback className="rounded-sm bg-sidebar text-xs text-sidebar-foreground">
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
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ออกจากระบบ</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 pb-8 pt-4 md:px-6 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
