"use client";

import { useCallback } from "react";
import { getNotificationsServer } from "@/features/notifications/actions/notifications";
import type { PsychologistNotification } from "@/lib/api/psychologist";
import { useApiData } from "@/hooks/use-api-data";

export function useNotifications(initialData: PsychologistNotification[]) {
  const fetcher = useCallback(() => getNotificationsServer(), []);
  return useApiData(fetcher, { data: initialData });
}
