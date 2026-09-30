import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { psychologistApi } from "@/lib/api/psychologist";

/** Reports are reviewed in the queue; open the linked one expanded (unknown or foreign ids 404). */
export default async function WeeklyReportRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await psychologistApi.getWeeklyReport(id);
  } catch (error) {
    if (error instanceof ApiError && [400, 403, 404].includes(error.status)) notFound();
    throw error;
  }
  redirect(`/dashboard/reports?report=${encodeURIComponent(id)}`);
}
