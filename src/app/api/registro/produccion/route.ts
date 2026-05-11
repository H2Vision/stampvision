import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    prensa_id, operador, turno, fecha, numero_parte,
    piezas_ok, piezas_nok, velocidad_real, piezas_planeadas,
    po, tipo_material, cantidad_material,
    kilos_scrap, comentarios_gpm, comentarios,
  } = body;

  if (!prensa_id || !operador || !turno || !fecha) {
    return NextResponse.json({ error: "Prensa, operador, turno y fecha son requeridos." }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("produccion")
    .insert({
      prensa_id,
      operador,
      turno,
      fecha,
      numero_parte:      numero_parte      || null,
      piezas_ok:         piezas_ok         ?? null,
      piezas_nok:        piezas_nok        ?? null,
      velocidad_real:    velocidad_real     ?? null,
      piezas_planeadas:  piezas_planeadas   ?? null,
      po:                po                || null,
      tipo_material:     tipo_material      || null,
      cantidad_material: cantidad_material  ?? null,
      kilos_scrap:       kilos_scrap        ?? null,
      comentarios_gpm:   comentarios_gpm   || null,
      comentarios:       comentarios        || null,
      fuente:            "manual",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
