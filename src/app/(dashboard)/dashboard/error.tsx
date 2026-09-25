"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="dashboard-card mx-auto max-w-xl p-8 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#dc2626]">Something went wrong</p>
      <h2 className="mt-2 text-xl font-bold text-[#0f172a]">This page could not be loaded</h2>
      <p className="mt-2 text-sm text-[#64748b]">Check your session and try again. If the issue persists, contact support.</p>
      <Button onClick={() => reset()} className="mt-5">
        Try again
      </Button>
    </div>
  );
}
