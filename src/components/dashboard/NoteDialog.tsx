"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface NoteDialogProps {
  patientId: string;
  onSave: (data: { title: string; content: string }) => void;
}

export function NoteDialog({ onSave }: NoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({ title: title.trim(), content: content.trim() });
    setTitle("");
    setContent("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} />
          Nouvelle note
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle note clinique</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label>Titre de la note</Label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-ui w-full h-11 px-4 rounded-[var(--radius-sm)] text-sm mt-1"
              placeholder="Ex: Compte-rendu de consultation"
            />
          </div>
          <div>
            <Label>Contenu</Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="input-ui w-full p-4 rounded-[var(--radius-sm)] text-sm resize-none mt-1"
              placeholder="Observations, ajustements thérapeutiques, plan de suivi..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleSave} disabled={!title.trim() || !content.trim()}>Enregistrer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
