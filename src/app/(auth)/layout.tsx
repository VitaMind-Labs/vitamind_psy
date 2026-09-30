import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo3D } from "@/components/shared/Logo3D";
import { Activity, Fingerprint, Lock, LockKeyhole, ScrollText, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: Activity, title: "Risk-stratified caseload", body: "Drift scores and traffic-light triage surface who needs you first." },
  { icon: Fingerprint, title: "Consent-scoped access", body: "You only see the data categories each patient has agreed to share." },
  { icon: LockKeyhole, title: "Audited by design", body: "Every clinical access is logged. No clinical data leaves by email." },
] as const;

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-transparent">
        <Image
          src="/logo.svg"
          alt="VitaMind"
          width={44}
          height={44}
          className="h-11 w-11 bg-transparent object-contain"
          priority
        />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-white">VitaMind</span>
        <span className="block text-[11px] font-medium text-white/60">Clinical platform</span>
      </span>
    </span>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)]">
      {/* Brand panel — mirrors the back-office sign-in shell (always dark). */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b2328] via-[#0b2328] to-[#12414a] text-[#e9f3f4] lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
        <div
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-24 top-1/3 size-[420px] rounded-full bg-teal-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-[360px] rounded-full bg-[#d9a51a]/10 blur-3xl" aria-hidden />

        <div className="relative">
          <BrandMark />
        </div>

        <div className="relative flex flex-1 items-center justify-center py-6">
          <Logo3D size={300} />
        </div>

        <div className="relative max-w-md space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
              <Activity size={14} aria-hidden className="text-[#d9a51a]" />
              Clinician workspace
            </span>
            <h2 className="text-[32px] font-semibold leading-[1.15] tracking-tight text-white">
              Clinical clarity for
              <br />
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">every patient in your care.</span>
            </h2>
            <p className="text-[15px] leading-relaxed text-white/60">
              Triage risk, follow sessions, assessments and weekly reports from one secure, audited workspace.
            </p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5 backdrop-blur-sm">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.07] ring-1 ring-inset ring-white/10">
                  <f.icon size={16} aria-hidden className="text-white" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{f.title}</span>
                  <span className="block text-[13px] text-white/60">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between gap-4 text-xs text-white/60">
          <span>Restricted system · authorised clinicians only</span>
          <span className="flex gap-1.5">
            {["RGPD", "2FA", "Audit"].map((chip) => (
              <span key={chip} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-medium">
                {chip}
              </span>
            ))}
          </span>
        </div>
      </aside>

      {/* Form column */}
      <div className="relative flex min-w-0 flex-col bg-white px-5 py-6 sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
          aria-hidden
        />
        <header className="relative flex items-center justify-between">
          <Link
            href="/signin"
            className="flex items-center gap-2.5 rounded-lg lg:invisible"
            aria-label="VitaMind sign in"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-transparent">
              <Image
                src="/logo.svg"
                alt="VitaMind"
                width={44}
                height={44}
                className="h-11 w-11 bg-transparent object-contain"
                priority
              />
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            <ShieldCheck size={13} aria-hidden className="text-teal-700" />
            Encrypted in transit and at rest
          </span>
        </header>

        <main className="relative flex flex-1 flex-col items-center justify-center gap-4 py-10">
          <div className="lg:hidden">
            <Logo3D size={112} />
          </div>
          {children}
        </main>

        <footer className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock size={12} aria-hidden /> Encrypted session
          </span>
          <span className="flex items-center gap-1.5">
            <ScrollText size={12} aria-hidden /> Every access is audited
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} aria-hidden /> Consent-scoped data
          </span>
        </footer>
      </div>
    </div>
  );
}
