"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Settings,
  Bell,
  LogOut,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Users, label: "Patients", path: "/dashboard/patients" },
  { icon: FileText, label: "Rapports", path: "/dashboard/reports" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle } = useSidebar();

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? "72px" : "var(--sidebar-width)" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="sidebar fixed left-0 top-0 h-screen z-40 overflow-hidden"
      style={{ borderRight: "1px solid var(--border)" }}
    >
      <div className="h-full flex flex-col p-3">
        <div className="flex items-center justify-between px-2 py-4 mb-4">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="expanded-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <Image
                  src="/logo.png"
                  alt="VitaMind"
                  width={36}
                  height={36}
                  className="shrink-0"
                  priority
                />
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  Cabinet PSY
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex justify-center"
              >
                <Image
                  src="/logo.png"
                  alt="VitaMind"
                  width={32}
                  height={32}
                  priority
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item, i) => {
            const active = isActive(item.path);
            return (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                onClick={() => router.push(item.path)}
                className={`sidebar-link flex items-center px-3 py-2.5 rounded-[var(--radius-sm)] text-sm w-full text-left ${
                  collapsed ? "justify-center" : "gap-3"
                } ${active ? "active" : ""}`}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </motion.button>
            );
          })}
        </nav>

        <button
          onClick={toggle}
          className="flex items-center justify-center w-full py-2 mb-2 rounded-[var(--radius-sm)] cursor-pointer"
          style={{ color: "var(--foreground-soft)" }}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronLeft size={18} />
          </motion.div>
        </button>

        <button
          onClick={() => router.push("/signin")}
          className={`sidebar-link flex items-center px-3 py-2.5 rounded-[var(--radius-sm)] text-sm w-full text-left ${
            collapsed ? "justify-center" : "gap-3"
          }`}
          style={{ color: "var(--foreground-muted)" }}
        >
          <LogOut size={18} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </motion.aside>
  );
}
