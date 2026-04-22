import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createServiceClient } from "@/lib/supabase/service";

function calcOEE(tp: number, tm: number, ok: number, nok: number) {
  if (tp === 0) return 0;
  const total = ok + nok;
  return Math.round(((tp - tm) / tp) * (total > 0 ? ok / total : 0) * 1000) / 10;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inicio  = searchParams.get("inicio") ?? "";
  const fin     = searchParams.get("fin")    ?? "";
  const turno   = searchParams.get("turno")  ?? "all";

  if (!inicio || !fin) {
    return NextResponse.json({ error: "Faltan parámetros inicio y fin" }, { status: 400 });
  }

  const sb = createServiceClient();
  let q = sb
    .from("produccion")
    .select("fecha,turno,piezas_ok,piezas_nok,tiempo_planeado_min,tiempo_muerto_min,causa_paro,numero_parte,operador,prensas(nombre)")
    .gte("fecha", inicio)
    .lte("fecha", fin)
    .order("fecha")
    .order("turno");

  if (turno !== "all") q = q.eq("turno", Number(turno));

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((r: any) => ({
    Fecha:                  (r.fecha as string).split("T")[0],
    Prensa:                 r.prensas?.nombre ?? "—",
    Turno:                  r.turno,
    "OEE %":               calcOEE(r.tiempo_planeado_min, r.tiempo_muerto_min, r.piezas_ok, r.piezas_nok),
    "Piezas OK":            r.piezas_ok,
    "Piezas NOK":           r.piezas_nok,
    "Scrap %":              r.piezas_ok + r.piezas_nok > 0
                              ? Math.round(r.piezas_nok / (r.piezas_ok + r.piezas_nok) * 1000) / 10
                              : 0,
    "Disponibilidad %":     r.tiempo_planeado_min > 0
                              ? Math.round((r.tiempo_planeado_min - r.tiempo_muerto_min) / r.tiempo_planeado_min * 1000) / 10
                              : 0,
    "Tiempo Muerto (min)":  r.tiempo_muerto_min,
    "Causa Paro":           r.causa_paro ?? "",
    "Número Parte":         r.numero_parte ?? "",
    Operador:               r.operador ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 16 },
    { wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Producción");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reporte_${inicio}_${fin}.xlsx"`,
    },
  });
}
