import { createServiceClient } from "@/lib/supabase/service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrensaStatus {
  id:                string;
  nombre:            string;
  metaOee:           number;
  oee:               number;
  piezasOk:          number;
  scrapRate:         number;
  disponibilidad:    number;
  tiempoMuertoTotal: number;
  ultimoParo:        string | null;
  ultimoOperador:    string | null;
  tieneDataHoy:      boolean;
}

export interface PrensaOEEHistory {
  fecha: string;
  oee:   number;
  meta:  number;
}

export interface PrensaParoRow {
  fecha:        string;
  turno:        number;
  causaParo:    string;
  tiempoMuerto: number;
  operador:     string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date) {
  return d.toISOString().split("T")[0];
}

function calcOEE(tp: number, tm: number, ok: number, nok: number) {
  if (tp === 0) return 0;
  const A = (tp - tm) / tp;
  const total = ok + nok;
  const Q = total > 0 ? ok / total : 0;
  return Math.round(A * Q * 1000) / 10;
}

function calcDisp(tp: number, tm: number) {
  if (tp === 0) return 0;
  return Math.round(((tp - tm) / tp) * 1000) / 10;
}

function calcScrap(ok: number, nok: number) {
  const total = ok + nok;
  if (total === 0) return 0;
  return Math.round((nok / total) * 1000) / 10;
}

const SHORT_MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPrensasStatus(dateStr: string): Promise<PrensaStatus[]> {
  const sb = createServiceClient();

  // Fetch all active prensas
  const { data: prensas, error: pe } = await sb
    .from("prensas")
    .select("id, nombre, meta_oee")
    .eq("estado", "activa")
    .order("nombre");
  if (pe) throw new Error(pe.message);
  if (!prensas || prensas.length === 0) return [];

  // Fetch all production for today
  const { data: prod, error: prodErr } = await sb
    .from("produccion")
    .select("prensa_id,piezas_ok,piezas_nok,tiempo_planeado_min,tiempo_muerto_min,causa_paro,operador,turno")
    .eq("fecha", dateStr);
  if (prodErr) throw new Error(prodErr.message);

  const rows = prod ?? [];

  return prensas.map((p) => {
    const pRows = rows.filter((r) => r.prensa_id === p.id);
    const tp  = pRows.reduce((s, r) => s + r.tiempo_planeado_min, 0);
    const tm  = pRows.reduce((s, r) => s + r.tiempo_muerto_min,   0);
    const ok  = pRows.reduce((s, r) => s + r.piezas_ok,           0);
    const nok = pRows.reduce((s, r) => s + r.piezas_nok,          0);

    // Last paro reason (row with most downtime)
    const conParo = pRows.filter((r) => r.tiempo_muerto_min > 0 && r.causa_paro);
    conParo.sort((a, b) => b.tiempo_muerto_min - a.tiempo_muerto_min);
    const ultimoParo     = conParo[0]?.causa_paro ?? null;
    const ultimoOperador = pRows.length > 0 ? pRows[pRows.length - 1].operador : null;

    return {
      id:                p.id,
      nombre:            p.nombre,
      metaOee:           Math.round(Number(p.meta_oee ?? 0.82) * 100),
      oee:               calcOEE(tp, tm, ok, nok),
      piezasOk:          ok,
      scrapRate:         calcScrap(ok, nok),
      disponibilidad:    calcDisp(tp, tm),
      tiempoMuertoTotal: tm,
      ultimoParo,
      ultimoOperador,
      tieneDataHoy:      pRows.length > 0,
    };
  });
}

export async function getPrensaOEEHistory(
  prensaId: string,
  days = 30,
): Promise<PrensaOEEHistory[]> {
  const sb = createServiceClient();

  const { data: last } = await sb
    .from("produccion")
    .select("fecha")
    .eq("prensa_id", prensaId)
    .order("fecha", { ascending: false })
    .limit(1)
    .single();
  if (!last) return [];

  const endDate  = last.fecha as string;
  const start    = new Date(endDate + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() - days + 1);
  const startStr = toDateString(start);

  const { data, error } = await sb
    .from("produccion")
    .select("fecha,tiempo_planeado_min,tiempo_muerto_min,piezas_ok,piezas_nok")
    .eq("prensa_id", prensaId)
    .gte("fecha", startStr)
    .lte("fecha", endDate)
    .order("fecha");
  if (error) throw new Error(error.message);

  const { data: prensaData } = await sb
    .from("prensas")
    .select("meta_oee")
    .eq("id", prensaId)
    .single();
  const meta = Math.round(Number(prensaData?.meta_oee ?? 0.82) * 100);

  // Group by date
  const grouped = new Map<string, typeof data>();
  for (const r of (data ?? [])) {
    const key = (r.fecha as string).split("T")[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  return Array.from(grouped.entries()).map(([dateKey, dayRows]) => {
    const tp  = dayRows.reduce((s, r) => s + r.tiempo_planeado_min, 0);
    const tm  = dayRows.reduce((s, r) => s + r.tiempo_muerto_min,   0);
    const ok  = dayRows.reduce((s, r) => s + r.piezas_ok,           0);
    const nok = dayRows.reduce((s, r) => s + r.piezas_nok,          0);
    const d   = new Date(dateKey + "T00:00:00Z");
    return {
      fecha: `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`,
      oee:   calcOEE(tp, tm, ok, nok),
      meta,
    };
  });
}

export async function getPrensaParos(
  prensaId: string,
  days = 30,
): Promise<PrensaParoRow[]> {
  const sb = createServiceClient();

  const end   = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);

  const { data, error } = await sb
    .from("produccion")
    .select("fecha,turno,causa_paro,tiempo_muerto_min,operador")
    .eq("prensa_id", prensaId)
    .gt("tiempo_muerto_min", 0)
    .gte("fecha", toDateString(start))
    .lte("fecha", toDateString(end))
    .order("fecha", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((r) => r.causa_paro)
    .map((r) => ({
      fecha:        (r.fecha as string).split("T")[0],
      turno:        r.turno,
      causaParo:    r.causa_paro!,
      tiempoMuerto: r.tiempo_muerto_min,
      operador:     r.operador,
    }));
}
