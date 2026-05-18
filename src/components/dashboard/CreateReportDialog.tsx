"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { mockPatients } from "@/lib/mock-data";

interface CreateReportDialogProps {
  onSave: (data: { patientId: string; patientName: string; title: string; summary: string; details: string }) => void;
}

export function CreateReportDialog({ onSave }: CreateReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");

  const selectedPatient = mockPatients.find((p) => p.id === patientId);

  const handleSave = () => {
    if (!patientId || !title.trim() || !summary.trim()) return;
    onSave({
      patientId,
      patientName: selectedPatient?.name ?? "",
      title: title.trim(),
      summary: summary.trim(),
      details: details.trim(),
    });
    setPatientId("");
    setTitle("");
    setSummary("");
    setDetails("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} />
          Nouveau rapport
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer un rapport clinique</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label>Patient</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un patient" />
              </SelectTrigger>
              <SelectContent>
                {mockPatients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Titre du rapport</Label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="input-ui w-full h-11 px-4 rounded-[var(--radius-sm)] text-sm mt-1"
              placeholder="Ex: Rapport d'évaluation initiale"
            />
          </div>
          <div>
            <Label>Résumé</Label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3}
              className="input-ui w-full p-4 rounded-[var(--radius-sm)] text-sm resize-none mt-1"
              placeholder="Synthèse clinique du rapport..."
            />
          </div>
          <div>
            <Label>Détails complets</Label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4}
              className="input-ui w-full p-4 rounded-[var(--radius-sm)] text-sm resize-none mt-1"
              placeholder="Description détaillée, observations, données cliniques..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!patientId || !title.trim() || !summary.trim()}>
              Créer le rapport
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
