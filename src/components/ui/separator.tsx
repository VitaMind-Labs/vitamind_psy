"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { forwardRef } from "react";

export const Separator = forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className = "", ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    className={`dashboard-divider ${className}`}
    style={{ borderColor: "var(--border)" }}
    {...props}
  />
));
Separator.displayName = "Separator";
