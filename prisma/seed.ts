/**
 * StampVision — Seed de datos de producción
 *
 * Genera:
 *   • 5 prensas con perfiles basados en el CSV de referencia
 *   • 5 entradas de configuración global
 *   • ~400 registros de producción (30 días, 3 turnos/día, 5 prensas)
 *     OEE general 65-95 %, con paros largos y scrap alto realistas
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

// ─── PRNG determinista (LCG) para reproducibilidad ───────────────────────────

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

// ─── Constantes derivadas del CSV ─────────────────────────────────────────────

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

// ─── Perfiles de prensas (ajustados al CSV) ───────────────────────────────────
//   velStd  = velocidad estándar en piezas/min
//   longStopP = probabilidad de paro largo por turno (~10 % promedio CSV)
//   highScrapP= probabilidad de turno con scrap alto (~10 % promedio CSV)

interface PressProfile {
  nombre: string;
  tonelaje: number;
  velStd: number;
  metaOEE: number;
  longStopP: number;   // prob. paro largo (>80 min)
  highScrapP: number;  // prob. scrap alto (>7 %)
  noStopP: number;     // prob. sin paro
}

const PRESS_PROFILES: PressProfile[] = [
  // Prensa 1 — gran prensa, mejor OEE, velocidad alta
  { nombre: "Prensa 1", tonelaje: 200, velStd: 62.0, metaOEE: 0.85, longStopP: 0.08, highScrapP: 0.08, noStopP: 0.22 },
  // Prensa 2 — prensa media, OEE moderado
  { nombre: "Prensa 2", tonelaje: 150, velStd: 46.0, metaOEE: 0.82, longStopP: 0.10, highScrapP: 0.10, noStopP: 0.18 },
  // Prensa 3 — prensa pequeña, más paros, OEE menor
  { nombre: "Prensa 3", tonelaje: 80,  velStd: 30.0, metaOEE: 0.80, longStopP: 0.14, highScrapP: 0.07, noStopP: 0.12 },
  // Prensa 4 — alta velocidad, scrap variable, algunos paros largos
  { nombre: "Prensa 4", tonelaje: 160, velStd: 55.0, metaOEE: 0.85, longStopP: 0.09, highScrapP: 0.13, noStopP: 0.20 },
  // Prensa 5 — prensa estable, desempeño consistente pero conservador
  { nombre: "Prensa 5", tonelaje: 100, velStd: 35.0, metaOEE: 0.82, longStopP: 0.07, highScrapP: 0.08, noStopP: 0.25 },
];

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay(); // 0 = domingo, 6 = sábado
  return day === 0 || day === 6;
}

// ─── Generador de turno ───────────────────────────────────────────────────────

interface TurnoRecord {
  prensa_id: string;
  fecha: Date;
  turno: number;
  piezas_ok: number;
  piezas_nok: number;
  tiempo_planeado_min: number;
  tiempo_muerto_min: number;
  velocidad_real: number;
  causa_paro: string | null;
  numero_parte: string;
  operador: string;
  archivo_origen: string;
}

function generarTurno(prensaId: string, p: PressProfile, fecha: Date, turno: number): TurnoRecord {
  // Turno 3 = turno nocturno reducido (como en el CSV: 420 min vs 480)
  const tiempoPlaneado = turno === 3 ? 420 : 480;

  // ── Tiempo muerto ──────────────────────────────────────────────────────────
  const stopRoll = rng();
  let tiempoMuerto: number;

  if (stopRoll < p.noStopP) {
    // Sin paro
    tiempoMuerto = 0;
  } else if (stopRoll < p.noStopP + p.longStopP) {
    // Paro largo: 80-160 min (algunos turnos con OEE ~55-70 %)
    tiempoMuerto = randInt(80, Math.min(160, Math.round(tiempoPlaneado * 0.38)));
  } else {
    // Paro normal: 5-55 min
    tiempoMuerto = randInt(5, 55);
  }

  const tiempoOperativo = tiempoPlaneado - tiempoMuerto;

  // ── Velocidad real (85-102 % de la estándar) ──────────────────────────────
  const perfFactor = 0.85 + rng() * 0.17;
  const velocidadReal = round1(p.velStd * perfFactor);

  // ── Piezas totales producidas ─────────────────────────────────────────────
  const totalPiezas = Math.max(0, Math.round(tiempoOperativo * velocidadReal));

  // ── Tasa de scrap ─────────────────────────────────────────────────────────
  const isHighScrap = rng() < p.highScrapP;
  const scrapRate = isHighScrap
    ? 0.07 + rng() * 0.11    // 7-18 % → scrap alto
    : 0.020 + rng() * 0.035; // 2-5.5 % → scrap normal

  const piezasNok = Math.round(totalPiezas * scrapRate);
  const piezasOk  = Math.max(0, totalPiezas - piezasNok);

  // ── Causa de paro ─────────────────────────────────────────────────────────
  const causaParo = tiempoMuerto >= 10 ? pick(CAUSAS_PARO) : null;

  return {
    prensa_id:           prensaId,
    fecha,
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Iniciando seed de StampVision...\n");

  // ── 1. Limpiar datos existentes ───────────────────────────────────────────
  console.log("🗑  Limpiando tablas...");
  await prisma.alerta.deleteMany();
  await prisma.produccion.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.prensa.deleteMany();
  await prisma.configuracion.deleteMany();
  console.log("   ✓ Tablas vaciadas\n");

  // ── 2. Crear prensas ──────────────────────────────────────────────────────
  console.log("🏭 Creando prensas...");
  const prensas = await Promise.all(
    PRESS_PROFILES.map((p) =>
      prisma.prensa.create({
        data: {
          nombre:             p.nombre,
          tonelaje:           p.tonelaje,
          estado:             "activa",
          velocidad_estandar: p.velStd,
          meta_oee:           p.metaOEE,
        },
      })
    )
  );
  prensas.forEach((p) => console.log(`   ✓ ${p.nombre} (id: ${p.id.slice(0, 8)}...)`));
  console.log();

  // ── 3. Configuración global ───────────────────────────────────────────────
  console.log("⚙️  Insertando configuración...");
  const configs = [
    { clave: "umbral_oee_warning",    valor: "0.80", descripcion: "OEE por debajo de este valor genera alerta warning" },
    { clave: "umbral_oee_critical",   valor: "0.70", descripcion: "OEE por debajo de este valor genera alerta critical" },
    { clave: "umbral_scrap_warning",  valor: "0.05", descripcion: "Tasa de scrap > 5 % genera alerta warning" },
    { clave: "umbral_scrap_critical", valor: "0.10", descripcion: "Tasa de scrap > 10 % genera alerta critical" },
    { clave: "umbral_paro_minutos",   valor: "60",   descripcion: "Paros mayores a 60 min generan alerta" },
  ];
  await prisma.configuracion.createMany({ data: configs });
  console.log(`   ✓ ${configs.length} parámetros insertados\n`);

  // ── 4. Datos de producción — 30 días ─────────────────────────────────────
  console.log("📊 Generando datos de producción (30 días)...");

  const START_DATE = new Date("2026-03-15T00:00:00.000Z");
  const DAYS = 30;

  const registros: TurnoRecord[] = [];

  for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
    const fecha   = addDays(START_DATE, dayOffset);
    const weekend = isWeekend(fecha);

    for (const prensa of prensas) {
      const profile = PRESS_PROFILES.find((p) => p.nombre === prensa.nombre)!;

      // En fin de semana, ~30 % de probabilidad de que la prensa no opere
      if (weekend && rng() < 0.30) continue;

      // Fin de semana → 2 turnos; día hábil → 3 turnos
      const numTurnos = weekend ? 2 : 3;

      for (let turno = 1; turno <= numTurnos; turno++) {
        registros.push(generarTurno(prensa.id, profile, fecha, turno));
      }
    }
  }

  // Insertar en lotes de 100 para no saturar el pooler
  const BATCH = 100;
  for (let i = 0; i < registros.length; i += BATCH) {
    await prisma.produccion.createMany({ data: registros.slice(i, i + BATCH) });
    process.stdout.write(`\r   Insertando... ${Math.min(i + BATCH, registros.length)} / ${registros.length}`);
  }
  console.log(`\n   ✓ ${registros.length} registros de producción insertados\n`);

  // ── 5. Estadísticas de OEE para validación visual ────────────────────────
  // OEE = Availability × Quality  (Performance ≈ 1 pues calculamos sobre tiempo operativo real)
  console.log("📈 OEE promedio por prensa:");
  for (const prensa of prensas) {
    const turnos = registros.filter((r) => r.prensa_id === prensa.id);
    const oees = turnos.map((t) => {
      const availability = (t.tiempo_planeado_min - t.tiempo_muerto_min) / t.tiempo_planeado_min;
      const totalPz      = t.piezas_ok + t.piezas_nok;
      const quality      = totalPz > 0 ? t.piezas_ok / totalPz : 1;
      return availability * quality;
    });
    const profile = PRESS_PROFILES.find((p) => p.nombre === prensa.nombre)!;
    const avgOEE  = oees.reduce((s, v) => s + v, 0) / oees.length;
    const minOEE  = Math.min(...oees);
    const maxOEE  = Math.max(...oees);
    console.log(
      `   ${prensa.nombre.padEnd(10)} | avg ${(avgOEE * 100).toFixed(1).padStart(5)} %` +
      ` | min ${(minOEE * 100).toFixed(1).padStart(5)} %` +
      ` | max ${(maxOEE * 100).toFixed(1).padStart(5)} %` +
      ` | meta ${(profile.metaOEE * 100).toFixed(0)} %`
    );
  }

  console.log("\n✅ Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("\n❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
