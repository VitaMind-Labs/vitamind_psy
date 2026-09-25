"use client";

import { useCallback } from "react";
import { getDashboardServer } from "@/features/dashboard/actions";
import type { DashboardResponse } from "@/lib/api/psychologist";
import { useApiData } from "@/hooks/use-api-data";

export function useDashboard(initialData: DashboardResponse) {
  const fetcher = useCallback(() => getDashboardServer(), []);
  return useApiData(fetcher, initialData);
}
