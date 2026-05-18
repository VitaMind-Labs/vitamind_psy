"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

type CalendarProps = Omit<React.ComponentProps<"input">, "type"> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  wrapperClassName?: string;
};

function Calendar({
  className,
  wrapperClassName,
  buttonVariant = "ghost",
  ...props
}: CalendarProps) {
  return (
    <div
      data-slot="calendar"
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]",
        wrapperClassName,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <span
          className={cn(
            buttonVariants({ variant: buttonVariant }),
            "pointer-events-none h-9 w-9 rounded-xl p-0",
          )}
        >
          <CalendarDays className="h-4 w-4" />
        </span>
        <span>Select a date</span>
      </div>

      <input
        type="date"
        className={cn(
          "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring",
          className,
        )}
        {...props}
      />
    </div>
  );
}

const CalendarDayButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-9 w-9 rounded-xl", className)}
      {...props}
    />
  );
});

CalendarDayButton.displayName = "CalendarDayButton";

export { Calendar, CalendarDayButton };
