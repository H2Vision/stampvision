import { createServiceClient } from "@/lib/supabase/service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportePrensaRow {
  prensaId:       string;
  nombre:         string;
  oee:            number;
  piezasOk:       number;
  piezasNok:      number;
  scrapRate:      number;
  disponibilidad: number;
  tiempoMuerto:   number;
  causaPrincipal: string | null;
  meta:           number;
}

export interface ReporteSemanalRow {
  semana:  string;
  [prensa: string]: number | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date) {
  return d.toISOString().split("T")[0];
}

function calcOEE(tp: number, tm: number, ok: number, nok: number) {
  if (tp === 0) return 0;
  const total = ok + nok;
  return Math.round(((tp - tm) / tp) * (total > 0 ? ok / total : 0) * 1000) / 10;
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

export function getPeriodDates(periodo: string): { inicio: string; fin: string } {
  // Mexico City = UTC-6 (CST). Adjust server UTC time to get the correct local date.
  const now = new Date();
  const mxNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const today = toDateString(mxNow);

  if (periodo === "hoy") {
    return { inicio: today, fin: today };
  }

  if (periodo === "semana") {
    // Week = Monday to Sunday
    const dow = mxNow.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
    const daysFromMonday = dow === 0 ? 6 : dow - 1;
    const monday = new Date(mxNow);
    monday.setUTCDate(mxNow.getUTCDate() - daysFromMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    // Cap end at today so we don't show future dates
    const fin = toDateString(sunday) > today ? today : toDateString(sunday);
    return { inicio: toDateString(monday), fin };
  }

  if (periodo === "mes") {
    // First day of current month to today
    const firstDay = new Date(Date.UTC(mxNow.getUTCFullYear(), mxNow.getUTCMonth(), 1));
    return { inicio: toDateString(firstDay), fin: today };
  }

  // default: semana
  const dow = mxNow.getUTCDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(mxNow);
  monday.setUTCDate(mxNow.getUTCDate() - daysFromMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fin = toDateString(sunday) > today ? today : toDateString(sunday);
  return { inicio: toDateString(monday), fin };
}

// ─── Matrix report (aggregated by prensa for a date range + turno) ───────────

export async function getReporteMatrix(
  inicio: string,
  fin:    string,
  turno:  string,
): Promise<ReportePrensaRow[]> {
  const sb = createServiceClient();

  // Get prensas
  const { data: prensas } = await sb
    .from("prensas")
    .select("id, nombre, meta_oee")
    .eq("estado", "activa")
    .order("nombre");
  if (!prensas || prensas.length === 0) return [];

  // Get production
  let q = sb
    .from("produccion")
    .select("prensa_id,tiempo_planeado_min,tiempo_muerto_min,piezas_ok,piezas_nok,causa_paro")
    .gte("fecha", inicio)
    .lte("fecha", fin);
  if (turno !== "all") q = q.eq("turno", Number(turno));

  const { data: prod, error } = await q;
  if (error) throw new Error(error.message);
  const rows = prod ?? [];

  return prensas.map((p) => {
    const pRows = rows.filter((r) => r.prensa_id === p.id);
    const tp = pRows.reduce((s, r) => s + r.tiempo_planeado_min, 0);
    const tm = pRows.reduce((s, r) => s + r.tiempo_muerto_min,   0);
    const ok = pRows.reduce((s, r) => s + r.piezas_ok,           0);
    const nok= pRows.reduce((s, r) => s + r.piezas_nok,          0);

    // Principal paro = causa with most total downtime
    const causaMap = new Map<string, number>();
    for (const r of pRows) {
      if (r.causa_paro && r.tiempo_muerto_min > 0) {
        causaMap.set(r.causa_paro, (causaMap.get(r.causa_paro) ?? 0) + r.tiempo_muerto_min);
      }
    }
    const causaPrincipal = causaMap.size > 0
      ? [...causaMap.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;

    return {
      prensaId:       p.id,
      nombre:         p.nombre,
      oee:            calcOEE(tp, tm, ok, nok),
      piezasOk:       ok,
      piezasNok:      nok,
      scrapRate:      calcScrap(ok, nok),
      disponibilidad: calcDisp(tp, tm),
      tiempoMuerto:   tm,
      causaPrincipal,
      meta:           Math.round(Number(p.meta_oee ?? 0.82) * 100),
    };
  });
}

// ─── Weekly trend (last N weeks, OEE per prensa) ─────────────────────────────

export async function getReporteSemanal(semanas = 4): Promise<{
  prensaNombres: string[];
  rows: ReporteSemanalRow[];
}> {
  const sb = createServiceClient();

  const { data: prensas } = await sb
    .from("prensas")
    .select("id, nombre")
    .eq("estado", "activa")
    .order("nombre");
  if (!prensas || prensas.length === 0) return { prensaNombres: [], rows: [] };

  const now   = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - semanas * 7);

  const { data: prod, error } = await sb
    .from("produccion")
    .select("fecha,prensa_id,tiempo_planeado_min,tiempo_muerto_min,piezas_ok,piezas_nok")
    .gte("fecha", toDateString(start))
    .lte("fecha", toDateString(now))
    .order("fecha");
  if (error) throw new Error(error.message);

  // Build weeks
  const result: ReporteSemanalRow[] = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const wEnd   = new Date(now);
    wEnd.setUTCDate(wEnd.getUTCDate() - i * 7);
    const wStart = new Date(wEnd);
    wStart.setUTCDate(wStart.getUTCDate() - 6);

    const wStartStr = toDateString(wStart);
    const wEndStr   = toDateString(wEnd);

    const label = `${wStart.getUTCDate()} ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][wStart.getUTCMonth()]}`;

    const row: ReporteSemanalRow = { semana: label };
    for (const p of prensas) {
      const pRows = (prod ?? []).filter((r) => {
        const f = (r.fecha as string).split("T")[0];
        return r.prensa_id === p.id && f >= wStartStr && f <= wEndStr;
      });
      const tp  = pRows.reduce((s, r) => s + r.tiempo_planeado_min, 0);
      const tm  = pRows.reduce((s, r) => s + r.tiempo_muerto_min,   0);
      const ok  = pRows.reduce((s, r) => s + r.piezas_ok,           0);
      const nok = pRows.reduce((s, r) => s + r.piezas_nok,          0);
      row[p.nombre] = calcOEE(tp, tm, ok, nok);
    }
    result.push(row);
  }

  return { prensaNombres: prensas.map((p) => p.nombre), rows: result };
}
