"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Gauge, Bot, BellDot, BarChart3 } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prensas",   label: "Prensas",   icon: Gauge           },
  { href: "/chat",      label: "Chat IA",   icon: Bot             },
  { href: "/alertas",   label: "Alertas",   icon: BellDot         },
  { href: "/reportes",  label: "Reportes",  icon: BarChart3       },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border safe-area-pb">
      <div className="flex items-stretch h-16">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors
                ${active ? "text-brand" : "text-sidebar-text hover:text-sidebar-text-h"}`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
