export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000/api";
export const TOKEN_COOKIE = "vitamind_token";
export const REFRESH_TOKEN_COOKIE = "vitamind_refresh";
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/refresh",
} as const;
