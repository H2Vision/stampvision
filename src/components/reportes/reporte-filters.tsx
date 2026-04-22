"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays } from "lucide-react";

const PERIODOS = [
  { key: "hoy",         label: "Hoy"          },
  { key: "semana",      label: "Esta semana"  },
  { key: "mes",         label: "Este mes"     },
  { key: "personalizado", label: "Personalizado" },
];

const TURNOS = [
  { key: "all", label: "Todos los turnos" },
  { key: "1",   label: "Turno 1"          },
  { key: "2",   label: "Turno 2"          },
  { key: "3",   label: "Turno 3"          },
];

interface Props {
  periodo: string;
  turno:   string;
  inicio:  string;
  fin:     string;
}

export function ReporteFilters({ periodo, turno, inicio, fin }: Props) {
  const router = useRouter();
  const [customInicio, setCustomInicio] = useState(inicio);
  const [customFin,    setCustomFin]    = useState(fin);

  function navigate(params: Record<string, string>) {
    const merged = { periodo, turno, ...params };
    // Only carry inicio/fin in the URL when using custom range
    if (merged.periodo === "personalizado") {
      (merged as Record<string, string>).inicio = params.inicio ?? inicio;
      (merged as Record<string, string>).fin    = params.fin    ?? fin;
    }
    const sp = new URLSearchParams(merged);
    router.push(`/reportes?${sp.toString()}`);
  }

  function applyCustom() {
    if (!customInicio || !customFin) return;
    navigate({ periodo: "personalizado", inicio: customInicio, fin: customFin });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Period pills */}
      <div className="flex rounded-lg border border-surface-border overflow-hidden bg-surface-card shadow-card">
        {PERIODOS.map((p) => (
          <button
            key={p.key}
            onClick={() => navigate({ periodo: p.key })}
            className={`px-4 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-surface-border
              ${periodo === p.key
                ? "bg-brand text-brand-black"
                : "text-gray-600 hover:bg-gray-50"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range — only visible when "personalizado" is active */}
      {periodo === "personalizado" && (
        <div className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 shadow-card">
          <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="date"
            value={customInicio}
            onChange={(e) => setCustomInicio(e.target.value)}
            className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={customFin}
            onChange={(e) => setCustomFin(e.target.value)}
            className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
          />
          <button
            onClick={applyCustom}
            className="ml-1 px-3 py-1 rounded-md bg-brand text-brand-black text-xs font-semibold hover:bg-brand-hover transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}

      {/* Turno */}
      <div className="relative">
        <select
          value={turno}
          onChange={(e) => navigate({ turno: e.target.value })}
          className="h-9 rounded-lg border border-surface-border bg-surface-card text-sm font-medium text-gray-700 pl-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 shadow-card"
        >
          {TURNOS.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▾</span>
      </div>
    </div>
  );
}
