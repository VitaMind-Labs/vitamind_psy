"use server";

import { psychologistApi } from "@/lib/api/psychologist";

export async function markNotificationReadServer(notificationId: string) {
  return psychologistApi.markNotificationRead(notificationId);
}

export async function markAllNotificationsReadServer() {
  return psychologistApi.markAllNotificationsRead();
}
