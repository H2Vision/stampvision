import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    prensa_id, operador, turno, fecha, numero_parte, po,
    motivo, hora_inicio, hora_fin, comentarios,
  } = body;

  if (!prensa_id || !operador || !turno || !fecha || !motivo || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
  }

  if (hora_fin <= hora_inicio) {
    return NextResponse.json({ error: "La hora de fin debe ser después de la hora de inicio." }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("downtime_eventos")
    .insert({
      prensa_id,
      operador,
      turno,
      fecha,
      numero_parte:  numero_parte || null,
      po:            po           || null,
      motivo,
      hora_inicio,
      hora_fin,
      comentarios:   comentarios  || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
