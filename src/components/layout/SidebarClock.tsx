"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

/** Live local date & time; renders a placeholder until mounted to avoid hydration mismatch. */
export function SidebarClock({ compact }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const time = now?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ?? "--:--";
  const date = now?.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) ?? "";

  if (compact) {
    return (
      <div className="flex flex-col items-center py-1" title={date} aria-label={`${date} ${time}`}>
        <Clock size={13} aria-hidden className="text-slate-400" />
        <span className="tabular mt-0.5 text-[11px] font-semibold text-slate-700">{time}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm" role="timer" aria-label="Current date and time">
      <Clock size={15} aria-hidden className="shrink-0 text-teal-700" />
      <div className="min-w-0 leading-tight">
        <p className="tabular text-sm font-semibold text-slate-900">{time}</p>
        <p className="truncate text-[11px] text-slate-500">{date || " "}</p>
      </div>
    </div>
  );
}
