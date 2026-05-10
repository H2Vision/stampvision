import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { createServiceClient } from "@/lib/supabase/service";
import { buildEmpleadosContextBlock } from "@/lib/empleados-context";

export const runtime = "nodejs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DataCard {
  type: "kpi" | "table" | "ranking";
  label: string;
  value?: string;
  delta?: string;
  positive?: boolean;
  rows?: { label: string; value: string; color?: string }[];
}

// ─── Company context (loaded once at module level, cached in Node memory) ─────

let _companyContext: string | null = null;

function getCompanyContext(): string {
  if (_companyContext) return _companyContext;
  try {
    _companyContext = readFileSync(
      join(process.cwd(), "src/lib/company-context.md"),
      "utf-8"
    );
  } catch {
    _companyContext = "H2 Stamping — empresa de estampado metálico industrial.";
  }
  return _companyContext;
}

// ─── Temporal context detection ───────────────────────────────────────────────

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function detectDateRange(message: string): {
  startDate: string;
  endDate: string;
  label: string;
} {
  const lower = message.toLowerCase();
  // Mexico UTC-6
  const now = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const isoMatch = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return { startDate: isoMatch[1], endDate: isoMatch[1], label: `fecha ${isoMatch[1]}` };
  }

  if (lower.includes("hoy") || lower.includes("today")) {
    const s = toISO(now);
    return { startDate: s, endDate: s, label: "hoy" };
  }

  if (lower.includes("ayer") || lower.includes("yesterday")) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - 1);
    const s = toISO(d);
    return { startDate: s, endDate: s, label: "ayer" };
  }

  if (lower.includes("esta semana") || lower.includes("semana actual")) {
    const d = new Date(now);
    const dow = d.getUTCDay();
    const daysFromMonday = dow === 0 ? 6 : dow - 1;
    d.setUTCDate(d.getUTCDate() - daysFromMonday);
    return { startDate: toISO(d), endDate: toISO(now), label: "esta semana" };
  }

  if (lower.includes("semana pasada") || lower.includes("última semana")) {
    const d = new Date(now);
    const dow = d.getUTCDay();
    const daysFromMonday = dow === 0 ? 6 : dow - 1;
    d.setUTCDate(d.getUTCDate() - daysFromMonday - 7);
    const end = new Date(d);
    end.setUTCDate(end.getUTCDate() + 6);
    return { startDate: toISO(d), endDate: toISO(end), label: "la semana pasada" };
  }

  if (lower.includes("este mes") || lower.includes("mes actual")) {
    const d = new Date(now);
    d.setUTCDate(1);
    return { startDate: toISO(d), endDate: toISO(now), label: "este mes" };
  }

  if (lower.includes("mes pasado") || lower.includes("último mes")) {
    const d = new Date(now);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - 1);
    const end = new Date(now);
    end.setUTCDate(0);
    return { startDate: toISO(d), endDate: toISO(end), label: "el mes pasado" };
  }

  if (lower.includes("últimos 7 días") || lower.includes("7 días")) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - 7);
    return { startDate: toISO(d), endDate: toISO(now), label: "los últimos 7 días" };
  }

  if (lower.includes("últimos 30 días") || lower.includes("30 días")) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - 30);
    return { startDate: toISO(d), endDate: toISO(now), label: "los últimos 30 días" };
  }

  // Default → last 7 days
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 7);
  return { startDate: toISO(d), endDate: toISO(now), label: "los últimos 7 días" };
}

// ─── Supabase data query ──────────────────────────────────────────────────────

async function fetchProductionData(startDate: string, endDate: string) {
  const sb = createServiceClient();

  const { data, error } = await sb
    .from("produccion")
    .select(
      "fecha, turno, piezas_ok, piezas_nok, piezas_planeadas, tiempo_planeado_min, tiempo_muerto_min, velocidad_real, causa_paro, numero_parte, operador, prensas(nombre, tonelaje, velocidad_estandar, meta_oee)"
    )
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .order("fecha", { ascending: false })
    .limit(300);

  if (error || !data) return { text: "Sin datos disponibles para este período.", cards: [] as DataCard[] };

  const byPrensa = new Map<
    string,
    {
      tp: number; tm: number; ok: number; nok: number; planeadas: number;
      velocidadRealSum: number; velocidadRealCount: number;
      velocidadEstandar: number; metaOee: number; tonelaje: number;
      operadores: Set<string>; causas: string[];
    }
  >();

  for (const r of data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prensa = r.prensas as any;
    const nombre = prensa?.nombre ?? "Desconocida";
    if (!byPrensa.has(nombre)) {
      byPrensa.set(nombre, {
        tp: 0, tm: 0, ok: 0, nok: 0, planeadas: 0,
        velocidadRealSum: 0, velocidadRealCount: 0,
        velocidadEstandar: prensa?.velocidad_estandar ?? 0,
        metaOee: prensa?.meta_oee != null ? Math.round(prensa.meta_oee * 100) : 75,
        tonelaje: prensa?.tonelaje ?? 0,
        operadores: new Set<string>(),
        causas: [],
      });
    }
    const acc = byPrensa.get(nombre)!;
    acc.tp += r.tiempo_planeado_min;
    acc.tm += r.tiempo_muerto_min;
    acc.ok += r.piezas_ok;
    acc.nok += r.piezas_nok;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acc.planeadas += (r as any).piezas_planeadas ?? 0;
    if (r.velocidad_real != null) {
      acc.velocidadRealSum += Number(r.velocidad_real);
      acc.velocidadRealCount += 1;
    }
    if (r.operador) acc.operadores.add(r.operador);
    if (r.causa_paro) acc.causas.push(r.causa_paro);
  }

  let totalTP = 0, totalTM = 0, totalOK = 0, totalNOK = 0, totalPlaneadas = 0;
  for (const [, v] of byPrensa) {
    totalTP += v.tp;
    totalTM += v.tm;
    totalOK += v.ok;
    totalNOK += v.nok;
    totalPlaneadas += v.planeadas;
  }

  // ── Fórmulas OEE oficiales H2 Stamping (Presentación OEE 17.04.2026 - Diego Yañez) ──

  /** Disponibilidad = Tiempo Trabajado / Tiempo Planeado */
  function disponibilidad(tp: number, tm: number): number {
    return tp > 0 ? Math.round(((tp - tm) / tp) * 1000) / 10 : 0;
  }

  /** Rendimiento = Piezas Producidas / Piezas Planeadas (cap a 100%) */
  function rendimiento(ok: number, nok: number, planeadas: number): number {
    if (planeadas <= 0) return 100;
    const r = Math.min((ok + nok) / planeadas, 1);
    return Math.round(r * 1000) / 10;
  }

  /** Calidad = Piezas OK first-pass / Piezas Producidas Totales */
  function calidad(ok: number, nok: number): number {
    const total = ok + nok;
    return total > 0 ? Math.round((ok / total) * 1000) / 10 : 0;
  }

  /** Scrap Rate = Piezas NOK / Piezas Totales × 100% */
  function scrap(ok: number, nok: number): number {
    const total = ok + nok;
    return total > 0 ? Math.round((nok / total) * 1000) / 10 : 0;
  }

  /** OEE Oficial H2 Stamping = Disponibilidad × Rendimiento × Calidad (valores en %) */
  function oee(disp: number, rend: number, qual: number): number {
    return Math.round((disp / 100) * (rend / 100) * (qual / 100) * 1000) / 10;
  }

  /**
   * Clasificación oficial H2 Stamping 2026 (Meta: 75%)
   * <65% Inaceptable | 66-75% Regular | 76-85% Aceptable | 86-95% Bueno | >95% Excelente
   */
  function classifyOEE(value: number): { label: string; color: string } {
    if (value < 65)  return { label: "Inaceptable", color: "red" };
    if (value <= 75) return { label: "Regular",     color: "orange" };
    if (value <= 85) return { label: "Aceptable",   color: "yellow" };
    if (value <= 95) return { label: "Bueno",       color: "green" };
    return             { label: "Excelente",         color: "green" };
  }

  const META_OEE = 75; // Meta oficial H2 Stamping 2026

  const globalDisp = disponibilidad(totalTP, totalTM);
  const globalRend = rendimiento(totalOK, totalNOK, totalPlaneadas);
  const globalQual = calidad(totalOK, totalNOK);
  const globalOEE  = oee(globalDisp, globalRend, globalQual);
  const globalScrap = scrap(totalOK, totalNOK);
  const globalClass = classifyOEE(globalOEE);

  const prensaStats = Array.from(byPrensa.entries())
    .map(([nombre, v]) => {
      const d = disponibilidad(v.tp, v.tm);
      const r = rendimiento(v.ok, v.nok, v.planeadas);
      const q = calidad(v.ok, v.nok);
      const o = oee(d, r, q);
      const velocidadRealAvg = v.velocidadRealCount > 0
        ? Math.round(v.velocidadRealSum / v.velocidadRealCount * 10) / 10
        : null;
      return {
        nombre,
        oee: o,
        disp: d,
        rend: r,
        qual: q,
        scrap: scrap(v.ok, v.nok),
        ok: v.ok,
        nok: v.nok,
        planeadas: v.planeadas,
        velocidadReal: velocidadRealAvg,
        velocidadEstandar: v.velocidadEstandar,
        metaOee: v.metaOee,
        tonelaje: v.tonelaje,
        operadores: [...v.operadores],
        classification: classifyOEE(o),
        vsPropiaMeta: o >= v.metaOee ? "✓ sobre meta" : `✗ bajo meta (meta: ${v.metaOee}%)`,
        causas: [...new Set(v.causas)].slice(0, 3),
      };
    })
    .sort((a, b) => b.oee - a.oee);

  const worstScrap = [...prensaStats].sort((a, b) => b.scrap - a.scrap)[0];

  const summaryLines = [
    `Período consultado: ${startDate} al ${endDate}`,
    `Meta OEE H2 Stamping 2026: ${META_OEE}%`,
    ``,
    `=== KPIs Globales de Planta ===`,
    `OEE Global: ${globalOEE}% (${globalClass.label})`,
    `  ├─ Disponibilidad: ${globalDisp}%`,
    `  ├─ Rendimiento: ${globalRend}%`,
    `  └─ Calidad (first-pass): ${globalQual}%`,
    `Scrap Rate: ${globalScrap}%`,
    `Total piezas OK: ${totalOK.toLocaleString()} | NOK: ${totalNOK.toLocaleString()} | Planeadas: ${totalPlaneadas.toLocaleString()}`,
    ``,
    `=== OEE por Centro de Trabajo (Prensas / Ensamble) ===`,
    ...prensaStats.map((p) => {
      const velInfo = p.velocidadReal != null
        ? ` | Vel real: ${p.velocidadReal} pzs/min vs estándar: ${p.velocidadEstandar} pzs/min`
        : "";
      const ops = p.operadores.length > 0 ? ` | Operadores: ${p.operadores.join(", ")}` : "";
      return `  ${p.nombre} (${p.tonelaje}t): OEE ${p.oee}% (${p.classification.label}) — ${p.vsPropiaMeta} | D ${p.disp}% × R ${p.rend}% × Q ${p.qual}% | OK ${p.ok.toLocaleString()} | NOK ${p.nok} | Plan ${p.planeadas.toLocaleString()}${velInfo}${ops}`;
    }),
  ];

  const causasTop = data
    .map((r) => r.causa_paro)
    .filter(Boolean)
    .reduce((acc: Record<string, number>, c) => {
      acc[c!] = (acc[c!] || 0) + 1;
      return acc;
    }, {});

  const topCausas = Object.entries(causasTop)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topCausas.length > 0) {
    summaryLines.push("", "Causas de paro más frecuentes:");
    topCausas.forEach(([causa, count]) => {
      summaryLines.push(`  ${causa}: ${count} ocurrencia(s)`);
    });
  }

  const cards: DataCard[] = [
    { type: "kpi", label: "OEE Global",    value: `${globalOEE}%`,          delta: globalClass.label, positive: globalOEE >= META_OEE },
    { type: "kpi", label: "Disponibilidad", value: `${globalDisp}%`,        positive: globalDisp >= 90 },
    { type: "kpi", label: "Rendimiento",   value: `${globalRend}%`,         positive: globalRend >= 90 },
    { type: "kpi", label: "Calidad",        value: `${globalQual}%`,        positive: globalQual >= 95 },
    { type: "kpi", label: "Scrap Rate",     value: `${globalScrap}%`,       positive: globalScrap < 5 },
    { type: "kpi", label: "Piezas OK",      value: totalOK.toLocaleString(), positive: true },
    {
      type: "ranking",
      label: "OEE por Centro de Trabajo",
      rows: prensaStats.map((p) => ({
        label: p.nombre,
        value: `${p.oee}% (${p.classification.label})`,
        color: p.classification.color,
      })),
    },
  ];

  if (worstScrap) {
    cards.push({
      type: "kpi",
      label: "Mayor Scrap",
      value: `${worstScrap.nombre}: ${worstScrap.scrap}%`,
      positive: false,
    });
  }

  return { text: summaryLines.join("\n"), cards };
}

// ─── API Route ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    if (!messages?.length) {
      return new Response("Mensajes requeridos", { status: 400 });
    }

    const lastMsg = messages[messages.length - 1].content;
    const { startDate, endDate, label } = detectDateRange(lastMsg);

    const [{ text: productionText, cards }, empleadosBlock] = await Promise.all([
      fetchProductionData(startDate, endDate),
      buildEmpleadosContextBlock(),
    ]);

    const companyContext = getCompanyContext();

    // ── System prompt with prompt caching ──────────────────────────────────────
    // The company context block uses cache_control so Anthropic caches it across
    // requests. Only the live production data block changes each call.
    // Anthropic caches any block marked with cache_control for ~5 minutes (TTL).
    // This saves ~70-80% of input tokens on repeated queries.
    const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
      {
        type: "text",
        text: `Eres **H2 Insight**, el consultor de manufactura de IA integrado al MES de **H2 Stamping México** (planta Querétaro). No eres un chatbot genérico: eres un experto senior en estampado de alta precisión, ensamble y manufactura industrial que conoce a fondo esta planta.

## Idioma

- **Detecta automáticamente el idioma del usuario en CADA mensaje** y responde SIEMPRE en el mismo idioma:
  - **Español** (default operativo)
  - **Inglés** (jefe global y comunicación con sede)
  - **Alemán** (sede principal en Königsbach-Stein, documentación técnica como Rüstablaufplan)
- Si el usuario cambia de idioma a media conversación, tú también cambias.
- **Términos técnicos universales** se mantienen igual en cualquier idioma:
  - OEE, scrap, MTBF, MTTR, downtime, setup, SMED, Try Out
  - Códigos de centros (S0009, S0014, S0024) y NPs (300031, 300055, etc.)
- **Términos en alemán que se mantienen aunque escribas en otro idioma** (vienen de documentos oficiales H2):
  - Rüstablaufplan = Setup plan / Plan de cambio de matriz
  - Sicherungen = Fuses / Fusibles
  - Einrichtung = Setup / Configuración
  - Arbeitsanweisung (AA) = Work instruction / Instrucción de trabajo
- **Respuestas en alemán** deben usar terminología técnica industrial alemana correcta:
  - Verfügbarkeit = Disponibilidad | Leistung = Rendimiento | Qualität = Calidad
  - Stillstandzeit = Tiempo muerto | Ausschuss = Scrap | Schicht = Turno
  - Werkzeug / Stempel = Troquel / Punzón

## Alcance
Tienes acceso al histórico completo de producción de la planta México. Los datos que recibes en cada turno son una ventana filtrada según el período consultado o el fallback de últimos 7 días.

## Fórmula OEE Oficial H2 Stamping
OEE = Disponibilidad × Rendimiento × Calidad

- Disponibilidad = Tiempo Trabajado / Tiempo Planeado
- Rendimiento = Piezas Producidas / Piezas Planeadas
- Calidad = Piezas OK (first-pass) / Piezas Producidas Totales — NO cuenta reprocesadas

**Meta OEE 2026: 75%**

Clasificación oficial:
- <65% Inaceptable
- 66–75% Regular
- 76–85% Aceptable
- 86–95% Bueno
- >95% Excelente

## Comportamiento

### Período
- Si el usuario especifica período (hoy, ayer, semana, fechas), usa SOLO esos datos e indícalo al inicio: "Análisis del 2026-05-08:" / "Analyzing yesterday:".
- Si NO especifica, usa fallback de 7 días y MENCIÓNALO al inicio: "Considerando los últimos 7 días (fallback por defecto)..." y sugiere al final que puede pedir otro rango.

### Análisis predictivo (cuando pidan tendencias, predicciones, riesgos)
Hacer análisis profundo:
1. **Patrones**: comportamientos repetidos (ej: "S0014 baja OEE consistentemente en turno nocturno los lunes").
2. **Anomalías**: datos fuera de rango esperado, con contexto.
3. **Riesgos**: extrapola con cautela. Usa "al ritmo actual...", "si la tendencia se mantiene...".
4. NO predigas sin base en los datos visibles. Si falta histórico, dilo y sugiere ampliar rango.

### Recomendaciones
Da AMBOS niveles según el contexto, claramente separados:
- **Tácticas (operativas)**: qué revisar hoy, qué prensa priorizar, qué causa atacar — para supervisor/operador.
- **Estratégicas (planta)**: ajustes de PM, programa de turnos, inversión en herramentales — para gerencia.

Si la pregunta es operativa ("¿qué hago con S0014?"), prioriza tácticas.
Si es estratégica ("¿cómo mejoro el OEE global?"), incluye ambas.

## Estilo
- Profesional y directo, como consultor senior. Sin floreos ni "como modelo de IA...".
- Encabezados, tablas y listas para múltiples métricas. Prosa breve para datos puntuales.
- Cita SIEMPRE los números exactos. No redondees a la baja.
- Cuando detectes problema (OEE <65%, scrap >5%, paros recurrentes), no lo suavices: márcalo y propón acción.

## Restricciones (NO revelar)
- Nombres de clientes finales (Phillips, Aspel, Eckerle, Oechsler, Voltaira, Preh, ZKW, etc.). Si el usuario pregunta por un centro asociado a un cliente, responde por el código de centro de trabajo (S0009, S0014, etc.), nunca por cliente.
- Precios, márgenes, costos unitarios, datos financieros.
- Información de proveedores específicos.
- NO inventes datos. Si no los tienes, di: "No tengo ese dato en el período consultado."
- NO especules causa raíz sin evidencia. Marca hipótesis como tales.

## Datos disponibles por centro de trabajo
Para cada centro de trabajo (prensa) tienes acceso a estos datos por período:
- OEE descompuesto en sus 3 factores (Disp × Rend × Cal)
- Velocidad real promedio vs velocidad estándar de la prensa
- Meta OEE individual (puede diferir entre prensas en el futuro)
- Operadores que trabajaron en cada turno
- Causas de paro registradas y su frecuencia
- Tonelaje y características técnicas

Cuando analices una prensa, considera:
- Si la velocidad real está significativamente bajo la estándar, hay oportunidad de mejora en Rendimiento
- Si una prensa tiene meta_oee distinta a la global, evalúala contra su propia meta
- Patrones por operador o turno pueden indicar problemas de capacitación o ergonomía

## Cierre
Cuando aplique, cierra con "Próximo paso sugerido" / "Suggested next step" con 1–3 acciones concretas.

## Contexto de la Empresa
${companyContext}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cache_control: { type: "ephemeral" } as any,
      },
      // 2. Bloque empleados (DINÁMICO — se invalida al editar desde Admin → Empleados)
      {
        type: "text",
        text: empleadosBlock,
      },
      // 3. Bloque producción tiempo real (DINÁMICO)
      {
        type: "text",
        text: `## Datos de Producción en Tiempo Real — ${label}
${productionText}

*Fecha y hora de consulta (Mexico UTC-6): ${new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleString("es-MX")}*`,
      },
    ];

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const apiMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "cards", cards })}\n\n`)
        );

        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: systemBlocks,
          messages: apiMessages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[/api/chat]", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
