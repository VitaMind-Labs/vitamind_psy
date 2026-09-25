const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const API_BASE = `${configuredApiUrl.replace(/\/$/, "")}/api`;
export const TOKEN_COOKIE = "vitamind_token";
export const REFRESH_TOKEN_COOKIE = "psychologist_refresh_token";
export const AUTH_ENDPOINTS = {
  LOGIN: "/v1/auth/psychologist/login",
  REFRESH: "/v1/auth/psychologist/refresh",
  LOGOUT: "/v1/auth/psychologist/logout",
} as const;
