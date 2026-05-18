"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={`input-ui h-11 px-4 rounded-[var(--radius-sm)] text-sm flex items-center justify-between gap-2 w-full ${className}`}
    {...props}
  >
    {children}
    <ChevronDown size={16} style={{ color: "var(--foreground-soft)" }} />
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={`overflow-hidden rounded-[var(--radius-sm)] shadow-lg z-50 ${className}`}
      style={{ background: "white", border: "1px solid var(--border)" }}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={`px-3 py-2 text-sm rounded-[var(--radius-sm)] cursor-pointer flex items-center gap-2 outline-none data-[highlighted]:bg-[var(--surface-secondary)] ${className}`}
    style={{ color: "var(--foreground)" }}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
