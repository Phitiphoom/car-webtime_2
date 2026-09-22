// src/hooks/useAuth.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { UserDTO } from '@/server/users/user.schema';

// The JWT now lives in an httpOnly cookie the server sets on login — the
// client never sees or stores the token itself (the old code kept a copy in
// localStorage AND a JS-writable cookie, which was both a duplication/sync
// risk and an XSS token-theft exposure). Session state here is just "who
// does the server say is logged in," fetched via GET /api/auth/me.
type AuthContextType = {
  user: UserDTO | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
});

const ME_QUERY_KEY = ['auth', 'me'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        return await api.get<UserDTO>('/api/auth/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  const login = async (username: string, password: string) => {
    const { user: loggedInUser } = await api.post<{ user: UserDTO }>(
      '/api/auth/login',
      {
        username,
        password,
      }
    );
    queryClient.setQueryData(ME_QUERY_KEY, loggedInUser);

    const searchParams = new URLSearchParams(window.location.search);
    router.push(searchParams.get('callbackUrl') || '/dashboard');
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    queryClient.setQueryData(ME_QUERY_KEY, null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: queryError instanceof Error ? queryError.message : null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
