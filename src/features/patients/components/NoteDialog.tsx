"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { PsychologistNote } from "@/lib/api/psychologist";
import { cn } from "@/lib/utils";

const noteSchema = z.object({
  title: z.string().trim().min(2, "Add a descriptive title."),
  content: z.string().trim().min(5, "Write a little more detail before saving.").max(20000, "Notes are limited to 20,000 characters."),
});

type NoteFormValues = z.infer<typeof noteSchema>;

/** Templates only scaffold `content`; the stored shape stays `{ title, content }`. */
const TEMPLATES = [
  { id: "free", label: "Free text", title: "", body: "" },
  { id: "soap", label: "SOAP", title: "Session note", body: "Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:\n" },
  { id: "dap", label: "DAP", title: "Session note", body: "Data:\n\nAssessment:\n\nPlan:\n" },
  { id: "risk", label: "Risk review", title: "Risk review", body: "Presenting risk:\n\nProtective factors:\n\nSafety plan reviewed: yes / no\n\nRisk level (low / moderate / high):\n\nActions & follow-up:\n" },
] as const;

interface NoteDialogProps {
  patientId: string;
  note?: PsychologistNote;
  onSave: (data: NoteFormValues) => Promise<void>;
}

export function NoteDialog({ patientId, note, onSave }: NoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]["id"]>("free");
  const defaults = { title: note?.title ?? "", content: note?.content ?? "" };
  const form = useForm<NoteFormValues>({ resolver: zodResolver(noteSchema), defaultValues: defaults });
  const content = useWatch({ control: form.control, name: "content" }) ?? "";
  const saving = form.formState.isSubmitting;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset(defaults);
      setTemplate("free");
    }
    setOpen(nextOpen);
  };

  const applyTemplate = (id: (typeof TEMPLATES)[number]["id"]) => {
    const next = TEMPLATES.find((item) => item.id === id)!;
    setTemplate(id);
    if (!form.getValues("title")) form.setValue("title", next.title);
    // Never overwrite text the clinician already typed.
    if (!form.getValues("content").trim()) form.setValue("content", next.body);
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSave(values);
      setOpen(false);
    } catch {
      /* parent surfaces the error; keep the dialog and draft open */
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {note ? (
          <Button size="icon-sm" variant="ghost" aria-label={`Edit note ${note.title ?? ""}`.trim()}>
            <Pencil size={14} aria-hidden />
          </Button>
        ) : (
          <Button size="sm">
            <Plus size={15} aria-hidden /> New note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-patient-id={patientId} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{note ? "Edit clinical note" : "New clinical note"}</DialogTitle>
          <DialogDescription>Private to the care team. Every edit is logged for audit.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={submit}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void submit();
            }}
          >
            {!note && (
              <div role="radiogroup" aria-label="Note template" className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={template === item.id}
                    onClick={() => applyTemplate(item.id)}
                    className={cn(
                      "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      template === item.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <FormField
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Session 4 — sleep hygiene" aria-invalid={Boolean(fieldState.error)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field, fieldState }) => (
                <FormItem>
                  <div className="flex items-baseline justify-between">
                    <FormLabel>Note</FormLabel>
                    <span className="tabular text-[11px] text-slate-500">{content.length.toLocaleString()} / 20,000</span>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={12}
                      placeholder="Clinical observations, interventions, plan…"
                      aria-invalid={Boolean(fieldState.error)}
                      className="min-h-64 resize-y rounded-xl font-[inherit] leading-6"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="items-center sm:justify-between">
              <p className="hidden text-xs text-slate-500 sm:block">
                <kbd className="rounded border border-slate-200 px-1 font-sans">Ctrl</kbd> + <kbd className="rounded border border-slate-200 px-1 font-sans">Enter</kbd> to save
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {saving ? "Saving…" : "Save note"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
