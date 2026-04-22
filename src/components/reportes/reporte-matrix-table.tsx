import type { ReportePrensaRow } from "@/lib/data/reportes";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

function oeeStatus(oee: number, meta: number) {
  if (oee === 0) return { color: "text-gray-400", bg: "bg-gray-50", icon: null };
  if (oee >= meta) return { color: "text-green-700", bg: "bg-green-50", icon: CheckCircle };
  if (oee >= meta - 10) return { color: "text-yellow-700", bg: "bg-yellow-50", icon: AlertTriangle };
  return { color: "text-red-700", bg: "bg-red-50", icon: XCircle };
}

function fmt(n: number, suffix = "") {
  if (n === 0) return "—";
  return `${n.toLocaleString("es-MX")}${suffix}`;
}

export function ReporteMatrixTable({ prensas }: { prensas: ReportePrensaRow[] }) {
  if (prensas.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-400">
        Sin datos para el período seleccionado
      </div>
    );
  }

  const kpis = [
    { label: "OEE",           key: "oee",            suffix: "%",  bold: true  },
    { label: "Piezas OK",     key: "piezasOk",       suffix: "",   bold: false },
    { label: "Piezas NOK",    key: "piezasNok",       suffix: "",   bold: false },
    { label: "Scrap Rate",    key: "scrapRate",       suffix: "%",  bold: false },
    { label: "Disponibilidad",key: "disponibilidad",  suffix: "%",  bold: false },
    { label: "Tiempo Muerto", key: "tiempoMuerto",    suffix: " min",bold: false },
    { label: "Paro Principal",key: "causaPrincipal",  suffix: "",   bold: false },
  ] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-surface-border">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">
              KPI
            </th>
            {prensas.map((p) => (
              <th key={p.prensaId} className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {p.nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {kpis.map(({ label, key, suffix, bold }) => (
            <tr key={key} className="border-b border-surface-border/60 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}
              </td>
              {prensas.map((p) => {
                const val = p[key];
                if (key === "causaPrincipal") {
                  return (
                    <td key={p.prensaId} className="py-3 px-4 text-center text-xs text-gray-600">
                      {val ? String(val) : <span className="text-gray-300">—</span>}
                    </td>
                  );
                }
                if (key === "oee") {
                  const { color, bg, icon: Icon } = oeeStatus(Number(val), p.meta);
                  return (
                    <td key={p.prensaId} className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-base ${color} ${bg}`}>
                        {Icon && <Icon className="w-4 h-4" />}
                        {fmt(Number(val), suffix)}
                      </span>
                    </td>
                  );
                }
                const isScrap = key === "scrapRate";
                const scrapAlert = isScrap && Number(val) > 5;
                return (
                  <td key={p.prensaId} className={`py-3 px-4 text-center font-${bold ? "bold" : "medium"} ${scrapAlert ? "text-red-600" : "text-gray-800"}`}>
                    {key === "piezasOk"
                      ? Number(val) > 0 ? Number(val).toLocaleString("es-MX") : "—"
                      : key === "piezasNok"
                      ? Number(val) > 0 ? Number(val).toLocaleString("es-MX") : "—"
                      : fmt(Number(val), suffix)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
