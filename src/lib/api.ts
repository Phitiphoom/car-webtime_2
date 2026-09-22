// src/lib/api.ts
//
// Single fetch wrapper for all client-side API calls. Auth now travels via
// an httpOnly cookie set by the login route (src/app/api/auth/login/route.ts)
// instead of a token read out of localStorage — the browser attaches the
// cookie automatically as long as `credentials: 'include'` is set, so there
// is no Authorization header to build here at all. This replaces both the
// old fetchWithAuth() and the several hooks that hand-rolled raw fetch()
// with duplicated 401-handling.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = '/login';
    }
    throw new ApiError('Authentication required', 401);
  }

  if (!response.ok) {
    let message = response.statusText || 'Request failed';
    try {
      const data = await response.json();
      message = typeof data.error === 'string' ? data.error : message;
    } catch {
      // response body wasn't JSON — fall back to statusText
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
