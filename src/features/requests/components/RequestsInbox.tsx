"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import { Check, Clock, Inbox, ShieldCheck, UserCheck, UserRoundPlus, X } from "lucide-react";
import { acceptAssignmentRequest, declineAssignmentRequest } from "@/features/requests/actions";
import type { AssignmentRequest, AssignmentRequestList, AssignmentRequestView } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardPageHeader } from "@/components/layout/DashboardUI";
import { KpiCell, KpiGrid, Panel, Segmented } from "@/components/layout/Kpi";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import { PatientAvatar } from "@/features/dashboard/components/overview/PracticeOverview";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

const HOUR = 3_600_000;
const LATE_AFTER_HOURS = 48;
const REASON_MAX = 300;

const VIEWS: ReadonlyArray<{ value: AssignmentRequestView; label: string }> = [
  { value: "AWAITING_ME", label: "Waiting for you" },
  { value: "AWAITING_PATIENT", label: "Waiting for the patient" },
  { value: "DECLINED", label: "Declined" },
];

const STEPS = [
  { icon: UserRoundPlus, title: "The SynQ team proposes a patient", text: "You see a pseudonymous code and a nickname. Nothing clinical." },
  { icon: UserCheck, title: "You accept or decline", text: "Decline if your caseload is full or the match is wrong: the team will route the patient elsewhere." },
  { icon: ShieldCheck, title: "The patient consents", text: "They choose what to share and accept the 24/7 notice. Care starts, and the patient appears in your list." },
];

export function RequestsInbox({ list, view }: { list: AssignmentRequestList; view: AssignmentRequestView }) {
  const router = useRouter();
  const now = useNow();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declining, setDeclining] = useState<AssignmentRequest | null>(null);
  const [reason, setReason] = useState("");

  const refresh = () => startTransition(() => router.refresh());
  const go = (next: AssignmentRequestView) => router.push(next === "AWAITING_ME" ? pathname : `${pathname}?view=${next}`);

  const accept = async (request: AssignmentRequest) => {
    setBusyId(request.assignmentId);
    try {
      await acceptAssignmentRequest(request.assignmentId);
      toast.success(`${request.patient.patientCode} accepted`, { description: "The patient was asked to consent. They will appear in your list once they do." });
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to accept this request");
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const decline = async () => {
    if (!declining || !reason.trim()) return;
    setBusyId(declining.assignmentId);
    try {
      await declineAssignmentRequest(declining.assignmentId, reason.trim());
      toast.success(`${declining.patient.patientCode} declined`, { description: "The SynQ team was told to route the patient elsewhere." });
      setDeclining(null);
      setReason("");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to decline this request");
    } finally {
      setBusyId(null);
    }
  };

  const oldest = view === "AWAITING_ME" && list.data.length ? Math.floor((now - new Date(list.data[0].requestedAt).getTime()) / HOUR) : null;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Practice"
        title="Patient requests"
        description="Patients the SynQ team proposes to you. Answer before care can start; the patient is only asked once you accept."
      />

      <KpiGrid className="xl:grid-cols-3">
        <KpiCell
          label="Waiting for you"
          value={list.awaitingMe}
          tone={list.awaitingMe ? "warning" : undefined}
          hint={oldest !== null ? `Oldest asked ${oldest}h ago` : list.awaitingMe ? "Open the first tab" : "Nothing to answer"}
          icon={<Inbox size={15} aria-hidden />}
        />
        <KpiCell label="In this view" value={list.total} hint={VIEWS.find((v) => v.value === view)?.label} />
        <KpiCell label="Response target" value={`${LATE_AFTER_HOURS}`} unit="h" hint="Older requests are flagged to the team" icon={<Clock size={15} aria-hidden />} />
      </KpiGrid>

      <Panel
        title="Requests"
        description={view === "AWAITING_ME" ? "Oldest first" : "Most recent first"}
        action={<Segmented label="Request view" value={view} onChange={go} options={VIEWS.map((v) => ({ ...v, count: v.value === "AWAITING_ME" ? list.awaitingMe : undefined }))} />}
        flush
      >
        {list.data.length === 0 ? (
          <div className="px-5 pb-5">
            <ChartEmpty
              title={view === "AWAITING_ME" ? "No request is waiting for you" : view === "AWAITING_PATIENT" ? "No patient is being asked to consent" : "You have not declined any request"}
              hint={view === "AWAITING_ME" ? "When the team proposes a patient, you are notified and it appears here." : "Nothing to show yet."}
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.data.map((request) => {
              const waitingH = Math.floor((now - new Date(request.requestedAt).getTime()) / HOUR);
              const late = request.stage === "AWAITING_ME" && waitingH >= LATE_AFTER_HOURS;
              const busy = busyId === request.assignmentId;
              return (
                <li key={request.assignmentId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <PatientAvatar name={request.patient.nickname} size="md" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 truncate text-sm font-semibold text-slate-900">
                        {request.patient.nickname}
                        <span className="text-xs font-normal text-slate-500">{request.patient.patientCode}</span>
                        {request.isPrimary && <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[11px] font-medium text-teal-800">Proposed as primary</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {request.patient.age !== null ? `${request.patient.age} y/o · ` : ""}
                        {request.patient.preferredLanguage.toUpperCase()} · member since {new Date(request.patient.memberSince).getFullYear()}
                      </p>
                      <p className={cn("mt-0.5 text-xs", late ? "font-medium text-amber-700" : "text-slate-500")}>
                        {request.stage === "DECLINED"
                          ? `Declined ${request.respondedAt ? formatDistanceToNowStrict(new Date(request.respondedAt), { addSuffix: true }) : ""}${request.declineReason ? ` · “${request.declineReason}”` : ""}`
                          : request.stage === "AWAITING_PATIENT"
                            ? `You accepted ${request.respondedAt ? formatDistanceToNowStrict(new Date(request.respondedAt), { addSuffix: true }) : ""} · waiting for the patient's consent`
                            : `Asked ${formatDistanceToNowStrict(new Date(request.requestedAt), { addSuffix: true })}${late ? " · overdue" : ""}`}
                      </p>
                    </div>
                  </div>
                  {request.stage === "AWAITING_ME" && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="secondary" disabled={busy || pending} onClick={() => { setReason(""); setDeclining(request); }}>
                        <X size={14} aria-hidden /> Decline
                      </Button>
                      <Button size="sm" loading={busy} disabled={pending} onClick={() => void accept(request)}>
                        <Check size={14} aria-hidden /> Accept
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="How it works" description="Care only starts when both of you have said yes.">
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <step.icon size={16} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{index + 1}. {step.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Dialog open={!!declining} onOpenChange={(open) => !open && !busyId && setDeclining(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline {declining?.patient.patientCode}?</DialogTitle>
            <DialogDescription>The SynQ team sees your reason and will route the patient to another clinician. The patient is not told.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="decline-reason" className="text-[13px] font-medium text-slate-800">Reason</label>
            <Textarea id="decline-reason" rows={3} autoFocus value={reason} maxLength={REASON_MAX} onChange={(event) => setReason(event.target.value)} placeholder="e.g. My caseload is full until November." />
            <p className="text-right text-xs text-slate-500">{reason.length}/{REASON_MAX}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeclining(null)} disabled={!!busyId}>Cancel</Button>
            <Button loading={!!busyId} disabled={!reason.trim()} onClick={() => void decline()}>Decline request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
