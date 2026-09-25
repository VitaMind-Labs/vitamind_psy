import { redirect } from "next/navigation";

/** Reports are reviewed in the queue; open the linked one expanded. */
export default async function WeeklyReportRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/reports?report=${encodeURIComponent(id)}`);
}
