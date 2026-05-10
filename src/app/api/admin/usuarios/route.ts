import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/usuarios
export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("usuarios")
    .select("id, nombre, email, rol, activo, prensa_id, created_at, prensas(nombre)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/usuarios  — create
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombre, email, rol, prensa_id, activo } = body;
  if (!nombre || !email || !rol) {
    return NextResponse.json({ error: "nombre, email y rol son requeridos" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("usuarios")
    .insert({ nombre, email, rol, prensa_id: prensa_id || null, activo: activo ?? true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
