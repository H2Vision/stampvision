"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Gauge,
  Bot,
  BellDot,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

// ─── Nav definition ───────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/upload",     label: "Subir Datos",  icon: Upload          },
  { href: "/prensas",    label: "Prensas",      icon: Gauge           },
  { href: "/chat",       label: "Chat IA",      icon: Bot             },
  { href: "/alertas",    label: "Alertas",      icon: BellDot         },
  { href: "/reportes",   label: "Reportes",     icon: BarChart3       },
] as const;

const ADMIN_ITEMS = [
  { href: "/admin",      label: "Admin",        icon: ShieldCheck     },
] as const;

// ─── Logo mark ────────────────────────────────────────────────────────────────

function LogoMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-5 select-none",
      collapsed && "justify-center px-0"
    )}>
      {/* H2 badge */}
      <div className={cn(
        "relative flex-shrink-0 flex items-center justify-center rounded-lg",
        "bg-brand shadow-[0_2px_12px_rgba(212,160,23,0.30)]",
        collapsed ? "w-9 h-9" : "w-10 h-10"
      )}>
        <span className="text-brand-black font-black leading-none tracking-tight"
          style={{ fontSize: collapsed ? 13 : 15 }}>
          H2
        </span>
      </div>

      {!collapsed && (
        <div className="overflow-hidden">
          <p className="text-[14px] font-bold text-white leading-none tracking-wide">
            H2 <span className="text-brand">Stamping</span>
          </p>
          <p className="text-[10px] text-sidebar-text leading-none mt-0.5 tracking-widest uppercase">
            Industrial MES
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon: Icon,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg",
        "text-sm font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
        isActive
          ? "bg-brand-10 text-brand"
          : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-h",
        collapsed && "justify-center mx-2 px-0 w-10 h-10 rounded-xl"
      )}
    >
      {/* Active left bar */}
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand rounded-r-full" />
      )}

      <Icon
        className={cn(
          "flex-shrink-0 transition-colors duration-150",
          collapsed ? "w-5 h-5" : "w-[18px] h-[18px]",
          isActive
            ? "text-brand"
            : "text-sidebar-text group-hover:text-sidebar-text-h"
        )}
        strokeWidth={isActive ? 2.2 : 1.8}
      />

      {!collapsed && (
        <span className="truncate">{label}</span>
      )}

      {/* Tooltip on collapsed */}
      {collapsed && (
        <span className={cn(
          "pointer-events-none absolute left-full ml-3 z-50",
          "whitespace-nowrap rounded-md bg-[#1E2130] text-white text-xs px-2.5 py-1.5",
          "shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          "border border-sidebar-border"
        )}>
          {label}
        </span>
      )}
    </Link>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-1 mx-4 border-t border-sidebar-border" />;
  return (
    <p className="px-5 pt-4 pb-1 text-[10px] font-semibold tracking-widest uppercase text-sidebar-text/60 select-none">
      {label}
    </p>
  );
}

// ─── Sidebar inner ────────────────────────────────────────────────────────────

function SidebarInner({
  collapsed,
  onClose,
  isMobile = false,
}: {
  collapsed: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const { toggleCollapsed } = useSidebar();

  return (
    <div className="flex flex-col h-full bg-sidebar">

      {/* Top accent line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-brand via-brand-hover to-brand-dark flex-shrink-0" />

      {/* Logo */}
      <div className="flex items-center justify-between pr-2">
        <LogoMark collapsed={collapsed} />
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-hover transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-sidebar-border" />

      {/* Main nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-0.5 scrollbar-thin">
        <SectionLabel label="Principal" collapsed={collapsed} />
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            onClick={isMobile ? onClose : undefined}
          />
        ))}

        <SectionLabel label="Sistema" collapsed={collapsed} />
        {ADMIN_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            onClick={isMobile ? onClose : undefined}
          />
        ))}
      </nav>

      {/* Bottom: collapse toggle (desktop only) */}
      {!isMobile && (
        <>
          <div className="mx-4 border-t border-sidebar-border" />
          <button
            onClick={toggleCollapsed}
            className={cn(
              "flex items-center gap-2.5 px-3 py-3 mx-2 mb-2 mt-1 rounded-lg",
              "text-sidebar-text hover:text-sidebar-text-h hover:bg-sidebar-hover",
              "transition-colors text-xs font-medium",
              collapsed && "justify-center"
            )}
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <>
                  <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                  <span>Colapsar</span>
                </>
            }
          </button>
        </>
      )}
    </div>
  );
}

// ─── Desktop sidebar ──────────────────────────────────────────────────────────

export function Sidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col flex-shrink-0",
        "sticky top-0 h-screen overflow-hidden",
        "shadow-sidebar transition-[width] duration-sidebar ease-in-out",
        collapsed ? "w-[72px]" : "w-sidebar"
      )}
      aria-label="Navegación principal"
    >
      <SidebarInner collapsed={collapsed} />
    </aside>
  );
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────

export function MobileSidebar() {
  const { mobileOpen, closeMobile } = useSidebar();

  if (!mobileOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] animate-fade-in lg:hidden"
        onClick={closeMobile}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        className="fixed left-0 top-0 z-50 h-full w-[280px] shadow-sidebar animate-slide-in lg:hidden"
        aria-label="Navegación móvil"
      >
        <SidebarInner collapsed={false} onClose={closeMobile} isMobile />
      </aside>
    </>
  );
}
