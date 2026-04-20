"use client";

import { Menu, ChevronDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { usePathname } from "next/navigation";
import { AlertBell } from "./alert-bell";

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, { label: string; description: string }> = {
  "/dashboard": { label: "Dashboard",    description: "Resumen de producción en tiempo real"  },
  "/upload":    { label: "Subir Datos",  description: "Carga de registros desde Excel"         },
  "/prensas":   { label: "Prensas",      description: "Catálogo y estado de prensas"            },
  "/chat":      { label: "Chat IA",      description: "Análisis inteligente con Claude"         },
  "/alertas":   { label: "Alertas",      description: "Alertas activas del sistema"             },
  "/reportes":  { label: "Reportes",     description: "Reportes de OEE y producción"            },
  "/admin":     { label: "Admin",        description: "Configuración y usuarios"                },
};

function usePageInfo() {
  const pathname = usePathname();
  const base = "/" + (pathname.split("/")[1] ?? "");
  return PAGE_TITLES[base] ?? { label: "StampVision", description: "" };
}

// ─── User chip ────────────────────────────────────────────────────────────────

function UserChip({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <button className={cn(
      "flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-xl",
      "hover:bg-surface-input transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel/40",
      "border border-transparent hover:border-surface-border"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
        "bg-gradient-to-br from-brand-yellow to-brand-yellow-d",
        "text-brand-black text-[11px] font-bold leading-none select-none"
      )}>
        {initials}
      </div>

      {/* Name + role */}
      <div className="hidden sm:flex flex-col items-start leading-none">
        <span className="text-[13px] font-semibold text-gray-800 leading-none">
          {name}
        </span>
        <span className="text-[10px] text-gray-400 mt-0.5 capitalize">
          {role}
        </span>
      </div>

      <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
    </button>
  );
}

// ─── Status indicator ─────────────────────────────────────────────────────────

function StatusDot() {
  return (
    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
      <Circle className="w-2 h-2 text-emerald-500 fill-emerald-500 animate-pulse" />
      <span className="text-[11px] font-medium text-emerald-700 leading-none">
        En línea
      </span>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export function Header({
  userName = "Patricia Díaz",
  userRole = "Supervisora",
}: HeaderProps) {
  const { toggleMobile } = useSidebar();
  const { label, description } = usePageInfo();

  return (
    <header className={cn(
      "sticky top-0 z-30 flex items-center gap-4 h-[60px] px-4 lg:px-6",
      "bg-surface-card border-b border-surface-border",
      "shadow-header"
    )}>

      {/* Mobile hamburger */}
      <button
        onClick={toggleMobile}
        className={cn(
          "lg:hidden flex items-center justify-center w-9 h-9 rounded-lg",
          "text-gray-500 hover:text-gray-800 hover:bg-surface-input",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel/40"
        )}
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile logo (shown when sidebar hidden) */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-brand-yellow flex items-center justify-center shadow-[0_1px_6px_rgba(200,255,0,0.30)]">
          <span className="text-brand-black text-[11px] font-black leading-none">H2</span>
        </div>
        <span className="text-sm font-bold text-gray-900">H2 Stamping</span>
      </div>

      {/* Page title (desktop) */}
      <div className="hidden lg:flex flex-col justify-center">
        <h1 className="text-[15px] font-semibold text-gray-900 leading-none">
          {label}
        </h1>
        {description && (
          <p className="text-[11px] text-gray-400 mt-0.5 leading-none">
            {description}
          </p>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        <StatusDot />

        {/* Divider */}
        <div className="hidden md:block h-5 w-px bg-surface-border mx-1" />

        <AlertBell />

        {/* Divider */}
        <div className="h-5 w-px bg-surface-border mx-1" />

        <UserChip name={userName} role={userRole} />
      </div>
    </header>
  );
}
