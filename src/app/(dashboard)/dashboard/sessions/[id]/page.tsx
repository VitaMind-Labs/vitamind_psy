import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/errors";
import { psychologistApi, type SessionDetailResponse } from "@/lib/api/psychologist";

const fmt = (value: string | null) => (value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session: SessionDetailResponse;
  try {
    session = await psychologistApi.getSession(id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403 || error.status === 400)) notFound();
    throw error;
  }

  return (
    <div className="space-y-5">
      <Link href="/dashboard/sessions" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0f766e] hover:underline">
        <ArrowLeft size={15} /> Back to sessions
      </Link>
      <section className="dashboard-card space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#0f172a]">{session.patient.name}</h1>
            <p className="mt-1 text-sm text-[#64748b]">
              {session.patient.patientCode} ·{" "}
              <Link href={`/dashboard/patients/${session.patient.id}`} className="text-[#0f766e] hover:underline">
                Open patient record
              </Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="info">{session.type.replaceAll("_", " ")}</Badge>
            <Badge variant={session.status === "COMPLETED" ? "success" : "default"}>{session.status.replaceAll("_", " ")}</Badge>
          </div>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-[#64748b]"><CalendarClock size={13} /> Scheduled</dt>
            <dd className="mt-1 font-medium text-[#0f172a]">{fmt(session.scheduledAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Duration</dt>
            <dd className="mt-1 font-medium text-[#0f172a]">{session.durationMinutes} min</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-[#64748b]"><ClipboardCheck size={13} /> Completed</dt>
            <dd className="mt-1 font-medium text-[#0f172a]">{fmt(session.completedAt)}</dd>
          </div>
        </dl>
        {session.notes && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Preparation notes</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-[#334155]">{session.notes}</p>
          </div>
        )}
        {session.summary && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Session summary</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-[#334155]">{session.summary}</p>
          </div>
        )}
        {session.followUpRequired && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Follow-up required{session.followUpDate ? ` by ${fmt(session.followUpDate)}` : ""}.</p>
        )}
      </section>
    </div>
  );
}
