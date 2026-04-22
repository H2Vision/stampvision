import { getAdminPrensas, getUmbrales, getAdminUsuarios } from "@/lib/data/admin";
import { PrensasConfig } from "@/components/admin/prensas-config";
import { UmbralesConfig } from "@/components/admin/umbrales-config";
import { UsuariosList } from "@/components/admin/usuarios-list";
import { Settings, Gauge, Users } from "lucide-react";
import Link from "next/link";

const TABS = [
  { key: "prensas",  label: "Prensas",           icon: Settings },
  { key: "umbrales", label: "Umbrales de Alertas",icon: Gauge    },
  { key: "usuarios", label: "Usuarios",           icon: Users    },
];

interface PageProps {
  searchParams: { tab?: string };
}

export default async function AdminPage({ searchParams }: PageProps) {
  const tab = searchParams.tab ?? "prensas";

  const [prensas, umbrales, usuarios] = await Promise.all([
    getAdminPrensas(),
    getUmbrales(),
    getAdminUsuarios(),
  ]);

  const SECTION: Record<string, React.ReactNode> = {
    prensas:  <PrensasConfig  prensas={prensas}   />,
    umbrales: <UmbralesConfig umbrales={umbrales} />,
    usuarios: <UsuariosList   usuarios={usuarios} />,
  };

  const descriptions: Record<string, string> = {
    prensas:  "Configura los parámetros de cada prensa: meta OEE, tonelaje y estado operativo.",
    umbrales: "Define los valores que activan alertas automáticas en cada turno.",
    usuarios: "Usuarios registrados en el sistema y sus roles asignados.",
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-sm text-gray-500 mt-1">Configuración general del sistema H2 Stamping MES</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-surface-input rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/admin?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === key
                ? "bg-white shadow-card text-gray-900"
                : "text-gray-500 hover:text-gray-700"}`}
          >
            <Icon className={`w-4 h-4 ${tab === key ? "text-brand-dark" : "text-gray-400"}`} />
            {label}
          </Link>
        ))}
      </div>

      {/* Content card */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-surface-border">
          {TABS.filter((t) => t.key === tab).map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-brand-dark" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{label}</h2>
                <p className="text-xs text-gray-500">{descriptions[tab]}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {SECTION[tab] ?? SECTION.prensas}
        </div>
      </div>

    </div>
  );
}
