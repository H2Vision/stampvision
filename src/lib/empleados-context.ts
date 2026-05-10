import { createServiceClient } from "@/lib/supabase/service";

interface Capacitacion {
  prensa_id: string | null;
  prensa_nombre: string | null;
  numero_parte: string | null;
  nivel: number;
}

interface EmpleadoConCapacitaciones {
  id: string;
  numero_empleado: number;
  nombre: string;
  rol: string;
  turno_principal: number | null;
  activo: boolean;
  capacitaciones: Capacitacion[];
}

// Cache en memoria. TTL 5 min como respaldo; se invalida explícitamente al editar.
let _cache: { data: EmpleadoConCapacitaciones[]; loadedAt: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export function invalidateEmpleadosCache(): void {
  _cache = null;
}

export async function getEmpleadosForContext(): Promise<EmpleadoConCapacitaciones[]> {
  if (_cache && Date.now() - _cache.loadedAt < TTL_MS) return _cache.data;

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("empleados")
    .select(
      "id, numero_empleado, nombre, rol, turno_principal, activo, capacitaciones:empleado_capacitaciones(prensa_id, numero_parte, nivel, prensas(nombre))"
    )
    .eq("activo", true)
    .order("rol",    { ascending: true })
    .order("nombre", { ascending: true });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flat: EmpleadoConCapacitaciones[] = (data as any[]).map((e) => ({
    ...e,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    capacitaciones: (e.capacitaciones || []).map((c: any) => ({
      prensa_id:    c.prensa_id,
      prensa_nombre: c.prensas?.nombre ?? null,
      numero_parte: c.numero_parte,
      nivel:        c.nivel,
    })),
  }));

  _cache = { data: flat, loadedAt: Date.now() };
  return flat;
}

const ROL_NOMBRES: Record<string, string> = {
  operador_prensa:    "Operadores de Prensas",
  operador_ensamble:  "Operadores de Línea de Ensamble",
  supervisor_turno:   "Supervisores de Turno",
  ing_proceso:        "Ingenieros de Proceso",
  gerente_produccion: "Gerencia de Producción",
  jefe_mantenimiento: "Mantenimiento",
  calidad:            "Calidad",
  planeacion:         "Planeación",
  direccion:          "Dirección",
  otro:               "Otros",
};

/** Construye el bloque markdown que se inyecta como contexto dinámico en el chat. */
export async function buildEmpleadosContextBlock(): Promise<string> {
  const empleados = await getEmpleadosForContext();

  if (empleados.length === 0) {
    return "## Personal de Planta\n\n*No hay empleados registrados en BD.*";
  }

  const grupos: Record<string, EmpleadoConCapacitaciones[]> = {};
  for (const e of empleados) {
    (grupos[e.rol] ||= []).push(e);
  }

  const lines: string[] = [
    "## Personal de Planta (datos en tiempo real desde BD)",
    "",
    "*Esta lista se actualiza automáticamente cuando se modifica desde Admin → Empleados.*",
    "",
  ];

  for (const [rol, lista] of Object.entries(grupos)) {
    lines.push(`### ${ROL_NOMBRES[rol] ?? rol}`);
    for (const e of lista) {
      const turno = e.turno_principal ? ` — Turno ${e.turno_principal}` : "";
      const capaciStr = e.capacitaciones.length > 0
        ? ` | Capacitado en: ${e.capacitaciones.map((c) => {
            const lugar = c.prensa_nombre ?? "transversal";
            const np    = c.numero_parte ? ` NP ${c.numero_parte}` : "";
            return `${lugar}${np} (Nivel ${c.nivel})`;
          }).join(", ")}`
        : "";
      lines.push(`- **${e.nombre}** (#${e.numero_empleado})${turno}${capaciStr}`);
    }
    lines.push("");
  }

  lines.push("### Niveles de capacitación (UP02-FB-037 MX)");
  lines.push("- **Nivel 0**: No capacitado");
  lines.push("- **Nivel 1**: Capacitado, opera con ayuda de Nivel 3");
  lines.push("- **Nivel 2**: Opera con supervisión constante");
  lines.push("- **Nivel 3**: Supervisión mínima, libera primeras piezas");
  lines.push("- **Nivel 4**: Entrena a otros, sin supervisión, ajusta herramentales");

  return lines.join("\n");
}
