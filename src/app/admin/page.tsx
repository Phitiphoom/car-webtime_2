// src/app/admin/page.tsx
'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, User } from 'lucide-react';

// Department and CarBrand don't get their own admin screens — both are
// created implicitly by upsert-on-name when an admin adds a driver/car with
// a name that doesn't exist yet (see DriverService.create / CarService.create),
// and departments come only from the official SAP list. A standalone "add department"/"add
// brand" screen would just duplicate that with no real purpose.
const SECTIONS = [
  {
    href: '/admin/users',
    label: 'ผู้ใช้',
    description: 'จัดการบัญชีผู้ใช้และสิทธิ์',
    icon: Users,
  },
  {
    href: '/admin/cars',
    label: 'รถ',
    description: 'จัดการข้อมูลรถในระบบ',
    icon: Car,
  },
  {
    href: '/admin/drivers',
    label: 'คนขับ',
    description: 'จัดการรายชื่อคนขับ',
    icon: User,
  },
];

export default function AdminHubPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <AppShell title="จัดการระบบ">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="border-border shadow-none hover:border-primary/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-medium">
                    {section.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
