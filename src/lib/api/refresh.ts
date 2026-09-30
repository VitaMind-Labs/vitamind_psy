import { API_BASE, AUTH_ENDPOINTS, REFRESH_TOKEN_COOKIE } from "@/lib/api/config";

/**
 * Session refresh shared by the API client and the route proxy (no `next/headers`).
 *
 * The backend rotates the refresh token and treats the re-use of a rotated
 * token as theft (every session of the clinician is revoked). Parallel requests
 * that hit an expired access token must therefore share ONE refresh call per
 * token, and the rotated refresh token must be stored.
 */

export interface RefreshedSession {
  accessToken: string;
  refreshToken?: string;
}

const isProd = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 15 * 60,
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

const REUSE_WINDOW_MS = 30_000;
const refreshes = new Map<string, Promise<RefreshedSession | null>>();

function rotatedRefreshToken(res: Response): string | undefined {
  const headers = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const header of headers) {
    const pair = header.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0 && pair.slice(0, eq).trim() === REFRESH_TOKEN_COOKIE) {
      const value = decodeURIComponent(pair.slice(eq + 1).trim());
      if (value) return value;
    }
  }
  return undefined;
}

async function callRefresh(refreshToken: string): Promise<RefreshedSession | null> {
  try {
    const res = await fetch(`${API_BASE}${AUTH_ENDPOINTS.REFRESH}`, {
      method: "POST",
      headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const payload = (await res.json().catch(() => null)) as
      | { data?: { access_token?: string; refresh_token?: string }; access_token?: string; refresh_token?: string }
      | null;
    const body = payload?.data ?? payload;
    if (!body?.access_token) return null;
    return { accessToken: body.access_token, refreshToken: rotatedRefreshToken(res) ?? body.refresh_token };
  } catch {
    return null;
  }
}

export function refreshSession(refreshToken: string): Promise<RefreshedSession | null> {
  const existing = refreshes.get(refreshToken);
  if (existing) return existing;
  const pending = callRefresh(refreshToken);
  refreshes.set(refreshToken, pending);
  // Requests still carrying the old cookie reuse the result instead of replaying a revoked token.
  void pending.finally(() => setTimeout(() => refreshes.delete(refreshToken), REUSE_WINDOW_MS));
  return pending;
}
