"use client";

import { useRef, useState, useTransition } from "react";
import type { Umbrales } from "@/lib/data/admin";
import { updateUmbrales } from "@/app/(dashboard)/admin/actions";
import { CheckCircle, Loader2, AlertTriangle, XCircle, Clock } from "lucide-react";

interface UmbralFieldProps {
  name:    string;
  label:   string;
  value:   number;
  suffix:  string;
  hint:    string;
  icon:    React.ReactNode;
  color:   string;
}

function UmbralField({ name, label, value, suffix, hint, icon, color }: UmbralFieldProps) {
  return (
    <div className={`rounded-xl border-2 ${color} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-semibold text-gray-800">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          name={name}
          type="number"
          defaultValue={value}
          min={0}
          max={suffix === "%" ? 100 : 9999}
          step={0.1}
          className="w-24 h-10 rounded-lg border border-surface-border px-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white"
        />
        <span className="text-gray-500 font-medium">{suffix}</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{hint}</p>
    </div>
  );
}

export function UmbralesConfig({ umbrales }: { umbrales: Umbrales }) {
  const [success, setSuccess] = useState(false);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setErrMsg(null);
    const fd = new FormData(formRef.current);
    startTransition(async () => {
      const res = await updateUmbrales(fd);
      if (res.error) { setErrMsg(res.error); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="space-y-6">

        {/* OEE */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">OEE</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UmbralField
              name="oee_warning"
              label="OEE — Alerta"
              value={umbrales.oee_warning}
              suffix="%"
              hint="Se genera alerta warning cuando OEE cae por debajo de este valor"
              icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />}
              color="border-yellow-200 bg-yellow-50"
            />
            <UmbralField
              name="oee_critical"
              label="OEE — Crítico"
              value={umbrales.oee_critical}
              suffix="%"
              hint="Se genera alerta crítica cuando OEE cae por debajo de este valor"
              icon={<XCircle className="w-4 h-4 text-red-500" />}
              color="border-red-200 bg-red-50"
            />
          </div>
        </div>

        {/* Scrap */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Scrap</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UmbralField
              name="scrap_warning"
              label="Scrap — Alerta"
              value={umbrales.scrap_warning}
              suffix="%"
              hint="Alerta warning cuando el scrap supera este porcentaje"
              icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />}
              color="border-yellow-200 bg-yellow-50"
            />
            <UmbralField
              name="scrap_critical"
              label="Scrap — Crítico"
              value={umbrales.scrap_critical}
              suffix="%"
              hint="Alerta crítica cuando el scrap supera este porcentaje"
              icon={<XCircle className="w-4 h-4 text-red-500" />}
              color="border-red-200 bg-red-50"
            />
          </div>
        </div>

        {/* Tiempo muerto */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Tiempo Muerto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UmbralField
              name="downtime_warning"
              label="Tiempo muerto — Alerta"
              value={umbrales.downtime_warning}
              suffix="min"
              hint="Alerta cuando el tiempo muerto por turno supera este valor"
              icon={<Clock className="w-4 h-4 text-orange-500" />}
              color="border-orange-200 bg-orange-50"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand text-brand-black font-semibold text-sm hover:bg-brand-hover transition-colors disabled:opacity-50 shadow-sm"
          >
            {pending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle className="w-4 h-4" />}
            {pending ? "Guardando..." : "Guardar umbrales"}
          </button>
          {success && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" /> Umbrales actualizados
            </span>
          )}
          {errMsg && <span className="text-sm text-red-500">{errMsg}</span>}
        </div>
      </div>
    </form>
  );
}
