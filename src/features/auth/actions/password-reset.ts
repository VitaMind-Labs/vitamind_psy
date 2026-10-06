"use server";

import { passwordResetApi } from "@/lib/api/password-reset";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ForgotResult = { success: true } | { success: false; error: string };

export async function requestPasswordReset(email: string): Promise<ForgotResult> {
  const clean = email.trim();
  if (!EMAIL.test(clean) || clean.length > 254) return { success: false, error: "Enter a valid email address." };
  const result = await passwordResetApi.forgot(clean);
  // An unknown address and a known one both end here with success; only throttling and outages are reported.
  return result.ok ? { success: true } : { success: false, error: result.message };
}

export type ResetResult = { success: true } | { success: false; error: string; expired?: boolean };

export async function completePasswordReset(token: string, password: string, confirmPassword: string): Promise<ResetResult> {
  const result = await passwordResetApi.reset(token, password, confirmPassword);
  if (result.ok) return { success: true };
  return { success: false, error: result.message, expired: result.reason === "invalid" };
}
