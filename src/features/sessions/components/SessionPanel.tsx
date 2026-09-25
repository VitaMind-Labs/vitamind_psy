"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import type { SessionListItem } from "@/lib/api/psychologist";
import { Badge } from "@/components/ui/badge";

export function SessionPanel({ sessions }: { sessions: SessionListItem[] }) {
  if (sessions.length === 0) return <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[var(--foreground-muted)]">No sessions recorded.</div>;
  return <div className="space-y-3">{sessions.map((session) => <article key={session.id} className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:flex-row sm:items-center"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#6366f1]"><CalendarClock size={18} /></span><div className="flex-1"><p className="text-sm font-semibold">{new Date(session.scheduledAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p><p className="text-xs text-[var(--foreground-muted)]">{session.patientName} · {session.durationMinutes} min · {session.type}</p></div><Badge variant={session.status === "COMPLETED" ? "success" : session.status === "CANCELLED" ? "danger" : "info"}>{session.status === "COMPLETED" && <CheckCircle2 size={12} />}{session.status}</Badge></article>)}</div>;
}
