import { cookies } from "next/headers";
import { API_BASE, TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, AUTH_ENDPOINTS } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS, refreshSession } from "@/lib/api/refresh";

interface BackendResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
  statusCode?: number;
}

interface BackendErrorResponse {
  success?: false;
  message?: string | string[];
  error?: string;
  code?: string;
  statusCode?: number;
}

async function getCookieStore() {
  return cookies();
}

async function getAccessToken(): Promise<string | undefined> {
  const store = await getCookieStore();
  return store.get(TOKEN_COOKIE)?.value;
}

export function parseSetCookieFromHeader(setCookie: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!setCookie) return result;

  const parts = setCookie.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx > 0) {
      const key = part.substring(0, eqIdx).trim();
      const val = part.substring(eqIdx + 1).trim();
      if (
        key &&
        val &&
        !['Path', 'Domain', 'Max-Age', 'Expires', 'Secure', 'HttpOnly', 'SameSite'].includes(key)
      ) {
        result[key] = val;
      }
    }
  }

  return result;
}

function isWrappedResponse<T>(value: unknown): value is BackendResponse<T> {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'success' in value &&
    typeof (value as { success?: unknown }).success === 'boolean',
  );
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const { message, error } = payload as BackendErrorResponse;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return undefined;
}

async function parseResponseBody(res: Response): Promise<unknown | null> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

function unwrapResponseData<T>(payload: unknown): T | null {
  if (payload === null) return null;
  if (isWrappedResponse<T>(payload)) {
    return payload.success ? payload.data : null;
  }
  return payload as T;
}

export async function setAuthCookies(accessToken: string, refreshToken?: string) {
  const store = await getCookieStore();
  store.set(TOKEN_COOKIE, accessToken, ACCESS_COOKIE_OPTIONS);
  if (refreshToken) store.set(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
}

export async function clearAuthCookies() {
  const store = await getCookieStore();
  store.delete(TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const store = await getCookieStore();
    const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) return null;

    const session = await refreshSession(refreshToken);
    if (!session) return null;

    // Persist the rotated pair where cookies are writable (server actions / route handlers).
    // During a Server Component render they are read-only; the route proxy refreshes those requests.
    try {
      await setAuthCookies(session.accessToken, session.refreshToken);
    } catch {
      // read-only cookie store
    }
    return session.accessToken;
  } catch {
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        cache: 'no-store',
      });
    } else {
      throw new ApiError('Session expired. Please sign in again.', 401, 'UNAUTHORIZED');
    }
  }

  const payload = await parseResponseBody(res);

  if (!res.ok) {
    throw new ApiError(
      getErrorMessage(payload) || `Request failed with status ${res.status}`,
      (payload as BackendErrorResponse | null)?.statusCode || res.status,
      (payload as BackendErrorResponse | null)?.code,
    );
  }

  const data = unwrapResponseData<T>(payload);
  if (data === null) {
    throw new ApiError('The server returned an empty response.', res.status, 'EMPTY_RESPONSE');
  }
  return data;
}

export async function apiClientFormData<T>(
  endpoint: string,
  formData: FormData,
  method: string = 'POST',
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: formData,
    cache: 'no-store',
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: formData,
        cache: 'no-store',
      });
    } else {
      throw new ApiError('Session expired. Please sign in again.', 401, 'UNAUTHORIZED');
    }
  }

  const payload = await parseResponseBody(res);

  if (!res.ok) {
    throw new ApiError(
      getErrorMessage(payload) || 'Request failed',
      (payload as BackendErrorResponse | null)?.statusCode || res.status,
      (payload as BackendErrorResponse | null)?.code,
    );
  }

  const data = unwrapResponseData<T>(payload);
  if (data === null) {
    throw new ApiError('The server returned an empty response.', res.status, 'EMPTY_RESPONSE');
  }
  return data;
}
