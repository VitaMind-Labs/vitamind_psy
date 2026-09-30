"use server";

import { clearAuthCookies } from "@/lib/api/api-client";
import { psychologistApi, type PsychologistAuthUser, type PsychologistRegisterDto, type PsychologistRegistrationResponse, type TwoFactorEnrollment } from "@/lib/api/psychologist";

const CLINICIAN_ROLES = ["PSYCHIATRIST", "PSYCHOLOGIST", "THERAPIST", "NURSE", "CARE_COORDINATOR"];

export type LoginResult =
  | { success: true; user: PsychologistAuthUser }
  | { success: false; error: string }
  | { requires2fa: true; tempToken: string }
  | { requires2faSetup: true; setupToken: string };

export async function loginPsychologist(email: string, password: string): Promise<LoginResult> {
  if (!email || !password) {
    return { success: false, error: "Enter your email address and password." };
  }

  try {
    const response = await psychologistApi.login({ email, password });
    if ("requires_2fa" in response) {
      return { requires2fa: true, tempToken: response.temp_token };
    }
    if ("requires_2fa_setup" in response) {
      return { requires2faSetup: true, setupToken: response.setup_token };
    }
    if (!CLINICIAN_ROLES.includes(response.user.role)) {
      await clearAuthCookies();
      return { success: false, error: "This account is not authorized to access the clinician portal." };
    }
    return { success: true, user: response.user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign-in failed. Please try again.",
    };
  }
}

export async function verifyPsychologist2fa(
  tempToken: string,
  token: string,
): Promise<{ success: true; user: PsychologistAuthUser } | { success: false; error: string }> {
  try {
    const response = await psychologistApi.login2fa({ temp_token: tempToken, token: token.trim().toUpperCase() });
    if (!CLINICIAN_ROLES.includes(response.user.role)) {
      await clearAuthCookies();
      return { success: false, error: "This account is not authorized to access the clinician portal." };
    }
    return { success: true, user: response.user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verification failed. Please try again.",
    };
  }
}

export async function enablePsychologist2fa(
  setupToken?: string,
): Promise<{ success: true; enrollment: TwoFactorEnrollment } | { success: false; error: string }> {
  try {
    const enrollment = await psychologistApi.enable2fa(setupToken);
    return { success: true, enrollment };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not start two-factor enrolment.",
    };
  }
}

export async function confirmPsychologist2fa(
  token: string,
  setupToken?: string,
): Promise<{ success: true; user: PsychologistAuthUser; backupCodes: string[] } | { success: false; error: string }> {
  try {
    const response = await psychologistApi.confirm2fa(token.trim(), setupToken);
    return { success: true, user: response.user, backupCodes: response.backup_codes ?? [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verification failed. Please try again.",
    };
  }
}

export async function registerPsychologist(dto: PsychologistRegisterDto): Promise<{ success: true; data: PsychologistRegistrationResponse } | { success: false; error: string }> {
  if (!dto.email || !dto.password || !dto.firstName || !dto.lastName || !dto.licenseNumber || !dto.termsAccepted || !dto.safetyAlertsAccepted || !dto.monitoringNoticeAccepted) {
    return { success: false, error: "Complete the required fields and accept the terms." };
  }
  try {
    return { success: true, data: await psychologistApi.register(dto) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not create this account." };
  }
}

export async function logoutPsychologist(): Promise<void> {
  try {
    await psychologistApi.logout();
  } catch {
    await clearAuthCookies();
  }
}
