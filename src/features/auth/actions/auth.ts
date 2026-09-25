"use server";

import { clearAuthCookies } from "@/lib/api/api-client";
import { psychologistApi, type PsychologistAuthUser, type PsychologistRegisterDto, type PsychologistRegistrationResponse } from "@/lib/api/psychologist";

export type LoginResult =
  | { success: true; user: PsychologistAuthUser }
  | { success: false; error: string };

export async function loginPsychologist(email: string, password: string): Promise<LoginResult> {
  if (!email || !password) {
    return { success: false, error: "Enter your email address and password." };
  }

  try {
    const response = await psychologistApi.login({ email, password });
    if (!["PSYCHIATRIST", "PSYCHOLOGIST", "THERAPIST", "NURSE", "CARE_COORDINATOR"].includes(response.user.role)) {
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
