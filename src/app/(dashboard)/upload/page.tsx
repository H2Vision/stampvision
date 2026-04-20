import { UploadZone } from "@/components/upload/upload-zone";
import { FileDown } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subir Datos de Producción</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Carga archivos CSV o Excel con registros de producción por turno
          </p>
        </div>
        <a
          href="/plantilla_produccion.csv"
          download
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-border bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          <FileDown className="w-4 h-4" />
          Plantilla CSV
        </a>
      </div>

      {/* Upload zone */}
      <UploadZone />

      {/* Format reference */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Formato del archivo</h2>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-2 pr-4 text-left font-semibold text-gray-500 whitespace-nowrap">Columna</th>
                <th className="py-2 pr-4 text-left font-semibold text-gray-500">Tipo</th>
                <th className="py-2 pr-4 text-left font-semibold text-gray-500">Ejemplo</th>
                <th className="py-2 text-left font-semibold text-gray-500">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {[
                ["fecha",               "Fecha",   "2026-04-13",   "Formato YYYY-MM-DD o DD/MM/YYYY"],
                ["prensa_nombre",       "Texto",   "Prensa 1",     "Debe coincidir con un nombre en el catálogo"],
                ["turno",               "Número",  "1",            "Valores: 1, 2 ó 3"],
                ["piezas_ok",           "Número",  "1250",         "Piezas aprobadas"],
                ["piezas_nok",          "Número",  "38",           "Piezas rechazadas / scrap"],
                ["tiempo_planeado_min", "Número",  "480",          "Minutos planeados del turno"],
                ["tiempo_muerto_min",   "Número",  "45",           "Minutos de paro no planeado"],
                ["causa_paro",          "Texto",   "Falla hidráulica", "Opcional — vacío si no hubo paro"],
                ["numero_parte",        "Texto",   "PN-8847-A",    "Número de parte producida"],
                ["operador",            "Texto",   "Juan García",  "Nombre del operador"],
              ].map(([col, tipo, ejemplo, nota]) => (
                <tr key={col} className="hover:bg-gray-50">
                  <td className="py-2 pr-4 font-mono text-brand-yellow-d font-semibold">{col}</td>
                  <td className="py-2 pr-4 text-gray-500">{tipo}</td>
                  <td className="py-2 pr-4 font-mono text-gray-700">{ejemplo}</td>
                  <td className="py-2 text-gray-400">{nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
