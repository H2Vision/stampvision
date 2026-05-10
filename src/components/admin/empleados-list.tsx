"use client";

import { useState, useTransition } from "react";
import { UserPlus, Pencil, Trash2, X, Check, Plus, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Capacitacion {
  prensa_id: string | null;
  numero_parte: string | null;
  nivel: number;
  notas: string | null;
  prensas?: { nombre: string } | null;
}

interface Empleado {
  id: string;
  numero_empleado: number;
  nombre: string;
  rol: string;
  turno_principal: number | null;
  activo: boolean;
  fecha_ingreso: string | null;
  notas: string | null;
  capacitaciones?: Capacitacion[];
}

interface Prensa {
  id: string;
  nombre: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROL_LABELS: Record<string, string> = {
  operador_prensa:    "Operador Prensa",
  operador_ensamble:  "Operador Ensamble",
  supervisor_turno:   "Supervisor Turno",
  ing_proceso:        "Ing. Proceso",
  gerente_produccion: "Gerente Producción",
  jefe_mantenimiento: "Jefe Mantenimiento",
  calidad:            "Calidad",
  planeacion:         "Planeación",
  direccion:          "Dirección",
  otro:               "Otro",
};

const ROL_OPTIONS = Object.entries(ROL_LABELS);

const ROL_COLORS: Record<string, string> = {
  operador_prensa:    "bg-blue-100 text-blue-700",
  operador_ensamble:  "bg-indigo-100 text-indigo-700",
  supervisor_turno:   "bg-yellow-100 text-yellow-800",
  ing_proceso:        "bg-purple-100 text-purple-700",
  gerente_produccion: "bg-brand/10 text-brand-dark",
  jefe_mantenimiento: "bg-orange-100 text-orange-700",
  calidad:            "bg-green-100 text-green-700",
  planeacion:         "bg-teal-100 text-teal-700",
  direccion:          "bg-gray-200 text-gray-800",
  otro:               "bg-gray-100 text-gray-600",
};

const NIVEL_LABELS: Record<number, string> = {
  0: "0 — No capacitado",
  1: "1 — Con ayuda Nv3",
  2: "2 — Supervisión constante",
  3: "3 — Supervisión mínima",
  4: "4 — Entrena a otros",
};

const inputCls = "w-full border border-surface-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30";
const labelCls = "block text-xs font-medium text-gray-600 mb-1";

// ─── Empty capacitación row ───────────────────────────────────────────────────

function emptyCapacitacion(): Capacitacion {
  return { prensa_id: null, numero_parte: null, nivel: 3, notas: null };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function EmpleadoModal({
  empleado,
  prensas,
  onClose,
  onSaved,
}: {
  empleado: Empleado | null; // null = crear nuevo
  prensas: Prensa[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !empleado;
  const [pending, startTransition] = useTransition();
  const [errMsg, setErrMsg] = useState("");

  const [form, setForm] = useState({
    numero_empleado: empleado?.numero_empleado?.toString() ?? "",
    nombre:          empleado?.nombre ?? "",
    rol:             empleado?.rol ?? "operador_prensa",
    turno_principal: empleado?.turno_principal?.toString() ?? "",
    fecha_ingreso:   empleado?.fecha_ingreso ?? "",
    notas:           empleado?.notas ?? "",
  });

  const [caps, setCaps] = useState<Capacitacion[]>(
    empleado?.capacitaciones?.length ? empleado.capacitaciones : []
  );

  function setField(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addCap() {
    setCaps((c) => [...c, emptyCapacitacion()]);
  }

  function removeCap(i: number) {
    setCaps((c) => c.filter((_, idx) => idx !== i));
  }

  function updateCap(i: number, field: keyof Capacitacion, value: string | number | null) {
    setCaps((c) => c.map((cap, idx) => idx === i ? { ...cap, [field]: value } : cap));
  }

  function handleSubmit() {
    setErrMsg("");
    if (!form.numero_empleado || !form.nombre || !form.rol) {
      setErrMsg("Número de empleado, nombre y rol son obligatorios.");
      return;
    }

    const body = {
      numero_empleado: parseInt(form.numero_empleado),
      nombre: form.nombre.trim(),
      rol: form.rol,
      turno_principal: form.turno_principal ? parseInt(form.turno_principal) : null,
      fecha_ingreso: form.fecha_ingreso || null,
      notas: form.notas || null,
      capacitaciones: caps.map((c) => ({
        prensa_id:    c.prensa_id    || null,
        numero_parte: c.numero_parte || null,
        nivel:        c.nivel,
        notas:        c.notas        || null,
      })),
    };

    startTransition(async () => {
      const url = isNew ? "/api/admin/empleados" : `/api/admin/empleados/${empleado!.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setErrMsg(json.error ?? "Error al guardar."); return; }
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h3 className="font-semibold text-gray-900">
            {isNew ? "Nuevo Empleado" : `Editar — ${empleado!.nombre}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Datos básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>N° Empleado *</label>
              <input type="number" className={inputCls} value={form.numero_empleado}
                onChange={(e) => setField("numero_empleado", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Turno principal</label>
              <div className="relative">
                <select className={inputCls + " appearance-none pr-8"} value={form.turno_principal}
                  onChange={(e) => setField("turno_principal", e.target.value)}>
                  <option value="">Sin turno fijo</option>
                  <option value="1">Turno 1 (6–14h)</option>
                  <option value="2">Turno 2 (14–22h)</option>
                  <option value="3">Turno 3 (22–6h)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Nombre completo *</label>
              <input type="text" className={inputCls} value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Rol *</label>
              <div className="relative">
                <select className={inputCls + " appearance-none pr-8"} value={form.rol}
                  onChange={(e) => setField("rol", e.target.value)}>
                  {ROL_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Fecha de ingreso</label>
              <input type="date" className={inputCls} value={form.fecha_ingreso}
                onChange={(e) => setField("fecha_ingreso", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notas</label>
              <textarea rows={2} className={inputCls} value={form.notas}
                onChange={(e) => setField("notas", e.target.value)} />
            </div>
          </div>

          {/* Capacitaciones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800">Capacitaciones por centro / NP</h4>
              <button onClick={addCap}
                className="flex items-center gap-1 text-xs text-brand-dark hover:text-brand font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>

            {caps.length === 0 && (
              <p className="text-xs text-gray-400 italic">Sin capacitaciones registradas.</p>
            )}

            <div className="space-y-2">
              {caps.map((cap, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-surface-input rounded-lg p-2">
                  {/* Centro */}
                  <div className="col-span-3">
                    <div className="relative">
                      <select className={inputCls + " appearance-none pr-6 text-xs py-1.5"}
                        value={cap.prensa_id ?? ""}
                        onChange={(e) => updateCap(i, "prensa_id", e.target.value || null)}>
                        <option value="">Transversal</option>
                        {prensas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {/* NP */}
                  <div className="col-span-3">
                    <input type="text" placeholder="NP (opcional)" className={inputCls + " text-xs py-1.5"}
                      value={cap.numero_parte ?? ""}
                      onChange={(e) => updateCap(i, "numero_parte", e.target.value || null)} />
                  </div>
                  {/* Nivel */}
                  <div className="col-span-4">
                    <div className="relative">
                      <select className={inputCls + " appearance-none pr-6 text-xs py-1.5"}
                        value={cap.nivel}
                        onChange={(e) => updateCap(i, "nivel", parseInt(e.target.value))}>
                        {Object.entries(NIVEL_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {/* Eliminar */}
                  <div className="col-span-2 flex justify-end">
                    <button onClick={() => removeCap(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errMsg && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errMsg}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
          <button onClick={onClose} disabled={pending}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={pending}
            className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand-hover text-brand-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
            <Check className="w-4 h-4" />
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EmpleadosList({
  empleados: initialEmpleados,
  prensas,
}: {
  empleados: Empleado[];
  prensas: Prensa[];
}) {
  const [empleados, setEmpleados] = useState<Empleado[]>(initialEmpleados);
  const [modal, setModal]         = useState<"new" | Empleado | null>(null);
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [toast, setToast]         = useState("");
  const [, startTransition]       = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function reload() {
    const params = new URLSearchParams();
    if (!soloActivos) params.set("activos", "false");
    if (filtroRol)    params.set("rol", filtroRol);
    if (filtroTurno)  params.set("turno", filtroTurno);
    const res = await fetch(`/api/admin/empleados?${params}`);
    const json = await res.json();
    if (json.empleados) setEmpleados(json.empleados);
  }

  function handleSaved() {
    setModal(null);
    showToast("Guardado correctamente");
    startTransition(() => { reload(); });
  }

  async function handleDelete(emp: Empleado) {
    if (!confirm(`¿Marcar como inactivo a ${emp.nombre}?`)) return;
    const res = await fetch(`/api/admin/empleados/${emp.id}`, { method: "DELETE" });
    if (!res.ok) { showToast("Error al eliminar"); return; }
    showToast(`${emp.nombre} marcado como inactivo`);
    startTransition(() => { reload(); });
  }

  const filtered = empleados.filter((e) => {
    if (soloActivos && !e.activo) return false;
    if (filtroRol && e.rol !== filtroRol) return false;
    if (filtroTurno && String(e.turno_principal) !== filtroTurno) return false;
    return true;
  });

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro rol */}
        <div className="relative">
          <select className="border border-surface-border rounded-lg px-3 py-2 text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand/30"
            value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
            <option value="">Todos los roles</option>
            {ROL_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtro turno */}
        <div className="relative">
          <select className="border border-surface-border rounded-lg px-3 py-2 text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand/30"
            value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)}>
            <option value="">Todos los turnos</option>
            <option value="1">Turno 1</option>
            <option value="2">Turno 2</option>
            <option value="3">Turno 3</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Toggle activos */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)}
            className="accent-brand w-4 h-4 rounded" />
          Solo activos
        </label>

        <div className="flex-1" />

        {/* Nuevo */}
        <button onClick={() => setModal("new")}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-brand-black text-sm font-semibold rounded-lg transition-colors">
          <UserPlus className="w-4 h-4" />
          Nuevo Empleado
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-input border-b border-surface-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-16">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-20">Turno</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-20">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-24">Capacit.</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Sin empleados que coincidan con los filtros.
                </td>
              </tr>
            )}
            {filtered.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{emp.numero_empleado}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{emp.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROL_COLORS[emp.rol] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROL_LABELS[emp.rol] ?? emp.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {emp.turno_principal ? `T${emp.turno_principal}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${emp.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {emp.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {emp.capacitaciones?.length ?? 0} registro{(emp.capacitaciones?.length ?? 0) !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setModal(emp)} title="Editar"
                      className="text-gray-400 hover:text-brand-dark transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {emp.activo && (
                      <button onClick={() => handleDelete(emp)} title="Desactivar"
                        className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <EmpleadoModal
          empleado={modal === "new" ? null : modal}
          prensas={prensas}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
