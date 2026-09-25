"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, ClipboardCheck, FilePenLine, Inbox, ListTodo, MoreHorizontal, Users } from "lucide-react";
import type { DashboardResponse } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function displayName(firstName: string, lastName: string | null) {
  return `${firstName}${lastName ? ` ${lastName}` : ""}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const QUICK_ACTIONS = [
  { label: "View patient list", path: "/dashboard/patients" },
  { label: "Review assessments", path: "/dashboard/reports" },
  { label: "Schedule a session", path: "/dashboard/sessions" },
  { label: "Create a note", path: "/dashboard/notes" },
];

export function DashboardOverview({ dashboard }: { dashboard: DashboardResponse }) {
  const router = useRouter();
  const { stats, recentPatients, pendingItems, upcomingSessions } = dashboard;

  const metrics = [
    { label: "Total patients", value: stats.totalPatients, icon: <Users size={16} className="text-[#0f766e]" /> },
    { label: "Pending reviews", value: stats.pendingAssessments, icon: <ClipboardCheck size={16} className="text-[#6366f1]" /> },
    { label: "Upcoming sessions", value: stats.upcomingSessions, icon: <CalendarDays size={16} className="text-[#047857]" /> },
    { label: "Active patients", value: stats.activePatients, icon: <ListTodo size={16} className="text-[#b45309]" /> },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f766e]">Practice overview</h1>
          <p className="mt-1 text-[13px] text-[#64748b]">A calm summary of your activity and patients today.</p>
        </div>
        <p className="text-[13px] text-[#64748b]">
          {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">{m.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0fdfa]" aria-hidden>{m.icon}</span>
              </div>
              <p className="mt-2 text-[26px] font-bold leading-none tracking-tight text-[#0f172a]">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_330px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent patients</CardTitle>
              <CardDescription>Latest observed activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/patients")}>
              View all <ArrowRight size={14} aria-hidden />
            </Button>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[520px]">
              <TableCaption className="sr-only">Recent patients</TableCaption>
              <TableHeader><TableRow><TableHead className="pl-3">Patient</TableHead><TableHead>Last activity</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>
                {recentPatients.map((patient) => <TableRow key={patient.id}><TableCell className="pl-3"><Link href={`/dashboard/patients/${patient.id}`} className="font-semibold text-[#0f172a] hover:text-[#0f766e]">{displayName(patient.firstName, patient.lastName)}<span className="block text-xs font-normal text-[#64748b]">{patient.id.slice(0, 8)}…</span></Link></TableCell><TableCell className="text-[#64748b]">{patient.lastActivityAt ? formatDate(patient.lastActivityAt) : "No activity yet"}</TableCell><TableCell><Badge variant={patient.status === "ACTIVE" ? "success" : "default"}>{patient.status}</Badge></TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${displayName(patient.firstName, patient.lastName)}`}><MoreHorizontal size={16} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => router.push(`/dashboard/patients/${patient.id}`)}><ArrowRight size={15} /> Open patient</DropdownMenuItem><DropdownMenuItem onSelect={() => router.push(`/dashboard/patients/${patient.id}?tab=progress`)}><Activity size={15} /> View progress</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}
                {recentPatients.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center"><Inbox className="mx-auto text-[#94a3b8]" size={28} /><p className="mt-2 font-semibold text-[#0f172a]">No recent patients</p><p className="mt-1 text-xs text-[#64748b]">Patients with activity will appear here.</p></TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.path}
                  onClick={() => router.push(action.path)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-left text-[13px] font-medium text-[#0f172a] transition hover:border-[#0f766e] hover:bg-[#f8fafc]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#0f766e] shadow-sm" aria-hidden>
                    <FilePenLine size={15} />
                  </span>
                  <span className="flex-1">{action.label}</span>
                  <ArrowRight size={14} className="text-[#94a3b8]" aria-hidden />
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming sessions</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/sessions")}>
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingSessions.slice(0, 3).map((session) => (
                <button
                  key={session.id}
                  onClick={() => router.push("/dashboard/sessions")}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[#e2e8f0] p-3 text-left transition hover:border-[#0f766e]"
                >
                  <CalendarDays size={16} className="shrink-0 text-[#0f766e]" aria-hidden />
                  <span className="min-w-0 flex-1 text-[13px] font-medium text-[#0f172a]">
                    {formatDate(session.scheduledAt)}
                    <span className="block truncate text-xs font-normal text-[#64748b]">Patient {session.patientId.slice(0, 8)}…</span>
                  </span>
                  <Badge variant="info">{session.status}</Badge>
                </button>
              ))}
              {upcomingSessions.length === 0 && <p className="text-[13px] text-[#64748b]">No sessions scheduled yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Assessments awaiting review</CardTitle>
            <CardDescription>Patient analyses pending professional review</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/reports")}>
            Open <ArrowRight size={14} aria-hidden />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pendingItems.map((item) => (
              <button
                key={item.assessmentId}
                onClick={() => router.push(`/dashboard/patients/${item.patientId}?tab=assessments&assessmentId=${item.assessmentId}`)}
                className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4 text-left transition hover:border-[#b45309]"
              >
                <p className="text-sm font-semibold text-[#0f172a]">Assessment ready for review</p>
                <p className="mt-1 text-xs text-[#64748b]">Patient {item.patientId.slice(0, 8)}… · {formatDate(item.createdAt)}</p>
              </button>
            ))}
            {pendingItems.length === 0 && <p className="text-sm text-[#64748b]">No assessments pending review.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
