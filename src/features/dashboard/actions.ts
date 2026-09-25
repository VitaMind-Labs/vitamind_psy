"use server";

import { psychologistApi } from "@/lib/api/psychologist";

export async function getDashboardServer() {
  return psychologistApi.getDashboard();
}
