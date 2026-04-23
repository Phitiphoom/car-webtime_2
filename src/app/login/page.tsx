// src/app/login/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CarIcon } from '@/components/icons/CarIcon';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, isLoading, user, error } = useAuth();
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

    try {
      await login(username, password);
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : 'การเข้าสู่ระบบล้มเหลว กรุณาลองอีกครั้ง'
      );
    }
  };

  // Loading state dengan rendering bersyarat
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <CarIcon className="h-10 w-10 text-primary" />
            <span className="ml-2 text-2xl font-bold text-foreground">
              SNC Car Reservation
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ใช้ข้อมูลเครือข่ายของบริษัท
          </p>
        </div>

        <Card className="shadow-lg red-theme-card red-theme-shadow">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {(localError || error) && (
                <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                  {localError || error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">ชื่อผู้ใช้</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your.username"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <Button type="submit" className="w-full red-accent-hover transition-all duration-200" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 bg-muted/50">
            <p className="text-xs text-center w-full text-muted-foreground">
              มีปัญหาในการเข้าสู่ระบบ? กรุณาติดต่อฝ่าย IT
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
