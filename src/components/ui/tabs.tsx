"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 p-1", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/80",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4 min-w-0 outline-none data-[state=active]:animate-[fade-in_180ms_ease-out]", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

/** Underline variant for page-level section tabs (patient record, settings). */
export const underlineTabsList = "w-full justify-start gap-0 rounded-none border-0 border-b border-slate-200/80 bg-transparent p-0";
export const underlineTabsTrigger =
  "-mb-px gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2.5 pt-2 text-[13px] shadow-none ring-0 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:ring-0";
