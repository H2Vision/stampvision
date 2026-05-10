import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { invalidateEmpleadosCache } from "@/lib/empleados-context";

export const runtime = "nodejs";

// GET — Detalle de un empleado con sus capacitaciones
export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("empleados")
    .select("*, capacitaciones:empleado_capacitaciones(*, prensas(nombre))")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ empleado: data });
}

// PUT — Actualizar empleado (reemplaza capacitaciones si se pasan)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { capacitaciones, ...empData } = body;

  const sb = createServiceClient();
  const { data: emp, error } = await sb
    .from("empleados")
    .update(empData)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(capacitaciones)) {
    await sb.from("empleado_capacitaciones").delete().eq("empleado_id", params.id);
    if (capacitaciones.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = capacitaciones.map((c: any) => ({
        empleado_id:  params.id,
        prensa_id:    c.prensa_id    || null,
        numero_parte: c.numero_parte || null,
        nivel:        c.nivel,
        notas:        c.notas        || null,
      }));
      await sb.from("empleado_capacitaciones").insert(rows);
    }
  }

  invalidateEmpleadosCache();
  return NextResponse.json({ empleado: emp });
}

// DELETE — Soft delete (inactivo) por defecto; hard delete con ?hard=true
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const hard = req.nextUrl.searchParams.get("hard") === "true";
  const sb = createServiceClient();

  if (hard) {
    const { error } = await sb.from("empleados").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await sb.from("empleados").update({ activo: false }).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateEmpleadosCache();
  return NextResponse.json({ ok: true });
}
