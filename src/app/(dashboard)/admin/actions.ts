"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

// ─── Update prensa settings ───────────────────────────────────────────────────

export async function updatePrensa(formData: FormData) {
  const id                = formData.get("id")                as string;
  const meta_oee_pct      = Number(formData.get("meta_oee"));
  const tonelaje          = Number(formData.get("tonelaje"));
  const velocidad_estandar= Number(formData.get("velocidad_estandar"));
  const estado            = formData.get("estado")            as string;

  if (!id) return { error: "ID requerido" };
  if (meta_oee_pct < 1 || meta_oee_pct > 100) return { error: "Meta OEE debe estar entre 1 y 100" };

  const sb = createServiceClient();
  const { error } = await sb
    .from("prensas")
    .update({
      meta_oee:           (meta_oee_pct / 100).toFixed(4),
      tonelaje,
      velocidad_estandar: velocidad_estandar.toFixed(2),
      estado,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

// ─── Update umbrales ──────────────────────────────────────────────────────────

export async function updateUmbrales(formData: FormData) {
  const keys = ["oee_warning", "oee_critical", "scrap_warning", "scrap_critical", "downtime_warning"];
  const sb = createServiceClient();

  const upserts = keys.map((key) => ({
    clave: key,
    valor: String(Number(formData.get(key))),
    descripcion: key,
  }));

  const { error } = await sb
    .from("configuracion")
    .upsert(upserts, { onConflict: "clave" });

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
