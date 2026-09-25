import { redirect } from "next/navigation";

/** Assessments are reviewed inside the patient record; keep old deep links working. */
export default async function AssessmentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ patientId?: string }> }) {
  const [{ id }, { patientId }] = await Promise.all([params, searchParams]);
  redirect(patientId ? `/dashboard/patients/${patientId}?tab=assessments&assessmentId=${id}` : "/dashboard/assessments");
}
