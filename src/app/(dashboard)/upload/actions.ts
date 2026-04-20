"use server";

import { createServiceClient } from "@/lib/supabase/service";

export interface UploadRow {
  fecha:               string; // YYYY-MM-DD
  prensa_nombre:       string;
  turno:               number;
  piezas_ok:           number;
  piezas_nok:          number;
  tiempo_planeado_min: number;
  tiempo_muerto_min:   number;
  causa_paro:          string;
  numero_parte:        string;
  operador:            string;
}

export interface UploadResult {
  ok:      boolean;
  inserted: number;
  errors:  string[];
}

export async function uploadProduccionRows(rows: UploadRow[]): Promise<UploadResult> {
  const sb     = createServiceClient();
  const errors: string[] = [];

  // Resolve prensa names → ids
  const { data: prensas, error: prensasErr } = await sb
    .from("prensas")
    .select("id, nombre");

  if (prensasErr) return { ok: false, inserted: 0, errors: [prensasErr.message] };

  const prensaMap = new Map<string, string>(
    (prensas ?? []).map((p) => [p.nombre.toLowerCase().trim(), p.id])
  );

  const toInsert: Record<string, unknown>[] = [];

  rows.forEach((row, i) => {
    const lineNum = i + 2; // 1-based, +1 for header
    const prensaId = prensaMap.get(row.prensa_nombre.toLowerCase().trim());
    if (!prensaId) {
      errors.push(`Fila ${lineNum}: prensa "${row.prensa_nombre}" no encontrada`);
      return;
    }
    if (!row.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(row.fecha)) {
      errors.push(`Fila ${lineNum}: fecha inválida "${row.fecha}" (use YYYY-MM-DD)`);
      return;
    }
    if (row.turno < 1 || row.turno > 3) {
      errors.push(`Fila ${lineNum}: turno debe ser 1, 2 ó 3`);
      return;
    }
    toInsert.push({
      prensa_id:            prensaId,
      fecha:                row.fecha,
      turno:                row.turno,
      piezas_ok:            row.piezas_ok,
      piezas_nok:           row.piezas_nok,
      tiempo_planeado_min:  row.tiempo_planeado_min,
      tiempo_muerto_min:    row.tiempo_muerto_min,
      causa_paro:           row.causa_paro || null,
      numero_parte:         row.numero_parte,
      operador:             row.operador,
      archivo_origen:       "manual_upload",
    });
  });

  if (toInsert.length === 0) {
    return { ok: false, inserted: 0, errors: errors.length ? errors : ["No hay filas válidas para insertar"] };
  }

  // Insert in chunks of 500
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const chunk = toInsert.slice(i, i + 500);
    const { error } = await sb.from("produccion").insert(chunk);
    if (error) {
      errors.push(`Error al insertar bloque ${Math.floor(i / 500) + 1}: ${error.message}`);
    } else {
      inserted += chunk.length;
    }
  }

  return { ok: inserted > 0, inserted, errors };
}
