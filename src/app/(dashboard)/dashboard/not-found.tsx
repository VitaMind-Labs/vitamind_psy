import Link from "next/link";
import { UserRoundX } from "lucide-react";

export default function PatientNotFound() {
  return <main className="flex min-h-[60vh] items-center justify-center p-6"><section className="max-w-md rounded-3xl border border-[#e2e8f0] bg-white p-8 text-center"><UserRoundX size={36} className="mx-auto text-[#6366f1]" /><h1 className="mt-4 text-2xl text-[#0f172a]">Patient not found</h1><p className="mt-2 text-sm text-[var(--foreground-muted)]">This record does not exist or is no longer accessible.</p><Link href="/dashboard/patients" className="mt-6 inline-flex rounded-xl bg-[#0d9488] px-5 py-3 text-sm font-semibold text-white">Back to patients</Link></section></main>;
}
