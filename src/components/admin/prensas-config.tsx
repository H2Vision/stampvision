"use client";

import { useRef, useState, useTransition } from "react";
import type { AdminPrensaRow } from "@/lib/data/admin";
import { updatePrensa } from "@/app/(dashboard)/admin/actions";
import { CheckCircle, Loader2, Pencil, X } from "lucide-react";

const ESTADO_OPTS = [
  { value: "activa",        label: "Activa",        color: "bg-green-100 text-green-700"  },
  { value: "mantenimiento", label: "Mantenimiento",  color: "bg-yellow-100 text-yellow-700"},
  { value: "inactiva",      label: "Inactiva",       color: "bg-gray-100 text-gray-500"    },
];

function EstadoBadge({ estado }: { estado: string }) {
  const opt = ESTADO_OPTS.find((o) => o.value === estado);
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${opt?.color ?? "bg-gray-100 text-gray-500"}`}>
      {opt?.label ?? estado}
    </span>
  );
}

function PrensaRow({ prensa }: { prensa: AdminPrensaRow }) {
  const [editing, setEditing]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [errMsg,  setErrMsg]    = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setErrMsg(null);
    const fd = new FormData(formRef.current);
    startTransition(async () => {
      const res = await updatePrensa(fd);
      if (res.error) { setErrMsg(res.error); return; }
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <tr className="border-b border-surface-border hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 font-semibold text-gray-900">{prensa.nombre}</td>

      {editing ? (
        <form ref={formRef} onSubmit={handleSubmit} className="contents">
          <input type="hidden" name="id" value={prensa.id} />

          {/* Meta OEE */}
          <td className="py-2 px-4">
            <div className="flex items-center gap-1">
              <input
                name="meta_oee"
                type="number"
                defaultValue={prensa.meta_oee}
                min={1} max={100} step={0.1}
                className="w-20 h-8 rounded-md border border-surface-border px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </td>

          {/* Tonelaje */}
          <td className="py-2 px-4">
            <input
              name="tonelaje"
              type="number"
              defaultValue={prensa.tonelaje}
              min={1}
              className="w-24 h-8 rounded-md border border-surface-border px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </td>

          {/* Velocidad */}
          <td className="py-2 px-4">
            <input
              name="velocidad_estandar"
              type="number"
              defaultValue={prensa.velocidad_estandar}
              min={1} step={0.1}
              className="w-24 h-8 rounded-md border border-surface-border px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </td>

          {/* Estado */}
          <td className="py-2 px-4">
            <select
              name="estado"
              defaultValue={prensa.estado}
              className="h-8 rounded-md border border-surface-border px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white"
            >
              {ESTADO_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </td>

          {/* Actions */}
          <td className="py-2 px-4">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-brand-black text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
              >
                {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                Guardar
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setErrMsg(null); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {errMsg && <p className="text-xs text-red-500 mt-1">{errMsg}</p>}
          </td>
        </form>
      ) : (
        <>
          <td className="py-3 px-4 text-gray-700">{prensa.meta_oee}%</td>
          <td className="py-3 px-4 text-gray-700">{prensa.tonelaje} ton</td>
          <td className="py-3 px-4 text-gray-700">{prensa.velocidad_estandar} pzs/min</td>
          <td className="py-3 px-4"><EstadoBadge estado={prensa.estado} /></td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-border text-xs font-medium text-gray-600 hover:border-brand hover:text-brand-dark transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Editar
              </button>
              {success && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Guardado
                </span>
              )}
            </div>
          </td>
        </>
      )}
    </tr>
  );
}

export function PrensasConfig({ prensas }: { prensas: AdminPrensaRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-surface-border">
            {["Prensa", "Meta OEE", "Tonelaje", "Vel. Estándar", "Estado", "Acciones"].map((h) => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {prensas.map((p) => <PrensaRow key={p.id} prensa={p} />)}
        </tbody>
      </table>
    </div>
  );
}
