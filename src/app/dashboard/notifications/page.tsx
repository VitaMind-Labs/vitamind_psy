"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCheck, LayoutGrid, List, Search } from "lucide-react";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { mockNotifications } from "@/lib/mock-data";
import type { Notification } from "@/types/dashboard";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || n.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [notifications, search, typeFilter]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Notifications
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[var(--radius-sm)] overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button
              onClick={() => setViewMode("list")}
              className="p-2 cursor-pointer transition-colors"
              style={{
                background: viewMode === "list" ? "var(--surface-secondary)" : "white",
                color: viewMode === "list" ? "var(--foreground)" : "var(--foreground-muted)",
              }}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className="p-2 cursor-pointer transition-colors"
              style={{
                background: viewMode === "grid" ? "var(--surface-secondary)" : "white",
                color: viewMode === "grid" ? "var(--foreground)" : "var(--foreground-muted)",
              }}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              <CheckCheck size={15} />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input
            placeholder="Rechercher dans les notifications..."
            icon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="info">Information</SelectItem>
            <SelectItem value="assignment">Attribution</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((n, i) => (
            <NotificationCard key={n.id} notification={n} index={i} onMarkRead={markRead} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((n, i) => (
            <NotificationCard key={n.id} notification={n} index={i} onMarkRead={markRead} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Aucune notification trouvée</p>
        </div>
      )}
    </div>
  );
}
