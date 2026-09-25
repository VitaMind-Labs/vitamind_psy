"use client";

import { useCallback } from "react";
import { getPsychologistProfileServer } from "@/features/psychologist/actions";
import type { PsychologistProfile } from "@/lib/api/psychologist";
import { useApiData } from "@/hooks/use-api-data";

export function useProfile(initialData: PsychologistProfile) {
  const fetcher = useCallback(() => getPsychologistProfileServer(), []);
  return useApiData(fetcher, initialData);
}
