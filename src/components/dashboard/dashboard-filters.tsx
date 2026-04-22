"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import type { DashboardPrensaOption } from "@/lib/data/dashboard";
import { CalendarDays } from "lucide-react";

interface DashboardFiltersProps {
  prensas:         DashboardPrensaOption[];
  selectedDate:    string;
  selectedPrensa:  string;
  selectedTurno:   string;
}

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
      <Select value={selectedPrensa ?? "all"} onValueChange={(v) => push("prensa", v ?? "all")}>
        <SelectTrigger className="h-9 w-44 bg-white border-surface-border text-sm font-medium text-gray-700">
          <span>
            {selectedPrensa && selectedPrensa !== "all"
              ? prensas.find((p) => p.id === selectedPrensa)?.nombre ?? "Todas las prensas"
              : "Todas las prensas"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las prensas</SelectItem>
          {prensas.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Turno */}
      <Select value={selectedTurno ?? "all"} onValueChange={(v) => push("turno", v ?? "all")}>
        <SelectTrigger className="h-9 w-36 bg-white border-surface-border text-sm font-medium text-gray-700">
          <span>
            {selectedTurno && selectedTurno !== "all"
              ? `Turno ${selectedTurno}`
              : "Todos los turnos"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los turnos</SelectItem>
          <SelectItem value="1">Turno 1</SelectItem>
          <SelectItem value="2">Turno 2</SelectItem>
          <SelectItem value="3">Turno 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
