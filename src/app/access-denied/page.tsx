import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function AccessDeniedPage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6"><section className="max-w-md rounded-3xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500"><ShieldX size={28} /></span><h1 className="mt-5 text-2xl text-[#0f172a]">Access denied</h1><p className="mt-2 text-sm">Your account does not have the required permissions to access this area.</p><Link href="/signin" className="mt-6 inline-flex rounded-xl bg-[#0d9488] px-5 py-3 text-sm font-semibold text-white">Back to sign in</Link></section></main>;
}
