import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

// GET — list alerts (with optional ?unread=true filter)
export async function GET(req: NextRequest) {
  const sb = createServiceClient();
  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
  const countOnly  = req.nextUrl.searchParams.get("count") === "true";

  let query = sb
    .from("alertas")
    .select("id, tipo, severidad, mensaje, prensa_id, valor_actual, umbral, leida, created_at, prensas(nombre)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (unreadOnly) query = query.eq("leida", false);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (countOnly) {
    return NextResponse.json({ count: data?.filter((a) => !a.leida).length ?? 0 });
  }

  return NextResponse.json({ alerts: data ?? [] });
}

// PATCH — mark alert(s) as read
export async function PATCH(req: NextRequest) {
  const sb = createServiceClient();
  const body = await req.json();

  // Mark all as read
  if (body.markAllRead) {
    const { error } = await sb.from("alertas").update({ leida: true }).eq("leida", false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Mark specific IDs
  const ids: string[] = body.ids ?? (body.id ? [body.id] : []);
  if (ids.length === 0) return NextResponse.json({ error: "ids required" }, { status: 400 });

  const { error } = await sb.from("alertas").update({ leida: true }).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
