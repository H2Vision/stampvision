import { createServiceClient } from "@/lib/supabase/service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KPIData {
  oeePromedio:         number;
  totalPiezasOk:       number;
  scrapRate:           number;
  disponibilidad:      number;
  oeeDelta:            number;
  piezasOkDelta:       number;
  scrapRateDelta:      number;
  disponibilidadDelta: number;
}

export interface OEEByPrensaRow {
  prensaId:      string;
  nombre:        string;
  oee:           number;
  disponibilidad:number;
  scrapRate:     number;
  piezasOk:      number;
  meta:          number;
}

export interface OEETrendRow {
  fecha: string;
  oee:   number;
  meta:  number;
}

export interface ProduccionTableRow {
  id:             string;
  prensa:         string;
  turno:          number;
  piezasOk:       number;
  piezasNok:      number;
  oee:            number;
  disponibilidad: number;
  scrapRate:      number;
  tiempoMuerto:   number;
  causaParo:      string | null;
  numeroParte:    string;
  operador:       string;
}

export interface DashboardPrensaOption {
  id:     string;
  nombre: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

function calcOEE(tp: number, tm: number, ok: number, nok: number): number {
  if (tp === 0) return 0;
  const A = (tp - tm) / tp;
  const total = ok + nok;
  const Q = total > 0 ? ok / total : 0;
  return Math.round(A * Q * 1000) / 10;
}

function calcDisponibilidad(tp: number, tm: number): number {
  if (tp === 0) return 0;
  return Math.round(((tp - tm) / tp) * 1000) / 10;
}

function calcScrapRate(ok: number, nok: number): number {
  const total = ok + nok;
  if (total === 0) return 0;
  return Math.round((nok / total) * 1000) / 10;
}

interface RawRow {
  tiempo_planeado_min: number;
  tiempo_muerto_min:   number;
  piezas_ok:           number;
  piezas_nok:          number;
}

function aggregateKPI(rows: RawRow[]) {
  if (rows.length === 0) return { oee: 0, piezasOk: 0, scrapRate: 0, disponibilidad: 0 };
  const tp  = rows.reduce((s, r) => s + r.tiempo_planeado_min, 0);
  const tm  = rows.reduce((s, r) => s + r.tiempo_muerto_min,   0);
  const ok  = rows.reduce((s, r) => s + r.piezas_ok,           0);
  const nok = rows.reduce((s, r) => s + r.piezas_nok,          0);
  return {
    oee:            calcOEE(tp, tm, ok, nok),
    piezasOk:       ok,
    scrapRate:      calcScrapRate(ok, nok),
    disponibilidad: calcDisponibilidad(tp, tm),
  };
}

// ─── Query: prensas list ──────────────────────────────────────────────────────

export async function getDashboardPrensas(): Promise<DashboardPrensaOption[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("prensas")
    .select("id, nombre")
    .eq("estado", "activa")
    .order("nombre");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Query: KPIs ─────────────────────────────────────────────────────────────

export async function getDashboardKPIs(
  dateStr:  string,
  prensaId: string,
  turno:    string,
): Promise<KPIData> {
  const sb = createServiceClient();

  const prevDate = new Date(dateStr + "T00:00:00Z");
  prevDate.setUTCDate(prevDate.getUTCDate() - 1);
  const prevStr = toDateString(prevDate);

  function buildQuery(date: string) {
    let q = sb
      .from("produccion")
      .select("tiempo_planeado_min,tiempo_muerto_min,piezas_ok,piezas_nok")
      .eq("fecha", date);
    if (prensaId !== "all") q = q.eq("prensa_id", prensaId);
    if (turno    !== "all") q = q.eq("turno", Number(turno));
    return q;
  }

  const [todayRes, prevRes] = await Promise.all([
    buildQuery(dateStr),
    buildQuery(prevStr),
  ]);

  if (todayRes.error) throw new Error(todayRes.error.message);
  if (prevRes.error)  throw new Error(prevRes.error.message);

  const today     = aggregateKPI(todayRes.data ?? []);
  const yesterday = aggregateKPI(prevRes.data  ?? []);

  return {
    oeePromedio:         today.oee,
    totalPiezasOk:       today.piezasOk,
    scrapRate:           today.scrapRate,
    disponibilidad:      today.disponibilidad,
    oeeDelta:            Math.round((today.oee            - yesterday.oee)            * 10) / 10,
    piezasOkDelta:       today.piezasOk - yesterday.piezasOk,
    scrapRateDelta:      Math.round((today.scrapRate      - yesterday.scrapRate)      * 10) / 10,
    disponibilidadDelta: Math.round((today.disponibilidad - yesterday.disponibilidad) * 10) / 10,
  };
}

// ─── Query: OEE by prensa ─────────────────────────────────────────────────────

export async function getOEEByPrensaData(dateStr: string): Promise<OEEByPrensaRow[]> {
  const sb = createServiceClient();

  const { data, error } = await sb
    .from("produccion")
    .select("prensa_id,tiempo_planeado_min,tiempo_muerto_min,piezas_ok,piezas_nok,prensas(nombre,meta_oee)")
    .eq("fecha", dateStr);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  // Group by prensa_id
  const grouped = new Map<string, typeof data>();
  for (const r of data) {
    if (!grouped.has(r.prensa_id)) grouped.set(r.prensa_id, []);
    grouped.get(r.prensa_id)!.push(r);
  }

  const result: OEEByPrensaRow[] = [];
  for (const [prensaId, rows] of grouped) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prensa = (rows[0].prensas as any);
    const kpi    = aggregateKPI(rows);
    result.push({
      prensaId,
      nombre:         prensa?.nombre ?? prensaId,
      oee:            kpi.oee,
      disponibilidad: kpi.disponibilidad,
      scrapRate:      kpi.scrapRate,
      piezasOk:       kpi.piezasOk,
      meta:           Math.round(Number(prensa?.meta_oee ?? 0.82) * 100),
    });
  }

  return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// ─── Query: OEE trend 30 days ─────────────────────────────────────────────────

export async function getOEETrendData(days = 30): Promise<OEETrendRow[]> {
  const sb = createServiceClient();

  // Most recent date with data
  const { data: last } = await sb
    .from("produccion")
    .select("fecha")
    .order("fecha", { ascending: false })
    .limit(1)
    .single();

  if (!last) return [];

  const endDate   = last.fecha as string;
  const startDate = new Date(endDate + "T00:00:00Z");
  startDate.setUTCDate(startDate.getUTCDate() - days + 1);
  const startStr  = toDateString(startDate);

  const { data, error } = await sb
    .from("produccion")
    .select("fecha,tiempo_planeado_min,tiempo_muerto_min,piezas_ok,piezas_nok")
    .gte("fecha", startStr)
    .lte("fecha", endDate)
    .order("fecha");

  if (error) throw new Error(error.message);

  // Avg meta_oee across all prensas
  const { data: metaData } = await sb
    .from("prensas")
    .select("meta_oee");
  const metaOEE = metaData && metaData.length > 0
    ? Math.round(metaData.reduce((s, r) => s + Number(r.meta_oee), 0) / metaData.length * 100)
    : 82;

  // Group by date
  const grouped = new Map<string, typeof data>();
  for (const r of (data ?? [])) {
    const key = (r.fecha as string).split("T")[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const SHORT_MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return Array.from(grouped.entries()).map(([dateKey, dayRows]) => {
    const kpi = aggregateKPI(dayRows);
    const d   = new Date(dateKey + "T00:00:00Z");
    return {
      fecha: `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`,
      oee:   kpi.oee,
      meta:  metaOEE,
    };
  });
}

// ─── Query: production table ──────────────────────────────────────────────────

export async function getProduccionTableData(
  dateStr:  string,
  prensaId: string,
  turno:    string,
): Promise<ProduccionTableRow[]> {
  const sb = createServiceClient();

  let q = sb
    .from("produccion")
    .select("id,turno,piezas_ok,piezas_nok,tiempo_planeado_min,tiempo_muerto_min,causa_paro,numero_parte,operador,prensas(nombre)")
    .eq("fecha", dateStr)
    .order("turno");

  if (prensaId !== "all") q = q.eq("prensa_id", prensaId);
  if (turno    !== "all") q = q.eq("turno", Number(turno));

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id:             r.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prensa:         (r.prensas as any)?.nombre ?? "—",
    turno:          r.turno,
    piezasOk:       r.piezas_ok,
    piezasNok:      r.piezas_nok,
    oee:            calcOEE(r.tiempo_planeado_min, r.tiempo_muerto_min, r.piezas_ok, r.piezas_nok),
    disponibilidad: calcDisponibilidad(r.tiempo_planeado_min, r.tiempo_muerto_min),
    scrapRate:      calcScrapRate(r.piezas_ok, r.piezas_nok),
    tiempoMuerto:   r.tiempo_muerto_min,
    causaParo:      r.causa_paro,
    numeroParte:    r.numero_parte,
    operador:       r.operador,
  }));
}

// ─── Helper: most recent date with data ───────────────────────────────────────

export async function getMostRecentDate(): Promise<string> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("produccion")
    .select("fecha")
    .order("fecha", { ascending: false })
    .limit(1)
    .single();
  if (data?.fecha) return (data.fecha as string).split("T")[0];
  return toDateString(new Date());
}
