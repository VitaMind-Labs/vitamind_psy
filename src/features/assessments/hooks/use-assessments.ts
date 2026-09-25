"use client";

import { useCallback } from "react";
import { getPatientAssessmentsServer } from "@/features/assessments/actions/list";
import type { AssessmentListQueryDto, PaginatedResponse, AssessmentListItem } from "@/lib/api/psychologist";
import { useApiData } from "@/hooks/use-api-data";

export function useAssessments(patientId: string, initialData: PaginatedResponse<AssessmentListItem>, filters?: AssessmentListQueryDto) {
  const fetcher = useCallback(() => getPatientAssessmentsServer(patientId, filters), [patientId, filters]);
  return useApiData(fetcher, initialData);
}
