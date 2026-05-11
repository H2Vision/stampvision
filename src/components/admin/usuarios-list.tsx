"use client";

import { useState, useTransition } from "react";
import type { AdminUsuarioRow, AdminPrensaSimple } from "@/lib/data/admin";
import { UserPlus, Pencil, ToggleLeft, ToggleRight, X, Check } from "lucide-react";

const ROLES = [
  "admin",
  "direccion",
  "gerencia",
  "ing_proceso",
  "calidad",
  "planeacion",
  "jefe_mantenimiento",
  "supervisor",
  "operador",
] as const;

const ROL_LABELS: Record<string, string> = {
  admin:              "Admin",
  direccion:          "Dirección",
  gerencia:           "Gerencia",
  ing_proceso:        "Ing. Proceso",
  calidad:            "Calidad",
  planeacion:         "Planeación",
  jefe_mantenimiento: "Jefe Mantenimiento",
  supervisor:         "Supervisor",
  operador:           "Operador",
};

const ROL_STYLES: Record<string, string> = {
  admin:              "bg-purple-100 text-purple-700",
  direccion:          "bg-rose-100 text-rose-700",
  gerencia:           "bg-blue-100 text-blue-700",
  ing_proceso:        "bg-cyan-100 text-cyan-700",
  calidad:            "bg-amber-100 text-amber-700",
  planeacion:         "bg-indigo-100 text-indigo-700",
  jefe_mantenimiento: "bg-orange-100 text-orange-700",
  supervisor:         "bg-brand/15 text-brand-dark",
  operador:           "bg-gray-100 text-gray-600",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsuarioForm {
  nombre:    string;
  email:     string;
  rol:       string;
  prensa_id: string;
  activo:    boolean;
}

const EMPTY_FORM: UsuarioForm = { nombre: "", email: "", rol: "operador", prensa_id: "", activo: true };

// ─── Modal ────────────────────────────────────────────────────────────────────

function UsuarioModal({
  initial,
  prensas,
  onSave,
  onClose,
}: {
  initial: UsuarioForm & { id?: string };
  prensas: AdminPrensaSimple[];
  onSave: (form: UsuarioForm & { id?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState("");

  const isEdit = !!initial.id;

  function set(field: keyof UsuarioForm, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) {
      setError("Nombre y email son requeridos.");
      return;
    }
    setError("");
    startSaving(async () => {
      await onSave({ ...form, id: initial.id });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h3 className="font-semibold text-gray-900">{isEdit ? "Editar usuario" : "Nuevo usuario"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo</label>
            <input
              className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej. María Romo"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="usuario@h2stamping.com"
              disabled={isEdit}
            />
            {isEdit && <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar (es la llave de Supabase Auth).</p>}
          </div>

          {/* Rol */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
            <select
              className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              value={form.rol}
              onChange={(e) => set("rol", e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROL_LABELS[r] ?? r}</option>
              ))}
            </select>
          </div>

          {/* Prensa asignada */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Prensa asignada <span className="text-gray-300">(opcional)</span></label>
            <select
              className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              value={form.prensa_id}
              onChange={(e) => set("prensa_id", e.target.value)}
            >
              <option value="">— Sin prensa asignada —</option>
              {prensas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo-check"
              checked={form.activo}
              onChange={(e) => set("activo", e.target.checked)}
              className="w-4 h-4 accent-brand"
            />
            <label htmlFor="activo-check" className="text-sm text-gray-700">Usuario activo</label>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UsuariosList({
  usuarios: initialUsuarios,
  prensas,
}: {
  usuarios: AdminUsuarioRow[];
  prensas:  AdminPrensaSimple[];
}) {
  const [usuarios, setUsuarios] = useState(initialUsuarios);
  const [modal, setModal] = useState<(UsuarioForm & { id?: string }) | null>(null);
  const [toast, setToast] = useState("");
  const [, startT] = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleSave(form: UsuarioForm & { id?: string }) {
    if (form.id) {
      // UPDATE
      const res = await fetch(`/api/admin/usuarios/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { showToast("Error al guardar."); return; }
      const updated = await res.json();
      const prensa = prensas.find((p) => p.id === form.prensa_id);
      setUsuarios((prev) => prev.map((u) =>
        u.id === form.id
          ? { ...u, ...updated, prensa_nombre: prensa?.nombre ?? null }
          : u
      ));
      showToast("Usuario actualizado.");
    } else {
      // CREATE
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { showToast("Error al crear usuario."); return; }
      const created = await res.json();
      const prensa = prensas.find((p) => p.id === form.prensa_id);
      setUsuarios((prev) => [
        { ...created, prensa_nombre: prensa?.nombre ?? null },
        ...prev,
      ]);
      showToast("Usuario creado.");
    }
    setModal(null);
  }

  function handleToggleActivo(u: AdminUsuarioRow) {
    startT(async () => {
      const res = await fetch(`/api/admin/usuarios/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: u.nombre, rol: u.rol, prensa_id: u.prensa_id, activo: !u.activo }),
      });
      if (!res.ok) { showToast("Error al cambiar estado."); return; }
      setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, activo: !x.activo } : x));
      showToast(`${u.nombre} ${!u.activo ? "activado" : "desactivado"}.`);
    });
  }

  function openCreate() {
    setModal({ ...EMPTY_FORM });
  }

  function openEdit(u: AdminUsuarioRow) {
    setModal({
      id:        u.id,
      nombre:    u.nombre,
      email:     u.email,
      rol:       u.rol,
      prensa_id: u.prensa_id ?? "",
      activo:    u.activo,
    });
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <UsuarioModal
          initial={modal}
          prensas={prensas}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Table */}
      {usuarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-400 text-sm">Sin usuarios registrados aún.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-surface-border">
                {["Nombre", "Email", "Rol", "Prensa asignada", "Estado", "Registrado", ""].map((h) => (
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROL_STYLES[u.rol] ?? "bg-gray-100 text-gray-600"}`}>
                      {ROL_LABELS[u.rol] ?? u.rol}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {u.prensa_nombre ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {u.created_at.split("T")[0]}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* Editar */}
                      <button
                        onClick={() => openEdit(u)}
                        title="Editar"
                        className="text-gray-400 hover:text-brand-dark transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {/* Toggle activo */}
                      <button
                        onClick={() => handleToggleActivo(u)}
                        title={u.activo ? "Desactivar" : "Activar"}
                        className={`transition-colors ${u.activo ? "text-green-500 hover:text-red-400" : "text-gray-300 hover:text-green-500"}`}
                      >
                        {u.activo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
