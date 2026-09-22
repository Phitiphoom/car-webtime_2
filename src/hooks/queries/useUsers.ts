// src/hooks/queries/useUsers.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserDTO,
  ImportUserRow,
  ImportUsersResult,
} from '@/server/users/user.schema';

export function useUsers(includeInactive = false) {
  return useQuery({
    queryKey: ['admin', 'users', { includeInactive }],
    queryFn: () =>
      api.get<UserDTO[]>(
        `/api/admin/users${includeInactive ? '?includeInactive=1' : ''}`
      ),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api.post<UserDTO>('/api/admin/users', input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      api.put<UserDTO>(`/api/admin/users/${id}`, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useImportUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (users: ImportUserRow[]) =>
      api.post<ImportUsersResult>('/api/admin/users/import', { users }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
