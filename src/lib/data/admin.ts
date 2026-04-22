import { createServiceClient } from "@/lib/supabase/service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminPrensaRow {
  id:                 string;
  nombre:             string;
  tonelaje:           number;
  velocidad_estandar: number;
  meta_oee:           number;   // as percentage 0-100
  estado:             "activa" | "mantenimiento" | "inactiva";
}

export interface Umbrales {
  oee_warning:       number;
  oee_critical:      number;
  scrap_warning:     number;
  scrap_critical:    number;
  downtime_warning:  number;
}

export interface AdminUsuarioRow {
  id:               string;
  nombre:           string;
  email:            string;
  rol:              string;
  activo:           boolean;
  prensa_nombre:    string | null;
  created_at:       string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAdminPrensas(): Promise<AdminPrensaRow[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("prensas")
    .select("id, nombre, tonelaje, velocidad_estandar, meta_oee, estado")
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id:                 p.id,
    nombre:             p.nombre,
    tonelaje:           p.tonelaje,
    velocidad_estandar: Number(p.velocidad_estandar),
    meta_oee:           Math.round(Number(p.meta_oee) * 100),
    estado:             p.estado as AdminPrensaRow["estado"],
  }));
}

export async function getUmbrales(): Promise<Umbrales> {
  const sb = createServiceClient();
  const DEFAULTS: Umbrales = {
    oee_warning:      80,
    oee_critical:     70,
    scrap_warning:    5,
    scrap_critical:   10,
    downtime_warning: 60,
  };

  const { data } = await sb
    .from("configuracion")
    .select("clave, valor")
    .in("clave", Object.keys(DEFAULTS));

  if (!data || data.length === 0) return DEFAULTS;

  const map: Record<string, number> = {};
  for (const row of data) {
    map[row.clave] = Number(row.valor);
  }

  return {
    oee_warning:      map.oee_warning      ?? DEFAULTS.oee_warning,
    oee_critical:     map.oee_critical     ?? DEFAULTS.oee_critical,
    scrap_warning:    map.scrap_warning    ?? DEFAULTS.scrap_warning,
    scrap_critical:   map.scrap_critical   ?? DEFAULTS.scrap_critical,
    downtime_warning: map.downtime_warning ?? DEFAULTS.downtime_warning,
  };
}

export async function getAdminUsuarios(): Promise<AdminUsuarioRow[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("usuarios")
    .select("id, nombre, email, rol, activo, created_at, prensas(nombre)")
    .order("created_at", { ascending: false });
  if (error) return []; // table may be empty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((u: any) => ({
    id:            u.id,
    nombre:        u.nombre,
    email:         u.email,
    rol:           u.rol,
    activo:        u.activo,
    prensa_nombre: u.prensas?.nombre ?? null,
    created_at:    u.created_at,
  }));
}
