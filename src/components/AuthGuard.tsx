// src/components/AuthGuard.tsx
'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type AuthGuardProps = {
  children: ReactNode;
  requiredRole?: 'admin' | 'approver' | 'user' | undefined;
};

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  // เพิ่ม state นี้เพื่อตรวจสอบว่า component ได้ mount บนฝั่ง client แล้วหรือยัง
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // ตั้งค่า isMounted เป็น true เมื่อ component mount บนฝั่ง client
    setIsMounted(true);

    if (!isLoading) {
      // ถ้าไม่มี user ให้ redirect ไปหน้า login
      if (!user) {
        const currentPath = window.location.pathname;
        router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      // ถ้ามีการกำหนด role ที่ต้องการ และ user ไม่มีสิทธิ์นั้น
      if (
        requiredRole &&
        user.role !== requiredRole &&
        !(requiredRole === 'approver' && user.role === 'admin')
      ) {
        // admin สามารถเข้าถึงทุกหน้าได้
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router, requiredRole]);

  // หากยังไม่ได้ mount หรืออยู่ในสถานะ loading ให้แสดงหน้าว่างเปล่า (แก้ไขปัญหา hydration)
  if (!isMounted) {
    return null;
  }

  // แสดง loading state หลังจาก mount แล้ว
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // ถ้าไม่มี user หรือไม่มีสิทธิ์ ให้ไม่แสดง children
  if (
    !user ||
    (requiredRole &&
      user.role !== requiredRole &&
      !(requiredRole === 'approver' && user.role === 'admin'))
  ) {
    return null;
  }

  // ถ้ามีสิทธิ์เข้าถึง ให้แสดง children
  return <>{children}</>;
};
