import { psychologistApi } from "@/lib/api/psychologist";
import { AssessmentsIndex } from "@/features/assessments/components/AssessmentsIndex";

export default async function AssessmentsPage() {
  // One request for the whole review queue (patients who share their diagnostics only).
  const queue = await psychologistApi.getAssessmentQueue(100);
  return <AssessmentsIndex queue={queue} />;
}
