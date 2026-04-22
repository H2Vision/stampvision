import { Suspense } from "react";
import { getMostRecentDate } from "@/lib/data/dashboard";
import { getPrensasStatus, getPrensaOEEHistory, getPrensaParos } from "@/lib/data/prensas";
import { PrensaStatusCard } from "@/components/prensas/prensa-status-card";
import { PrensaOEEChart } from "@/components/prensas/prensa-oee-chart";
import { PrensaParosTable } from "@/components/prensas/prensa-paros-table";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface PageProps {
  searchParams: { prensa?: string };
}

export default async function PrensasPage({ searchParams }: PageProps) {
  const date          = await getMostRecentDate();
  const prensas       = await getPrensasStatus(date);
  const selectedId    = searchParams.prensa ?? null;
  const selectedPrens = prensas.find((p) => p.id === selectedId) ?? null;

  // Fetch detail data only when a prensa is selected
  const [oeeHistory, paros] = selectedId
    ? await Promise.all([
        getPrensaOEEHistory(selectedId, 30),
        getPrensaParos(selectedId, 30),
      ])
    : [[], []];

  // Summary stats
  const conDatos    = prensas.filter((p) => p.tieneDataHoy);
  const oeePromedio = conDatos.length > 0
    ? Math.round(conDatos.reduce((s, p) => s + p.oee, 0) / conDatos.length * 10) / 10
    : 0;
  const totalPiezas = prensas.reduce((s, p) => s + p.piezasOk, 0);
  const alertas     = prensas.filter((p) => p.tieneDataHoy && p.oee < 80).length;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prensas de Producción</h1>
        <p className="text-sm text-gray-500 mt-1">
          Estado actual · {date} · {conDatos.length}/{prensas.length} prensas con actividad hoy
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-card rounded-xl border border-surface-border p-4 shadow-card">
          <p className="text-xs text-gray-500 font-medium">OEE Promedio (hoy)</p>
          <p className={`text-2xl font-bold mt-1 ${oeePromedio >= 80 ? "text-green-600" : oeePromedio >= 70 ? "text-yellow-500" : "text-red-500"}`}>
            {oeePromedio > 0 ? `${oeePromedio}%` : "—"}
          </p>
        </div>
        <div className="bg-surface-card rounded-xl border border-surface-border p-4 shadow-card">
          <p className="text-xs text-gray-500 font-medium">Total Piezas OK</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {totalPiezas > 0 ? totalPiezas.toLocaleString("es-MX") : "—"}
          </p>
        </div>
        <div className={`rounded-xl border p-4 shadow-card ${alertas > 0 ? "bg-red-50 border-red-200" : "bg-surface-card border-surface-border"}`}>
          <p className="text-xs text-gray-500 font-medium">Prensas bajo meta OEE</p>
          <p className={`text-2xl font-bold mt-1 ${alertas > 0 ? "text-red-600" : "text-green-600"}`}>
            {alertas > 0 ? `${alertas} alerta${alertas > 1 ? "s" : ""}` : "Todo OK"}
          </p>
        </div>
      </div>

      {/* Prensa cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prensas.map((p) => (
          <PrensaStatusCard
            key={p.id}
            prensa={p}
            selected={p.id === selectedId}
          />
        ))}
      </div>

      {/* Detail panel */}
      {selectedPrens && (
        <div className="bg-surface-card rounded-xl border border-surface-border shadow-card overflow-hidden">

          {/* Detail header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-brand" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedPrens.nombre} — Detalle</h2>
                <p className="text-xs text-gray-500">Últimos 30 días</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">

            {/* OEE Trend */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" />
                Tendencia OEE — 30 días
              </h3>
              <Suspense fallback={<div className="h-52 bg-gray-50 rounded-lg animate-pulse" />}>
                <PrensaOEEChart data={oeeHistory} />
              </Suspense>
            </div>

            {/* Paros */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Registro de Paros — últimos 30 días
                {paros.length > 0 && (
                  <span className="ml-auto text-xs text-gray-400 font-normal">{paros.length} evento{paros.length !== 1 ? "s" : ""}</span>
                )}
              </h3>
              <PrensaParosTable paros={paros} />
            </div>

          </div>
        </div>
      )}

      {/* Empty state when no prensa selected */}
      {!selectedId && prensas.length > 0 && (
        <div className="bg-surface-card rounded-xl border border-surface-border p-8 text-center text-gray-400 text-sm shadow-card">
          Selecciona una prensa para ver su historial de OEE y registro de paros
        </div>
      )}

    </div>
  );
}
