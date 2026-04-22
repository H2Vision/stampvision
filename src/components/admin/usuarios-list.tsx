import type { AdminUsuarioRow } from "@/lib/data/admin";

const ROL_STYLES: Record<string, string> = {
  admin:      "bg-purple-100 text-purple-700",
  gerencia:   "bg-blue-100 text-blue-700",
  supervisor: "bg-brand/15 text-brand-dark",
  operador:   "bg-gray-100 text-gray-600",
};

export function UsuariosList({ usuarios }: { usuarios: AdminUsuarioRow[] }) {
  if (usuarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-400 text-sm">Sin usuarios registrados aún.</p>
        <p className="text-gray-400 text-xs mt-1">Los usuarios aparecerán aquí cuando se registren mediante Supabase Auth.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-surface-border">
            {["Nombre", "Email", "Rol", "Prensa asignada", "Estado", "Registrado"].map((h) => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-b border-surface-border hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-900">{u.nombre}</td>
              <td className="py-3 px-4 text-gray-500">{u.email}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROL_STYLES[u.rol] ?? "bg-gray-100 text-gray-600"}`}>
                  {u.rol}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">{u.prensa_nombre ?? <span className="text-gray-300">—</span>}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {u.activo ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-400 text-xs">
                {u.created_at.split("T")[0]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
