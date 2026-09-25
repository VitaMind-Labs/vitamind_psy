"use client";

import { useCallback } from "react";
import { getPatientsServer } from "@/features/patients/actions/patients";
import type { PaginatedResponse, PatientListItem, PatientListQueryDto } from "@/lib/api/psychologist";
import { useApiData } from "@/hooks/use-api-data";

export function usePatients(initialData: PaginatedResponse<PatientListItem>, filters?: PatientListQueryDto) {
  const fetcher = useCallback(() => getPatientsServer(filters), [filters]);
  return useApiData(fetcher, initialData);
}
