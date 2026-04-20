import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { createServiceClient } from "@/lib/supabase/service";

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
  const now = new Date();

  // Specific date pattern: YYYY-MM-DD
  const isoMatch = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return { startDate: isoMatch[1], endDate: isoMatch[1], label: `fecha ${isoMatch[1]}` };
  }

  // Relative dates (Spanish)
  if (lower.includes("ayer") || lower.includes("yesterday")) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - 1);
    const s = toISO(d);
    return { startDate: s, endDate: s, label: "ayer" };
  }

  if (lower.includes("esta semana") || lower.includes("semana actual")) {
    const d = new Date(now);
    const day = d.getUTCDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    return { startDate: toISO(d), endDate: toISO(now), label: "esta semana" };
  }

  if (lower.includes("semana pasada") || lower.includes("última semana")) {
    const d = new Date(now);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff - 7);
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

  // Default → most recent 7 days with data
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 7);
  return { startDate: toISO(d), endDate: toISO(now), label: "los últimos días" };
}

// ─── Supabase data query ──────────────────────────────────────────────────────

async function fetchProductionData(startDate: string, endDate: string) {
  const sb = createServiceClient();

  const { data, error } = await sb
    .from("produccion")
    .select(
      "fecha, turno, piezas_ok, piezas_nok, tiempo_planeado_min, tiempo_muerto_min, causa_paro, numero_parte, prensas(nombre)"
    )
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .order("fecha", { ascending: false })
    .limit(300);

  if (error || !data) return { text: "Sin datos disponibles.", cards: [] as DataCard[] };

  // Aggregate by prensa
  const byPrensa = new Map<
    string,
    { tp: number; tm: number; ok: number; nok: number; causas: string[] }
  >();

  for (const r of data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nombre = (r.prensas as any)?.nombre ?? "Desconocida";
    if (!byPrensa.has(nombre)) {
      byPrensa.set(nombre, { tp: 0, tm: 0, ok: 0, nok: 0, causas: [] });
    }
    const acc = byPrensa.get(nombre)!;
    acc.tp += r.tiempo_planeado_min;
    acc.tm += r.tiempo_muerto_min;
    acc.ok += r.piezas_ok;
    acc.nok += r.piezas_nok;
    if (r.causa_paro) acc.causas.push(r.causa_paro);
  }

  // Global totals
  let totalTP = 0, totalTM = 0, totalOK = 0, totalNOK = 0;
  for (const [, v] of byPrensa) {
    totalTP += v.tp; totalTM += v.tm;
    totalOK += v.ok; totalNOK += v.nok;
  }

  function oee(tp: number, tm: number, ok: number, nok: number) {
    if (tp === 0) return 0;
    const A = (tp - tm) / tp;
    const total = ok + nok;
    const Q = total > 0 ? ok / total : 0;
    return Math.round(A * Q * 1000) / 10;
  }

  function scrap(ok: number, nok: number) {
    const t = ok + nok;
    return t > 0 ? Math.round((nok / t) * 1000) / 10 : 0;
  }

  function disp(tp: number, tm: number) {
    return tp > 0 ? Math.round(((tp - tm) / tp) * 1000) / 10 : 0;
  }

  const globalOEE = oee(totalTP, totalTM, totalOK, totalNOK);
  const globalScrap = scrap(totalOK, totalNOK);
  const globalDisp = disp(totalTP, totalTM);

  // Prensa breakdown
  const prensaStats = Array.from(byPrensa.entries())
    .map(([nombre, v]) => ({
      nombre,
      oee: oee(v.tp, v.tm, v.ok, v.nok),
      scrap: scrap(v.ok, v.nok),
      disp: disp(v.tp, v.tm),
      ok: v.ok,
      nok: v.nok,
      causas: [...new Set(v.causas)].slice(0, 3),
    }))
    .sort((a, b) => b.oee - a.oee);

  // Worst scrap
  const worstScrap = [...prensaStats].sort((a, b) => b.scrap - a.scrap)[0];

  // Summary text for Claude
  const summaryLines = [
    `**Período:** ${startDate} al ${endDate}`,
    `**OEE Global:** ${globalOEE}% | **Disponibilidad:** ${globalDisp}% | **Scrap Rate:** ${globalScrap}%`,
    `**Total piezas OK:** ${totalOK.toLocaleString()} | **Total NOK:** ${totalNOK.toLocaleString()}`,
    "",
    "**OEE por Prensa:**",
    ...prensaStats.map(
      (p) =>
        `- ${p.nombre}: OEE ${p.oee}% | Disp ${p.disp}% | Scrap ${p.scrap}% | OK ${p.ok.toLocaleString()} | NOK ${p.nok}`
    ),
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
    summaryLines.push("", "**Causas de paro más frecuentes:**");
    topCausas.forEach(([causa, count]) => {
      summaryLines.push(`- ${causa}: ${count} ocurrencia(s)`);
    });
  }

  // Build data cards
  const cards: DataCard[] = [
    {
      type: "kpi",
      label: "OEE Global",
      value: `${globalOEE}%`,
      positive: globalOEE >= 82,
    },
    {
      type: "kpi",
      label: "Disponibilidad",
      value: `${globalDisp}%`,
      positive: globalDisp >= 90,
    },
    {
      type: "kpi",
      label: "Scrap Rate",
      value: `${globalScrap}%`,
      positive: globalScrap < 5,
    },
    {
      type: "kpi",
      label: "Piezas OK",
      value: totalOK.toLocaleString(),
      positive: true,
    },
    {
      type: "ranking",
      label: "OEE por Prensa",
      rows: prensaStats.map((p) => ({
        label: p.nombre,
        value: `${p.oee}%`,
        color:
          p.oee >= 85 ? "green" :
          p.oee >= 70 ? "yellow" :
          p.oee >= 50 ? "orange" : "red",
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

    // Fetch production data
    const { text: productionText, cards } = await fetchProductionData(startDate, endDate);

    // Read company context
    let companyContext = "";
    try {
      companyContext = readFileSync(
        join(process.cwd(), "src/lib/company-context.md"),
        "utf-8"
      );
    } catch {
      companyContext = "H2 Stamping — empresa de estampado metálico industrial.";
    }

    // Build system prompt
    const systemPrompt = `Eres el asistente de IA del MES (Manufacturing Execution System) de H2 Stamping. Tienes acceso a datos de producción en tiempo real y ayudas al equipo de planta a entender el desempeño de sus prensas.

## Contexto de la Empresa
${companyContext}

## Datos de Producción — ${label}
${productionText}

## Instrucciones de Comportamiento
- Responde siempre en español, de forma clara y directa.
- Usa los datos de producción proporcionados para responder con precisión.
- Cuando menciones métricas, usa los valores exactos de los datos.
- Si el usuario pregunta sobre algo fuera del período consultado, indícalo.
- Sugiere acciones concretas cuando detectes problemas (OEE bajo, scrap alto, paros frecuentes).
- Estructura tu respuesta con encabezados y listas cuando sean muchos datos.
- NO reveles nombres de clientes finales, precios, márgenes ni información financiera.
- Mantén el tono profesional pero amigable para operadores y supervisores de planta.
- Si no tienes datos suficientes, dilo claramente.`;

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Build messages for API (exclude system, format correctly)
    const apiMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Create streaming response
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        // First event: data cards
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "cards", cards })}\n\n`
          )
        );

        // Stream Claude response
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: systemPrompt,
          messages: apiMessages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`
              )
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
