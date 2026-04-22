import { getReporteMatrix, getReporteSemanal, getPeriodDates } from "@/lib/data/reportes";
import { ReporteMatrixTable } from "@/components/reportes/reporte-matrix-table";
import { ReporteSemanalChart } from "@/components/reportes/reporte-semanal-chart";
import { ExportButton } from "@/components/reportes/export-button";
import { ReporteFilters } from "@/components/reportes/reporte-filters";
import { BarChart2, TableIcon } from "lucide-react";

interface PageProps {
  searchParams: { periodo?: string; turno?: string; inicio?: string; fin?: string };
}

export default async function ReportesPage({ searchParams }: PageProps) {
  const periodo = searchParams.periodo ?? "semana";
  const turno   = searchParams.turno   ?? "all";

  const dates  = getPeriodDates(periodo);
  // Only use custom URL dates when explicitly in "personalizado" mode
  const inicio = periodo === "personalizado" ? (searchParams.inicio ?? dates.inicio) : dates.inicio;
  const fin    = periodo === "personalizado" ? (searchParams.fin    ?? dates.fin)    : dates.fin;

  const [prensas, { prensaNombres, rows: semanalRows }] = await Promise.all([
    getReporteMatrix(inicio, fin, turno),
    getReporteSemanal(4),
  ]);

  const periodoLabel = periodo === "personalizado"
    ? "Período personalizado"
    : ({ hoy: "Hoy", semana: "Esta semana", mes: "Este mes" } as Record<string, string>)[periodo] ?? "Esta semana";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Producción</h1>
          <p className="text-sm text-gray-500 mt-1">
            {periodoLabel} · {inicio === fin ? inicio : `${inicio} — ${fin}`}
          </p>
        </div>
        <ExportButton inicio={inicio} fin={fin} turno={turno} />
      </div>

      {/* Filters */}
      <ReporteFilters periodo={periodo} turno={turno} inicio={inicio} fin={fin} />

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
