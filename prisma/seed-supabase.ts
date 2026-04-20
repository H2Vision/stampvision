/**
 * StampVision — Seed via Supabase REST API
 * Usado cuando la conexión TCP al pooler no está disponible.
 * Usa @supabase/supabase-js con service_role key para bypassear RLS.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── PRNG determinista ────────────────────────────────────────────────────────
let _seed = 98765;
function rng(): number {
  _seed = Math.imul(1664525, _seed) + 1013904223;
  return (_seed >>> 0) / 0x100000000;
}
function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const OPERADORES = [
  "Juan Perez",       "Maria Garcia",     "Carlos Rodriguez", "Ana Martinez",
  "Patricia Diaz",    "Roberto Hernandez","Laura Sanchez",    "Miguel Lopez",
  "Alejandro Flores", "Fernando Torres",  "Gabriela Cruz",    "Sofia Ramirez",
] as const;

const NUMERO_PARTES = [
  "P-1234-A", "P-2345-F", "P-3456-D", "P-5678-B",
  "P-6789-G", "P-7890-E", "P-9012-C", "P-0123-H",
] as const;

const CAUSAS_PARO = [
  "Cambio de bobina",        "Falla electrica",         "Mantenimiento correctivo",
  "Ajuste de herramienta",   "Cambio de dado",          "Cambio de numero de parte",
  "Falla neumatica",         "Calibracion",             "Limpieza de troquel",
  "Problema de alimentador", "Falta de material",
] as const;

// ─── Perfiles de prensas ──────────────────────────────────────────────────────
const PRESS_PROFILES = [
  { nombre: "Prensa 1", tonelaje: 200, velStd: 62.0, metaOEE: 0.85, longStopP: 0.08, highScrapP: 0.08, noStopP: 0.22 },
  { nombre: "Prensa 2", tonelaje: 150, velStd: 46.0, metaOEE: 0.82, longStopP: 0.10, highScrapP: 0.10, noStopP: 0.18 },
  { nombre: "Prensa 3", tonelaje: 80,  velStd: 30.0, metaOEE: 0.80, longStopP: 0.14, highScrapP: 0.07, noStopP: 0.12 },
  { nombre: "Prensa 4", tonelaje: 160, velStd: 55.0, metaOEE: 0.85, longStopP: 0.09, highScrapP: 0.13, noStopP: 0.20 },
  { nombre: "Prensa 5", tonelaje: 100, velStd: 35.0, metaOEE: 0.82, longStopP: 0.07, highScrapP: 0.08, noStopP: 0.25 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}
function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function uuid(): string {
  return crypto.randomUUID();
}

// ─── Generador de turno ───────────────────────────────────────────────────────
function generarTurno(prensaId: string, p: typeof PRESS_PROFILES[0], fecha: Date, turno: number) {
  const tiempoPlaneado = turno === 3 ? 420 : 480;

  const stopRoll = rng();
  let tiempoMuerto: number;
  if (stopRoll < p.noStopP) {
    tiempoMuerto = 0;
  } else if (stopRoll < p.noStopP + p.longStopP) {
    tiempoMuerto = randInt(80, Math.min(160, Math.round(tiempoPlaneado * 0.38)));
  } else {
    tiempoMuerto = randInt(5, 55);
  }

  const tiempoOperativo = tiempoPlaneado - tiempoMuerto;
  const velocidadReal   = round1(p.velStd * (0.85 + rng() * 0.17));
  const totalPiezas     = Math.max(0, Math.round(tiempoOperativo * velocidadReal));
  const scrapRate       = rng() < p.highScrapP ? 0.07 + rng() * 0.11 : 0.020 + rng() * 0.035;
  const piezasNok       = Math.round(totalPiezas * scrapRate);
  const piezasOk        = Math.max(0, totalPiezas - piezasNok);
  const causaParo       = tiempoMuerto >= 10 ? pick(CAUSAS_PARO) : null;

  return {
    id:                  uuid(),
    prensa_id:           prensaId,
    fecha:               dateStr(fecha),
    turno,
    piezas_ok:           piezasOk,
    piezas_nok:          piezasNok,
    tiempo_planeado_min: tiempoPlaneado,
    tiempo_muerto_min:   tiempoMuerto,
    velocidad_real:      velocidadReal,
    causa_paro:          causaParo,
    numero_parte:        pick(NUMERO_PARTES),
    operador:            pick(OPERADORES),
    archivo_origen:      "seed_datos_produccion.xlsx",
  };
}

// ─── Helpers Supabase ─────────────────────────────────────────────────────────
async function insert(table: string, rows: object[]) {
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + BATCH));
    if (error) throw new Error(`Error insertando en ${table}: ${error.message}`);
    process.stdout.write(`\r   ${table}: ${Math.min(i + BATCH, rows.length)} / ${rows.length}  `);
  }
  console.log();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Iniciando seed via Supabase REST API...\n");

  // 1. Limpiar — orden inverso para respetar FK
  console.log("🗑  Limpiando tablas...");
  for (const t of ["alertas", "produccion", "usuarios", "prensas", "configuracion"]) {
    const { error } = await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      // Si no hay filas simplemente continúa
      if (!error.message.includes("Results contain 0 rows")) {
        console.warn(`  ⚠ ${t}: ${error.message}`);
      }
    }
  }
  console.log("   ✓ Tablas vaciadas\n");

  // 2. Crear prensas
  console.log("🏭 Creando prensas...");
  const prensasData = PRESS_PROFILES.map((p) => ({
    id:                 uuid(),
    nombre:             p.nombre,
    tonelaje:           p.tonelaje,
    estado:             "activa",
    velocidad_estandar: p.velStd,
    meta_oee:           p.metaOEE,
  }));
  await insert("prensas", prensasData);
  console.log(`   ✓ ${prensasData.length} prensas creadas\n`);

  // 3. Configuración
  console.log("⚙️  Insertando configuración...");
  const configs = [
    { id: uuid(), clave: "umbral_oee_warning",    valor: "0.80", descripcion: "OEE < este valor → alerta warning" },
    { id: uuid(), clave: "umbral_oee_critical",   valor: "0.70", descripcion: "OEE < este valor → alerta critical" },
    { id: uuid(), clave: "umbral_scrap_warning",  valor: "0.05", descripcion: "Scrap > 5 % → alerta warning" },
    { id: uuid(), clave: "umbral_scrap_critical", valor: "0.10", descripcion: "Scrap > 10 % → alerta critical" },
    { id: uuid(), clave: "umbral_paro_minutos",   valor: "60",   descripcion: "Paros > 60 min → alerta" },
  ];
  await insert("configuracion", configs);
  console.log(`   ✓ ${configs.length} parámetros\n`);

  // 4. Producción — 30 días
  console.log("📊 Generando datos de producción (30 días)...");
  const START_DATE = new Date("2026-03-15T00:00:00.000Z");
  const registros: ReturnType<typeof generarTurno>[] = [];

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const fecha   = addDays(START_DATE, dayOffset);
    const weekend = isWeekend(fecha);

    for (const prensaRow of prensasData) {
      const profile = PRESS_PROFILES.find((p) => p.nombre === prensaRow.nombre)!;
      if (weekend && rng() < 0.30) continue;
      const numTurnos = weekend ? 2 : 3;
      for (let turno = 1; turno <= numTurnos; turno++) {
        registros.push(generarTurno(prensaRow.id, profile, fecha, turno));
      }
    }
  }

  await insert("produccion", registros);
  console.log(`   ✓ ${registros.length} registros de producción\n`);

  // 5. Estadísticas de OEE
  console.log("📈 OEE A×Q por prensa:");
  for (const prensaRow of prensasData) {
    const turnos = registros.filter((r) => r.prensa_id === prensaRow.id);
    const oees = turnos.map((t) => {
      const a = (t.tiempo_planeado_min - t.tiempo_muerto_min) / t.tiempo_planeado_min;
      const totalPz = t.piezas_ok + t.piezas_nok;
      const q = totalPz > 0 ? t.piezas_ok / totalPz : 1;
      return a * q;
    });
    const profile = PRESS_PROFILES.find((p) => p.nombre === prensaRow.nombre)!;
    const avg = oees.reduce((s, v) => s + v, 0) / oees.length;
    const min = Math.min(...oees);
    const max = Math.max(...oees);
    console.log(
      `   ${prensaRow.nombre.padEnd(10)} avg ${(avg*100).toFixed(1).padStart(5)}%` +
      `  min ${(min*100).toFixed(1).padStart(5)}%` +
      `  max ${(max*100).toFixed(1).padStart(5)}%` +
      `  meta ${(profile.metaOEE*100).toFixed(0)}%`
    );
  }

  console.log("\n✅ Seed completado.");
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });
