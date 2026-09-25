"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] data-[state=open]:animate-[overlay-in_150ms_ease-out]", className)} {...props} />
));
DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(({ className = "", children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content ref={ref} className={cn("fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-2xl border border-[#e2e8f0] bg-white p-6 text-[#0f172a] shadow-[0_24px_64px_rgba(15,23,42,0.16)] data-[state=open]:animate-[dialog-in_180ms_ease-out]", className)} {...props}>
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><X size={17} /><span className="sr-only">Close</span></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={cn("mb-5 space-y-1.5 pr-8", className)}>{children}</div>;

export const DialogFooter = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>{children}</div>;

export const DialogTitle = forwardRef<React.ElementRef<typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(({ className = "", ...props }, ref) => <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold tracking-tight text-[#0f172a]", className)} {...props} />);
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<React.ElementRef<typeof DialogPrimitive.Description>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(({ className = "", ...props }, ref) => <DialogPrimitive.Description ref={ref} className={cn("text-sm leading-6 text-[#64748b]", className)} {...props} />);
DialogDescription.displayName = "DialogDescription";
