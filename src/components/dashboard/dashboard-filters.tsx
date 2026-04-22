"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { DashboardPrensaOption } from "@/lib/data/dashboard";
import { CalendarDays, ChevronDown } from "lucide-react";

interface DashboardFiltersProps {
  prensas:         DashboardPrensaOption[];
  selectedDate:    string;
  selectedPrensa:  string;
  selectedTurno:   string;
}

const selectClass = `
  h-9 rounded-lg border border-surface-border bg-white
  text-sm font-medium text-gray-700
  pl-3 pr-8 appearance-none cursor-pointer
  focus:outline-none focus:ring-2 focus:ring-steel/30 focus:border-steel
`;

export function DashboardFilters({
  prensas,
  selectedDate,
  selectedPrensa,
  selectedTurno,
}: DashboardFiltersProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date */}
      <div className="relative">
        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => push("date", e.target.value)}
          className="
            h-9 pl-9 pr-3 rounded-lg border border-surface-border bg-white
            text-sm text-gray-700 font-medium
            focus:outline-none focus:ring-2 focus:ring-steel/30 focus:border-steel
            cursor-pointer
          "
        />
      </div>

      {/* Prensa */}
      <div className="relative">
        <select
          value={selectedPrensa ?? "all"}
          onChange={(e) => push("prensa", e.target.value)}
          className={selectClass}
        >
          <option value="all">Todas las prensas</option>
          {prensas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Turno */}
      <div className="relative">
        <select
          value={selectedTurno ?? "all"}
          onChange={(e) => push("turno", e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos los turnos</option>
          <option value="1">Turno 1</option>
          <option value="2">Turno 2</option>
          <option value="3">Turno 3</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
