import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(61,113,124,0.14),transparent_70%)]"
        aria-hidden
      />
      <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <Link href="/signin" className="flex flex-col items-center gap-3 rounded-lg text-center" aria-label="VitaMind sign in">
          <Image src="/logo.svg" alt="VitaMind" width={44} height={44} className="h-11 w-11 object-contain" priority />
          <span className="text-sm font-semibold tracking-tight text-slate-900">VitaMind Clinician workspace</span>
        </Link>
        {children}
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Lock size={12} aria-hidden /> Secure, audited access
        </p>
      </main>
    </div>
  );
}
