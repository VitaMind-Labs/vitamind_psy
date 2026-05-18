"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Users, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { searchPatients, mockNotifications, mockProfile } from "@/lib/mock-data";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Aperçu du cabinet", subtitle: "Indicateurs clés et activité récente" },
  "/dashboard/patients": { title: "Portefeuille patients", subtitle: "Suivi clinique et gestion des priorités" },
  "/dashboard/notifications": { title: "Notifications", subtitle: "Alertes, rappels et mises à jour" },
  "/dashboard/settings": { title: "Paramètres", subtitle: "Profil, disponibilités et abonnement" },
  "/dashboard/reports": { title: "Rapports cliniques", subtitle: "Validation et suivi des rapports patients" },
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const meta = pageMeta[pathname] ?? { title: "Dashboard", subtitle: "" };
  const unreadCount = mockNotifications.filter((n) => !n.read).length;
  const results = searchQuery.length >= 1 ? searchPatients(searchQuery) : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between h-16 px-4 md:px-8 border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggle} className="shrink-0">
          <Menu size={20} />
        </Button>
        <div ref={searchRef} className="relative hidden sm:block">
          <Input
            placeholder="Rechercher un patient..."
            icon={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            className="w-48 md:w-64"
          />
          <AnimatePresence>
            {showResults && searchQuery.length >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full mt-2 left-0 w-full rounded-[var(--radius-sm)] shadow-lg z-50 overflow-hidden"
                style={{ background: "white", border: "1px solid var(--border)" }}
              >
                {results.length === 0 ? (
                  <div className="px-4 py-3 text-sm" style={{ color: "var(--foreground-muted)" }}>
                    Aucun patient trouvé
                  </div>
                ) : (
                  results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSearchQuery(""); setShowResults(false); router.push(`/dashboard/patients/${p.id}`); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                    >
                      <Users size={14} style={{ color: "var(--foreground-soft)" }} />
                      <span className="font-medium">{p.name}</span>
                      <span style={{ color: "var(--foreground-muted)" }}>{p.id}</span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3">
      

        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/notifications")} className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--danger)" }}>
              {unreadCount}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-3 ml-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "var(--gradient-primary)" }}>
            {mockProfile.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{mockProfile.name}</p>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Psychiatre</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
