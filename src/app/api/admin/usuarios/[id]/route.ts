import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/admin/usuarios/[id]  — update nombre, rol, prensa_id, activo
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { nombre, rol, activo } = body;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("usuarios")
    .update({ nombre, rol, activo })
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/usuarios/[id]  — desactiva (soft) o elimina si ?hard=true
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const hard = new URL(req.url).searchParams.get("hard") === "true";
  const sb = createServiceClient();
  if (hard) {
    const { error } = await sb.from("usuarios").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await sb.from("usuarios").update({ activo: false }).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
