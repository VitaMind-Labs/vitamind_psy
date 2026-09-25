"use client";

import { useState } from "react";
import { BookOpen, Tag } from "lucide-react";
import { getPatientJournalServer } from "@/features/journal/actions";
import type { JournalEntry, PaginatedResponse } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JournalPanel({ patientId, initialData }: { patientId: string; initialData: PaginatedResponse<JournalEntry> }) {
  const [data, setData] = useState(initialData);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try { setData(await getPatientJournalServer(patientId, { from, to, page: 1, limit: 50 })); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Journal unavailable."); } finally { setLoading(false); }
  };

  return <div className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-end"><div><label className="text-xs text-[var(--foreground-muted)]">From</label><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1" /></div><div><label className="text-xs text-[var(--foreground-muted)]">To</label><Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1" /></div><Button size="sm" onClick={() => void load()} disabled={loading}>{loading ? "Loading…" : "Filter"}</Button></div>{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{data.data.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[var(--foreground-muted)]">No journal entries for this period.</div> : <div className="space-y-3">{data.data.map((entry) => <article key={entry.id} className="rounded-2xl border border-[#e2e8f0] bg-white p-4"><div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]"><BookOpen size={15} className="text-[#6366f1]" />{new Date(entry.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}{entry.mood !== null && <span className="ml-auto rounded-full bg-[#f0fdfa] px-2 py-1">Mood: {entry.mood}/5</span>}</div><p className="mt-3 whitespace-pre-line text-sm leading-6">{entry.content}</p>{entry.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{entry.tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#f8fafc] px-2 py-1 text-xs"><Tag size={11} />{tag}</span>)}</div>}</article>)}</div>}</div>;
}
