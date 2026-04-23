// src/hooks/useAuth.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  token: null,
  isLoading: false,
  error: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ฟังก์ชันสำหรับดึง callback URL
  const getCallbackUrl = (): string => {
    if (typeof window !== 'undefined') {
      // ใช้ URLSearchParams แทน URL constructor เพื่อความเข้ากันได้ที่ดีกว่า
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('callbackUrl') || '/dashboard';
    }
    return '/dashboard';
  };

  useEffect(() => {
    const checkSession = () => {
      try {
        // ตรวจสอบ URL params เพื่อจัดการกับ error และ expired token
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          if (searchParams.get('expired') === 'true') {
            // ถ้ามี param expired=true แสดงว่า token หมดอายุ
            localStorage.removeItem('carWebtime_user');
            localStorage.removeItem('carWebtime_token');
            document.cookie =
              'carWebtime_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            setUser(null);
            setToken(null);
            setError('Your session has expired. Please log in again.');
            setIsLoading(false);
            return;
          }
        }

        const storedToken = localStorage.getItem('carWebtime_token');
        const storedUser = localStorage.getItem('carWebtime_user');

        if (storedUser && storedToken) {
          document.cookie = `carWebtime_token=${storedToken}; path=/; max-age=86400; samesite=strict`;
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('carWebtime_user');
        localStorage.removeItem('carWebtime_token');
        document.cookie =
          'carWebtime_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // src/hooks/useAuth.tsx (ส่วนของฟังก์ชัน login)
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // ตรวจสอบว่ามีการส่ง JSON ที่ถูกต้อง
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // ดึงข้อความตอบกลับออกมาเป็น text ก่อน
      const responseText = await res.text();

      // พยายาม parse เป็น JSON
      let data;
      try {
        data = JSON.parse(responseText);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Server response is not valid JSON');
      }

      // ตรวจสอบสถานะ และ data
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (!data.token) {
        throw new Error('No token received from server');
      }

      // จัดเก็บข้อมูลและ token
      localStorage.setItem('carWebtime_token', data.token);
      localStorage.setItem('carWebtime_user', JSON.stringify(data.user));
      document.cookie = `carWebtime_token=${data.token}; path=/; max-age=86400; samesite=strict`;

      setUser(data.user);
      setToken(data.token);

      const callbackUrl = getCallbackUrl();
      router.push(callbackUrl);
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('carWebtime_user');
    localStorage.removeItem('carWebtime_token');
    document.cookie =
      'carWebtime_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, token, isLoading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
