import { createServiceClient } from "@/lib/supabase/service";
import { RegistroTabs } from "@/components/registro/registro-tabs";
import { ClipboardList } from "lucide-react";

async function getPrensas() {
  const sb = createServiceClient();
  const { data } = await sb.from("prensas").select("id, nombre").order("nombre");
  return data ?? [];
}

async function getNumerosParte() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("produccion")
    .select("numero_parte")
    .not("numero_parte", "is", null)
    .order("numero_parte");
  const unique = [...new Set((data ?? []).map((r) => r.numero_parte as string))];
  return unique;
}

export default async function RegistroPage() {
  const [prensas, numerosParte] = await Promise.all([getPrensas(), getNumerosParte()]);

  const operadores = [
    "Luis Manuel Diaz Lucas",
    "Ernesto Daniel Cruz Luna",
    "Roberto Arvizu Nieves",
    "L. Fernando Montero",
    "Diego Yañez",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-brand-dark" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Turno</h1>
          <p className="text-sm text-gray-500">Reporte de producción y tiempos muertos</p>
        </div>
      </div>

      <RegistroTabs prensas={prensas} operadores={operadores} numerosParte={numerosParte} />
    </div>
  );
}
