import { getReporteMatrix, getReporteSemanal, getPeriodDates } from "@/lib/data/reportes";
import { ReporteMatrixTable } from "@/components/reportes/reporte-matrix-table";
import { ReporteSemanalChart } from "@/components/reportes/reporte-semanal-chart";
import { ExportButton } from "@/components/reportes/export-button";
import { BarChart2, TableIcon } from "lucide-react";
import Link from "next/link";

const PERIODOS = [
  { key: "hoy",    label: "Hoy"          },
  { key: "semana", label: "Esta semana"  },
  { key: "mes",    label: "Este mes"     },
];

const TURNOS = [
  { key: "all", label: "Todos los turnos" },
  { key: "1",   label: "Turno 1"          },
  { key: "2",   label: "Turno 2"          },
  { key: "3",   label: "Turno 3"          },
];

interface PageProps {
  searchParams: { periodo?: string; turno?: string };
}

export default async function ReportesPage({ searchParams }: PageProps) {
  const periodo = searchParams.periodo ?? "semana";
  const turno   = searchParams.turno   ?? "all";

  const { inicio, fin } = getPeriodDates(periodo);

  const [prensas, { prensaNombres, rows: semanalRows }] = await Promise.all([
    getReporteMatrix(inicio, fin, turno),
    getReporteSemanal(4),
  ]);

  const turnoLabel   = TURNOS.find((t) => t.key === turno)?.label   ?? "Todos los turnos";
  const periodoLabel = PERIODOS.find((p) => p.key === periodo)?.label ?? "Esta semana";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Producción</h1>
          <p className="text-sm text-gray-500 mt-1">
            {periodoLabel} · {inicio === fin ? inicio : `${inicio} — ${fin}`} · {turnoLabel}
          </p>
        </div>
        <ExportButton inicio={inicio} fin={fin} turno={turno} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Período */}
        <div className="flex rounded-lg border border-surface-border overflow-hidden bg-surface-card shadow-card">
          {PERIODOS.map((p) => (
            <Link
              key={p.key}
              href={`/reportes?periodo=${p.key}&turno=${turno}`}
              className={`px-4 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-surface-border
                ${periodo === p.key
                  ? "bg-brand text-brand-black"
                  : "text-gray-600 hover:bg-gray-50"}`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Turno */}
        <div className="relative">
          <select
            defaultValue={turno}
            className="h-9 rounded-lg border border-surface-border bg-surface-card text-sm font-medium text-gray-700 pl-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 shadow-card"
          >
            {TURNOS.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▾</span>
        </div>
      </div>

      {/* Matrix table */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-border">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <TableIcon className="w-4 h-4 text-brand-dark" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Comparativo por Prensa</h2>
            <p className="text-xs text-gray-500">KPIs agregados del período seleccionado</p>
          </div>
        </div>
        <div className="p-2">
          <ReporteMatrixTable prensas={prensas} />
        </div>
      </div>

      {/* Semanal chart */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-border">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-brand-dark" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Tendencia Semanal — OEE por Prensa</h2>
            <p className="text-xs text-gray-500">Últimas 4 semanas</p>
          </div>
        </div>
        <div className="p-6">
          <ReporteSemanalChart prensaNombres={prensaNombres} rows={semanalRows} />
        </div>
      </div>

    </div>
  );
}
