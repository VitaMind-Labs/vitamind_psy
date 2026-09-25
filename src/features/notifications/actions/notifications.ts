"use server";

import { psychologistApi } from "@/lib/api/psychologist";

export async function getNotificationsServer() {
  return psychologistApi.listNotifications();
}

export async function markNotificationReadServer(notificationId: string) {
  return psychologistApi.markNotificationRead(notificationId);
}
