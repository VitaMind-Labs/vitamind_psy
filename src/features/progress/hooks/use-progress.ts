"use client";

import { useCallback } from "react";
import { getPatientProgressServer } from "@/features/progress/actions";
import type { ProgressResponse } from "@/lib/api/psychologist";
import { useApiData } from "@/hooks/use-api-data";

export function useProgress(patientId: string, initialData: ProgressResponse) {
  const fetcher = useCallback(() => getPatientProgressServer(patientId), [patientId]);
  return useApiData(fetcher, initialData);
}
