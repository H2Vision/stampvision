"use client";

import Link from "next/link";
import type { PrensaStatus } from "@/lib/data/prensas";

function oeeColor(oee: number) {
  if (oee >= 85) return "text-green-600";
  if (oee >= 75) return "text-yellow-500";
  if (oee >= 65) return "text-orange-500";
  return "text-red-500";
}

function oeeBarColor(oee: number) {
  if (oee >= 85) return "bg-green-500";
  if (oee >= 75) return "bg-yellow-400";
  if (oee >= 65) return "bg-orange-400";
  return "bg-red-500";
}

interface Props {
  prensa:   PrensaStatus;
  selected: boolean;
}

export function PrensaStatusCard({ prensa, selected }: Props) {
  return (
    <Link
      href={selected ? "/prensas" : `/prensas?prensa=${prensa.id}`}
      className={`
        block rounded-xl border p-5 shadow-card transition-all cursor-pointer
        ${selected
          ? "border-brand bg-brand/5 ring-2 ring-brand/30"
          : "border-surface-border bg-surface-card hover:border-brand/40 hover:shadow-md"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{prensa.nombre}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {prensa.ultimoOperador ? `Operador: ${prensa.ultimoOperador}` : "Sin operador registrado"}
          </p>
        </div>
        <span className={`
          flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full
          ${prensa.tieneDataHoy
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500"}
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${prensa.tieneDataHoy ? "bg-green-500" : "bg-gray-400"}`} />
          {prensa.tieneDataHoy ? "En línea" : "Sin datos"}
        </span>
      </div>

      {/* OEE Principal */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-gray-500 font-medium">OEE</span>
          <span className="text-xs text-gray-400">Meta {prensa.metaOee}%</span>
        </div>
        <div className={`text-4xl font-bold tracking-tight ${oeeColor(prensa.oee)}`}>
          {prensa.oee > 0 ? `${prensa.oee}%` : "—"}
        </div>
        {/* Bar */}
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${oeeBarColor(prensa.oee)}`}
            style={{ width: `${Math.min(prensa.oee, 100)}%` }}
          />
        </div>
        {/* Meta line indicator */}
        <div className="relative -mt-2 h-2">
          <div
            className="absolute top-0 w-px h-2 bg-gray-400"
            style={{ left: `${Math.min(prensa.metaOee, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">Piezas OK</p>
          <p className="text-sm font-semibold text-gray-800">
            {prensa.piezasOk > 0 ? prensa.piezasOk.toLocaleString("es-MX") : "—"}
          </p>
        </div>
        <div className="text-center border-x border-surface-border">
          <p className="text-xs text-gray-400 mb-0.5">Scrap</p>
          <p className={`text-sm font-semibold ${prensa.scrapRate > 5 ? "text-red-500" : "text-gray-800"}`}>
            {prensa.scrapRate > 0 ? `${prensa.scrapRate}%` : "—"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">Disponib.</p>
          <p className="text-sm font-semibold text-gray-800">
            {prensa.disponibilidad > 0 ? `${prensa.disponibilidad}%` : "—"}
          </p>
        </div>
      </div>

      {/* Último paro */}
      {prensa.ultimoParo && (
        <div className="mt-4 pt-3 border-t border-surface-border">
          <p className="text-xs text-gray-400">Último paro</p>
          <p className="text-xs text-gray-600 font-medium mt-0.5 truncate">{prensa.ultimoParo}</p>
          {prensa.tiempoMuertoTotal > 0 && (
            <p className="text-xs text-orange-500 mt-0.5">{prensa.tiempoMuertoTotal} min de tiempo muerto</p>
          )}
        </div>
      )}
    </Link>
  );
}
