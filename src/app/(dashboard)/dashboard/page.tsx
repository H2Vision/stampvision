import { Suspense } from "react";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { OEEByPrensaChart } from "@/components/dashboard/oee-by-prensa-chart";
import { OEETrendChart } from "@/components/dashboard/oee-trend-chart";
import { ProduccionTable } from "@/components/dashboard/produccion-table";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import {
  getDashboardKPIs,
  getOEEByPrensaData,
  getOEETrendData,
  getProduccionTableData,
  getDashboardPrensas,
  getMostRecentDate,
} from "@/lib/data/dashboard";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string; prensa?: string; turno?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  const defaultDate = await getMostRecentDate();
  const dateStr     = params.date   || defaultDate;
  const prensaId    = params.prensa || "all";
  const turno       = params.turno  || "all";

  const [kpis, oeeByPrensaData, oeetrend, tableData, prensas] = await Promise.all([
    getDashboardKPIs(dateStr, prensaId, turno),
    getOEEByPrensaData(dateStr),
    getOEETrendData(30),
    getProduccionTableData(dateStr, prensaId, turno),
    getDashboardPrensas(),
  ]);

  const chartHeight = Math.max(200, oeeByPrensaData.length * 52);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header + Filters ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard de Producción</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumen del{" "}
            <span className="font-medium text-gray-700">
              {new Date(dateStr + "T00:00:00Z").toLocaleDateString("es-MX", {
                weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
              })}
            </span>
          </p>
        </div>
        <Suspense>
          <DashboardFilters
            prensas={prensas}
            selectedDate={dateStr}
            selectedPrensa={prensaId}
            selectedTurno={turno}
          />
        </Suspense>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="OEE Promedio"
          value={String(kpis.oeePromedio)}
          delta={kpis.oeeDelta}
          unit="%"
          icon={Activity}
        />
        <KPICard
          title="Total Piezas OK"
          value={kpis.totalPiezasOk.toLocaleString()}
          delta={kpis.piezasOkDelta}
          icon={CheckCircle2}
        />
        <KPICard
          title="Scrap Rate"
          value={String(kpis.scrapRate)}
          delta={kpis.scrapRateDelta}
          unit="%"
          icon={XCircle}
          isInverse
        />
        <KPICard
          title="Disponibilidad"
          value={String(kpis.disponibilidad)}
          delta={kpis.disponibilidadDelta}
          unit="%"
          icon={Clock}
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* OEE por prensa */}
        <div className="bg-white rounded-xl border border-surface-border p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">OEE por Prensa</h2>
            <p className="text-xs text-gray-400 mt-0.5">Comparativa del día</p>
          </div>
          <div style={{ height: chartHeight }}>
            <OEEByPrensaChart data={oeeByPrensaData} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {[
              { color: "#22c55e", label: "≥ 85%" },
              { color: "#F5C400", label: "70–84%" },
              { color: "#f97316", label: "50–69%" },
              { color: "#ef4444", label: "< 50%" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* OEE trend */}
        <div className="bg-white rounded-xl border border-surface-border p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Tendencia OEE — 30 días</h2>
            <p className="text-xs text-gray-400 mt-0.5">Últimas 4 semanas de producción</p>
          </div>
          <div className="h-64">
            <OEETrendChart data={oeetrend} />
          </div>
        </div>
      </div>

      {/* ── Production Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-surface-border flex flex-col">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Registros de Producción</h2>
            <p className="text-xs text-gray-400 mt-0.5">{tableData.length} registros encontrados</p>
          </div>
        </div>
        <ProduccionTable data={tableData} />
      </div>
    </div>
  );
}
