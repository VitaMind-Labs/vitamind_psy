"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ArrowUpDown } from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Patient } from "@/types/patient";
import type { RiskLevel } from "@/types/dashboard";

interface PatientsTableProps {
  patients: Patient[];
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [sortKey, setSortKey] = useState<keyof Patient>("riskLevel");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    const riskOrder = { red: 0, orange: 1, green: 2 };
    return patients
      .filter((p) => {
        const matchName = p.name.toLowerCase().includes(search.toLowerCase());
        const matchRisk = riskFilter === "all" || p.riskLevel === riskFilter;
        return matchName && matchRisk;
      })
      .sort((a, b) => {
        const valA = String(a[sortKey] ?? "");
        const valB = String(b[sortKey] ?? "");
        const cmp = valA.localeCompare(valB);
        return sortAsc ? cmp : -cmp;
      })
      .sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
  }, [patients, search, riskFilter, sortKey, sortAsc]);

  const toggleSort = (key: keyof Patient) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par nom..."
            icon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={riskFilter}
          onValueChange={(v) => setRiskFilter(v as RiskLevel | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Niveau de risque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            <SelectItem value="red">Critique</SelectItem>
            <SelectItem value="orange">Surveillance</SelectItem>
            <SelectItem value="green">Stable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="table-ui text-sm">
          <thead>
            <tr>
              {["Patient", "Âge", "Risque", "Dernière consultation", "Prochain RDV", "Diagnostic"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((patient, i) => (
              <motion.tr
                key={patient.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                className="cursor-pointer"
              >
                <td className="px-4 py-3 font-medium">{patient.name}</td>
                <td className="px-4 py-3" style={{ color: "var(--foreground-muted)" }}>{patient.age} ans</td>
                <td className="px-4 py-3"><RiskBadge level={patient.riskLevel} /></td>
                <td className="px-4 py-3" style={{ color: "var(--foreground-muted)" }}>{patient.lastConsultation}</td>
                <td className="px-4 py-3" style={{ color: "var(--foreground-muted)" }}>{patient.nextAppointment ?? "—"}</td>
                <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: "var(--foreground-muted)" }}>
                  {patient.diagnosis.join(", ")}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: "var(--foreground-muted)" }}>
            Aucun patient trouvé
          </div>
        )}
      </div>
    </div>
  );
}
