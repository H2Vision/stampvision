import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  oee: { warning: 80, critical: 70 },
  scrap: { warning: 5, critical: 10 },
  downtime: { warning: 60 },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcOEE(tp: number, tm: number, ok: number, nok: number) {
  if (tp === 0) return 0;
  const A = (tp - tm) / tp;
  const total = ok + nok;
  const Q = total > 0 ? ok / total : 0;
  return Math.round(A * Q * 1000) / 10;
}

function calcScrap(ok: number, nok: number) {
  const t = ok + nok;
  return t > 0 ? Math.round((nok / t) * 1000) / 10 : 0;
}

// ─── Check & insert alerts ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Optional bearer auth for cron callers
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createServiceClient();

  // Last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await sb
    .from("produccion")
    .select(
      "id, prensa_id, fecha, turno, piezas_ok, piezas_nok, tiempo_planeado_min, tiempo_muerto_min, prensas(nombre)"
    )
    .gte("created_at", since);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ checked: true, new_alerts: 0, message: "Sin datos en las últimas 24h" });
  }

  // Get existing unresolved alerts from today (to avoid duplicates)
  const today = new Date().toISOString().split("T")[0];
  const { data: existingAlerts } = await sb
    .from("alertas")
    .select("prensa_id, tipo, mensaje")
    .gte("created_at", today + "T00:00:00Z");

  const existingKeys = new Set(
    (existingAlerts ?? []).map((a) => `${a.prensa_id}:${a.tipo}:${a.mensaje}`)
  );

  const toInsert: Record<string, unknown>[] = [];

  for (const row of rows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prensaNombre = (row.prensas as any)?.nombre ?? row.prensa_id;
    const oee   = calcOEE(row.tiempo_planeado_min, row.tiempo_muerto_min, row.piezas_ok, row.piezas_nok);
    const scrap = calcScrap(row.piezas_ok, row.piezas_nok);
    const tm    = row.tiempo_muerto_min;

    const addAlert = (
      tipo: string,
      severidad: "info" | "warning" | "critical",
      mensaje: string,
      valorActual: number,
      umbral: number
    ) => {
      const key = `${row.prensa_id}:${tipo}:${mensaje}`;
      if (existingKeys.has(key)) return;
      existingKeys.add(key);
      toInsert.push({
        tipo,
        severidad,
        mensaje,
        prensa_id:    row.prensa_id,
        valor_actual: valorActual,
        umbral,
        leida:        false,
      });
    };

    // ── OEE checks ──────────────────────────────────────────────────────────
    if (oee < THRESHOLDS.oee.critical) {
      addAlert(
        "oee_bajo",
        "critical",
        `OEE crítico en ${prensaNombre} — Turno ${row.turno}`,
        oee,
        THRESHOLDS.oee.critical
      );
    } else if (oee < THRESHOLDS.oee.warning) {
      addAlert(
        "oee_bajo",
        "warning",
        `OEE bajo en ${prensaNombre} — Turno ${row.turno}`,
        oee,
        THRESHOLDS.oee.warning
      );
    }

    // ── Scrap checks ────────────────────────────────────────────────────────
    if (scrap > THRESHOLDS.scrap.critical) {
      addAlert(
        "scrap_alto",
        "critical",
        `Scrap crítico en ${prensaNombre} — Turno ${row.turno}`,
        scrap,
        THRESHOLDS.scrap.critical
      );
    } else if (scrap > THRESHOLDS.scrap.warning) {
      addAlert(
        "scrap_alto",
        "warning",
        `Scrap elevado en ${prensaNombre} — Turno ${row.turno}`,
        scrap,
        THRESHOLDS.scrap.warning
      );
    }

    // ── Downtime check ──────────────────────────────────────────────────────
    if (tm > THRESHOLDS.downtime.warning) {
      addAlert(
        "paro_largo",
        "warning",
        `Tiempo muerto excesivo en ${prensaNombre} — Turno ${row.turno}`,
        tm,
        THRESHOLDS.downtime.warning
      );
    }
  }

  // Bulk insert
  let inserted = 0;
  if (toInsert.length > 0) {
    const { error: insertErr, data: inserted_data } = await sb
      .from("alertas")
      .insert(toInsert)
      .select("id");

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    inserted = inserted_data?.length ?? 0;
  }

  return NextResponse.json({
    checked:    true,
    new_alerts: inserted,
    total_rows: rows.length,
    message:    `Revisadas ${rows.length} filas, ${inserted} alertas nuevas generadas`,
  });
}

// GET: also allows triggering a check via simple GET (useful for cron services)
export async function GET(req: NextRequest) {
  return POST(req);
}
