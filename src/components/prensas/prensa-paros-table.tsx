import type { PrensaParoRow } from "@/lib/data/prensas";
import { Clock } from "lucide-react";

const TURNO_LABEL: Record<number, string> = { 1: "Turno 1", 2: "Turno 2", 3: "Turno 3" };

function severityClass(min: number) {
  if (min >= 60) return "bg-red-100 text-red-700";
  if (min >= 30) return "bg-orange-100 text-orange-700";
  return "bg-yellow-100 text-yellow-700";
}

export function PrensaParosTable({ paros }: { paros: PrensaParoRow[] }) {
  if (paros.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-400">
        Sin paros registrados en los últimos 30 días
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Turno</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Causa del paro</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiempo</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Operador</th>
          </tr>
        </thead>
        <tbody>
          {paros.map((p, i) => (
            <tr key={i} className="border-b border-surface-border/50 hover:bg-gray-50 transition-colors">
              <td className="py-2.5 px-3 text-gray-600">{p.fecha}</td>
              <td className="py-2.5 px-3 text-gray-600">{TURNO_LABEL[p.turno] ?? `Turno ${p.turno}`}</td>
              <td className="py-2.5 px-3 font-medium text-gray-800">{p.causaParo}</td>
              <td className="py-2.5 px-3 text-right">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${severityClass(p.tiempoMuerto)}`}>
                  <Clock className="w-3 h-3" />
                  {p.tiempoMuerto} min
                </span>
              </td>
              <td className="py-2.5 px-3 text-gray-600">{p.operador}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
