import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import type { ProduccionTableRow } from "@/lib/data/dashboard";

interface ProduccionTableProps {
  data: ProduccionTableRow[];
}

function OEEBadge({ value }: { value: number }) {
  const cls =
    value >= 85 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
    value >= 70 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    value >= 50 ? "bg-orange-100 text-orange-700 border-orange-200" :
                  "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {value}%
    </span>
  );
}

export function ProduccionTable({ data }: ProduccionTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        No hay registros para los filtros seleccionados
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-surface-border hover:bg-gray-50">
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Prensa</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 text-center">Turno</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 text-right">OK</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 text-right">NOK</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 text-center">OEE%</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 text-right">Disp%</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 text-right">Scrap%</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 text-right">T. Muerto</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">No. Parte</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Operador</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="border-b border-surface-border hover:bg-gray-50 transition-colors">
              <TableCell className="py-3 font-medium text-gray-900">{row.prensa}</TableCell>
              <TableCell className="py-3 text-center text-gray-600">{row.turno}</TableCell>
              <TableCell className="py-3 text-right font-mono text-gray-900">{row.piezasOk.toLocaleString()}</TableCell>
              <TableCell className="py-3 text-right font-mono text-red-600">{row.piezasNok.toLocaleString()}</TableCell>
              <TableCell className="py-3 text-center">
                <OEEBadge value={row.oee} />
              </TableCell>
              <TableCell className="py-3 text-right text-gray-700">{row.disponibilidad}%</TableCell>
              <TableCell className="py-3 text-right text-gray-700">{row.scrapRate}%</TableCell>
              <TableCell className="py-3 text-right text-gray-600">{row.tiempoMuerto} min</TableCell>
              <TableCell className="py-3 font-mono text-xs text-gray-600">{row.numeroParte}</TableCell>
              <TableCell className="py-3 text-gray-600">{row.operador}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
