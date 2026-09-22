// src/app/login/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { CarIcon } from '@/components/icons/CarIcon';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, isLoading, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl');

  // State untuk mengontrol rendering
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect jika sudah login
  useEffect(() => {
    if (user) {
      window.location.href = callbackUrl || '/dashboard';
    }
  }, [user, callbackUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!username || !password) {
      setLocalError('กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : 'การเข้าสู่ระบบล้มเหลว กรุณาลองอีกครั้ง'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state dengan rendering bersyarat
  if (!isClient || (isLoading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center border-t-[3px] border-sidebar-accent bg-[hsl(36_22%_82%)] p-4 dark:bg-[hsl(28_10%_9%)]">
      {/* The sign-in page is a sheet of paper laid on the dark desk. */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[3px] border border-foreground/30 bg-card text-card-foreground shadow-[5px_5px_0_0_hsl(var(--foreground)/0.16)]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-double border-foreground/30 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[3px] border-2 border-primary text-primary">
              <CarIcon className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-mono text-[13px] font-medium tracking-[0.18em]">
                SNC
              </span>
              <span className="block font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                CAR RESERVATION
              </span>
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          <h2 className="text-xl font-medium">เข้าสู่ระบบ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ใช้ชื่อผู้ใช้และรหัสผ่านของบริษัท
          </p>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            {localError && (
              <div
                role="alert"
                className="rounded-[3px] border border-destructive/40 border-l-4 border-l-destructive bg-destructive/5 p-3 text-sm text-destructive"
              >
                {localError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your.username"
                disabled={isSubmitting}
                autoComplete="username"
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                autoComplete="current-password"
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </Button>
          </form>
        </div>

        <p className="border-t border-dashed border-foreground/25 px-6 py-3 text-center text-xs text-muted-foreground">
          มีปัญหาในการเข้าสู่ระบบ? กรุณาติดต่อฝ่าย IT
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
