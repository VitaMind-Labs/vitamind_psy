"use client";

import { useCallback } from "react";
import { getPatientJournalServer } from "@/features/journal/actions";
import type { JournalListQueryDto, PaginatedResponse, JournalEntry } from "@/lib/api/psychologist";
import { useApiData } from "@/hooks/use-api-data";

export function useJournal(patientId: string, initialData: PaginatedResponse<JournalEntry>, filters?: JournalListQueryDto) {
  const fetcher = useCallback(() => getPatientJournalServer(patientId, filters), [patientId, filters]);
  return useApiData(fetcher, initialData);
}
