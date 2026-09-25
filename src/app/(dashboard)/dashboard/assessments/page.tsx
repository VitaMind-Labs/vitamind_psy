import { psychologistApi, type AssessmentListItem } from "@/lib/api/psychologist";
import { AssessmentsIndex } from "@/features/assessments/components/AssessmentsIndex";

export default async function AssessmentsPage() {
  const patients = await psychologistApi.listPatients({ page: 1, limit: 100, sortBy: "lastActivityAt", sortOrder: "desc" });
  // One unreachable record must not take the whole review queue down.
  const results = await Promise.allSettled(patients.data.map((patient) => psychologistApi.listAssessments(patient.id, { page: 1, limit: 20 })));
  const groups = patients.data.map((patient, index) => {
    const result = results[index];
    return { patient, assessments: result.status === "fulfilled" ? result.value.data : ([] as AssessmentListItem[]) };
  });
  const failed = results.filter((result) => result.status === "rejected").length;
  return <AssessmentsIndex groups={groups} failedCount={failed} />;
}
