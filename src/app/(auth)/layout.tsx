import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Activity, Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react";

const TRUST_POINTS = [
  { icon: Activity, title: "Risk-stratified caseload", body: "Drift scores and traffic-light triage surface who needs you first." },
  { icon: Fingerprint, title: "Consent-scoped access", body: "You only see the data categories each patient has agreed to share." },
  { icon: LockKeyhole, title: "Audited by design", body: "Every clinical access is logged. No clinical data leaves by email." },
];

const PREVIEW_ROWS = [
  { code: "PT-0142", label: "Sleep drop · 3 nights", tone: "bg-red-500", badge: "High", badgeClass: "badge-danger" },
  { code: "PT-0087", label: "Missed check-ins · 2 days", tone: "bg-amber-500", badge: "Moderate", badgeClass: "badge-warning" },
  { code: "PT-0213", label: "Stable trend", tone: "bg-emerald-500", badge: "Low", badgeClass: "badge-success" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] xl:grid-cols-[minmax(0,1fr)_600px]">
      <div className="flex min-w-0 flex-col px-5 py-6 sm:px-10">
        <header className="flex items-center justify-between">
          <Link href="/signin" className="flex items-center gap-2.5 rounded-lg" aria-label="VitaMind Psy home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
              <Image src="/logo.png" alt="" width={20} height={20} priority />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              VitaMind <span className="font-normal text-slate-500">Psy</span>
            </span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">{children}</main>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} VitaMind Labs</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck size={13} aria-hidden className="text-teal-700" />
            Encrypted in transit and at rest
          </p>
        </footer>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-slate-200/80 bg-slate-50 lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />
        <div className="relative max-w-md">
          <p className="eyebrow">Clinician workspace</p>
          <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-tight text-slate-900">
            Clinical clarity for every patient in your care.
          </h2>

          <div aria-hidden className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-900">Today&apos;s priorities</p>
              <p className="text-[11px] text-slate-500">Illustrative</p>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {PREVIEW_ROWS.map((row) => (
                <li key={row.code} className="flex items-center gap-3 py-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${row.tone}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-slate-900">{row.code}</span>
                    <span className="block truncate text-[11px] text-slate-500">{row.label}</span>
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${row.badgeClass}`}>{row.badge}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-8 space-y-5">
            {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-teal-700">
                  <Icon size={17} aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-slate-600">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
