"use server";

import { psychologistApi } from "@/lib/api/psychologist";

export async function getPsychologistProfileServer() {
  return psychologistApi.getMe();
}
