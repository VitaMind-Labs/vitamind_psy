"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPatientNote, deletePatientNote, updatePatientNote } from "@/features/notes/actions";
import type { PsychologistNote } from "@/lib/api/psychologist";
import { NoteDialog } from "@/features/patients/components/NoteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";

type NoteInput = { title: string; content: string };
const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

export function NotesPanel({ patientId, initialNotes }: { patientId: string; initialNotes: PsychologistNote[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return needle ? sorted.filter((note) => `${note.title ?? ""} ${note.content}`.toLowerCase().includes(needle)) : sorted;
  }, [notes, query]);

  const create = async (data: NoteInput) => {
    try {
      const note = await createPatientNote(patientId, data);
      setNotes((current) => [note, ...current]);
      toast.success("Note saved");
    } catch (error) {
      toast.error(errorMessage(error, "Could not create this note."));
      throw error;
    }
  };

  const update = (note: PsychologistNote) => async (data: NoteInput) => {
    try {
      const updated = await updatePatientNote(patientId, note.id, data);
      setNotes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("Note updated");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this note."));
      throw error;
    }
  };

  const remove = async (note: PsychologistNote) => {
    try {
      await deletePatientNote(patientId, note.id);
      setNotes((current) => current.filter((item) => item.id !== note.id));
      toast.success("Note deleted");
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete this note."));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input icon={<Search size={15} />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes…" aria-label="Search notes" className="h-9" />
        </div>
        <NoteDialog patientId={patientId} onSave={create} />
      </div>

      {notes.length === 0 ? (
        <ChartEmpty title="No clinical notes yet" hint="Start with a SOAP, DAP or risk-review template." action={<NoteDialog patientId={patientId} onSave={create} />} />
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No notes match “{query}”.</p>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((note) => (
              <motion.li key={note.id} layout="position" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="dashboard-card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span aria-hidden className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText size={15} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{note.title ?? "Untitled note"}</h3>
                      <p className="text-xs text-slate-500">
                        <time dateTime={note.createdAt}>{format(new Date(note.createdAt), "MMM d, yyyy · HH:mm")}</time>
                        {note.updatedAt && note.updatedAt !== note.createdAt && ` · edited ${formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <NoteDialog patientId={patientId} note={note} onSave={update(note)} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Delete note" className="hover:bg-red-50 hover:text-red-700">
                          <Trash2 size={14} aria-hidden />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                          <AlertDialogDescription>“{note.title ?? "Untitled note"}” will be permanently removed from the record.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void remove(note)} className="bg-red-600 text-white hover:bg-red-700">
                            Delete note
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{note.content}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
