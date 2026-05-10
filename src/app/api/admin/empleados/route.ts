import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { invalidateEmpleadosCache } from "@/lib/empleados-context";

export const runtime = "nodejs";

// GET — Listar empleados (filtros opcionales: activos, rol, turno)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const soloActivos = sp.get("activos") !== "false";
  const rol   = sp.get("rol");
  const turno = sp.get("turno");

  const sb = createServiceClient();
  let q = sb.from("empleados").select(
    "*, capacitaciones:empleado_capacitaciones(prensa_id, numero_parte, nivel, fecha_actualizacion, prensas(nombre))"
  );

  if (soloActivos) q = q.eq("activo", true);
  if (rol)         q = q.eq("rol", rol);
  if (turno)       q = q.eq("turno_principal", parseInt(turno));

  const { data, error } = await q.order("nombre", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ empleados: data });
}

// POST — Crear empleado (+ capacitaciones opcionales)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { numero_empleado, nombre, rol, turno_principal, fecha_ingreso, notas, capacitaciones } = body;

  if (!numero_empleado || !nombre || !rol) {
    return NextResponse.json({ error: "Faltan campos obligatorios: numero_empleado, nombre, rol" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data: emp, error: errEmp } = await sb
    .from("empleados")
    .insert({ numero_empleado, nombre, rol, turno_principal: turno_principal ?? null, fecha_ingreso: fecha_ingreso ?? null, notas: notas ?? null, activo: true })
    .select()
    .single();

  if (errEmp) return NextResponse.json({ error: errEmp.message }, { status: 500 });

  if (Array.isArray(capacitaciones) && capacitaciones.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = capacitaciones.map((c: any) => ({
      empleado_id:  emp.id,
      prensa_id:    c.prensa_id    || null,
      numero_parte: c.numero_parte || null,
      nivel:        c.nivel,
      notas:        c.notas        || null,
    }));
    const { error: errCap } = await sb.from("empleado_capacitaciones").insert(rows);
    if (errCap) return NextResponse.json({ error: errCap.message }, { status: 500 });
  }

  invalidateEmpleadosCache();
  return NextResponse.json({ empleado: emp }, { status: 201 });
}
