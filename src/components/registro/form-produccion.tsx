"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

// ─── Catálogos ────────────────────────────────────────────────────────────────

const TIPOS_DEFECTO = [
  "Piezas Scrap por Ajuste",
  "Piezas Scrap por Inicio de Rollo",
  "Piezas Scrap por Final de Rollo",
  "Piezas fuera de especificación (Dimensional)",
  "Piezas Scrap por Rebaba",
  "Piezas Scrap por Fisura",
  "Piezas Scrap por Deformación",
  "Piezas Scrap por Doblez Incorrecto",
  "Piezas Scrap por falta de Punzonado",
  "Piezas Scrap por Falta de Formado",
  "Piezas con Óxido y/o manchas",
  "Piezas con Corte de Trim Desfazado",
  "Piezas con Barreno fuera de posición",
  "Piezas con Dobleces deformes",
  "Otro (especifique en comentarios)",
];

const TIPOS_MATERIAL = ["Rollo", "Bobina", "Caja", "Contenedor"];
const TURNOS = [
  { value: 1, label: "Turno 1  (6:00 – 14:00)" },
  { value: 2, label: "Turno 2  (14:00 – 22:00)" },
  { value: 3, label: "Turno 3  (22:00 – 6:00)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoyMexico() {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full border-2 border-surface-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand transition-colors bg-white";
const SELECT = INPUT + " cursor-pointer";

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  prensas:      { id: string; nombre: string }[];
  operadores:   string[];
  numerosParte: string[];
}

interface Form {
  operador:          string;
  fecha:             string;
  turno:             string;
  prensa_id:         string;
  numero_parte:      string;
  velocidad_real:    string;
  comentarios_gpm:   string;
  tipo_material:     string;
  cantidad_material: string;
  piezas_ok:         string;
  piezas_nok:        string;
  tipo_defecto:      string;
  po:                string;
  kilos_scrap:       string;
  comentarios:       string;
}

const EMPTY: Form = {
  operador: "", fecha: hoyMexico(), turno: "", prensa_id: "",
  numero_parte: "", velocidad_real: "", comentarios_gpm: "",
  tipo_material: "", cantidad_material: "",
  piezas_ok: "", piezas_nok: "", tipo_defecto: "",
  po: "", kilos_scrap: "", comentarios: "",
};

export function FormProduccion({ prensas, operadores, numerosParte }: Props) {
  const [form, setForm]       = useState<Form>(EMPTY);
  const [saving, startSaving] = useTransition();
  const [status, setStatus]   = useState<"idle" | "ok" | "error">("idle");
  const [errMsg, setErrMsg]   = useState("");

  function set(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (status !== "idle") setStatus("idle");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.operador || !form.turno || !form.prensa_id || !form.fecha) {
      setErrMsg("Completa los campos marcados con *");
      setStatus("error");
      return;
    }
    setErrMsg("");
    startSaving(async () => {
      const res = await fetch("/api/registro/produccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operador:          form.operador,
          fecha:             form.fecha,
          turno:             Number(form.turno),
          prensa_id:         form.prensa_id,
          numero_parte:      form.numero_parte || null,
          velocidad_real:    form.velocidad_real     ? Number(form.velocidad_real)    : null,
          comentarios_gpm:   form.comentarios_gpm    || null,
          tipo_material:     form.tipo_material       || null,
          cantidad_material: form.cantidad_material   ? Number(form.cantidad_material) : null,
          piezas_ok:         form.piezas_ok           ? Number(form.piezas_ok)          : null,
          piezas_nok:        form.piezas_nok          ? Number(form.piezas_nok)         : null,
          comentarios:       [form.tipo_defecto, form.comentarios].filter(Boolean).join(" | ") || null,
          po:                form.po                   || null,
          kilos_scrap:       form.kilos_scrap          ? Number(form.kilos_scrap)        : null,
        }),
      });
      if (res.ok) {
        setStatus("ok");
        setForm({ ...EMPTY, operador: form.operador, turno: form.turno, fecha: form.fecha });
      } else {
        const j = await res.json();
        setErrMsg(j.error ?? "Error al guardar.");
        setStatus("error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
        Los campos con <span className="text-red-500">*</span> son obligatorios
      </p>

      {/* ── Bloque 1: Quién / Cuándo ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre del Operador" required>
          <select className={SELECT} value={form.operador} onChange={(e) => set("operador", e.target.value)}>
            <option value="">— Selecciona —</option>
            {operadores.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Fecha" required>
          <input type="date" className={INPUT} value={form.fecha} onChange={(e) => set("fecha", e.target.value)} />
        </Field>

        <Field label="Turno" required>
          <select className={SELECT} value={form.turno} onChange={(e) => set("turno", e.target.value)}>
            <option value="">— Selecciona —</option>
            {TURNOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>

        <Field label="Número de Prensa" required>
          <select className={SELECT} value={form.prensa_id} onChange={(e) => set("prensa_id", e.target.value)}>
            <option value="">— Selecciona —</option>
            {prensas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Field>
      </div>

      <hr className="border-surface-border" />

      {/* ── Bloque 2: NP / GPM ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Número de Parte">
          <select className={SELECT} value={form.numero_parte} onChange={(e) => set("numero_parte", e.target.value)}>
            <option value="">— Selecciona —</option>
            {numerosParte.map((np) => <option key={np} value={np}>{np}</option>)}
          </select>
        </Field>

        <Field label="GPM Reales (golpes por minuto)">
          <input
            type="number" min="0" className={INPUT}
            placeholder="Ej. 72"
            value={form.velocidad_real}
            onChange={(e) => set("velocidad_real", e.target.value)}
          />
        </Field>

        <Field label="Comentarios GPM" >
          <input
            className={INPUT} placeholder="Ej. Velocidad baja por ajuste de troquel"
            value={form.comentarios_gpm}
            onChange={(e) => set("comentarios_gpm", e.target.value)}
          />
        </Field>
      </div>

      <hr className="border-surface-border" />

      {/* ── Bloque 3: Material ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Rollo / Bobina / Caja / Contenedor">
          <select className={SELECT} value={form.tipo_material} onChange={(e) => set("tipo_material", e.target.value)}>
            <option value="">— Selecciona tipo —</option>
            {TIPOS_MATERIAL.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label={`Cantidad de ${form.tipo_material || "Material"}`}>
          <input
            type="number" min="0" className={INPUT}
            placeholder="Ej. 3"
            value={form.cantidad_material}
            onChange={(e) => set("cantidad_material", e.target.value)}
          />
        </Field>
      </div>

      <hr className="border-surface-border" />

      {/* ── Bloque 4: Piezas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Número de Piezas OK" required>
          <input
            type="number" min="0" className={INPUT}
            placeholder="Ej. 4800"
            value={form.piezas_ok}
            onChange={(e) => set("piezas_ok", e.target.value)}
          />
        </Field>

        <Field label="Número de Piezas NOK (Scrap)" required>
          <input
            type="number" min="0" className={INPUT}
            placeholder="Ej. 23"
            value={form.piezas_nok}
            onChange={(e) => set("piezas_nok", e.target.value)}
          />
        </Field>

        {/* Tipo de defecto — solo aparece si hay NOK */}
        {Number(form.piezas_nok) > 0 && (
          <div className="sm:col-span-2">
            <Field label="Tipo de Defecto en Piezas NOK" required>
              <select className={SELECT} value={form.tipo_defecto} onChange={(e) => set("tipo_defecto", e.target.value)}>
                <option value="">— Selecciona el defecto —</option>
                {TIPOS_DEFECTO.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
        )}

        <Field label="Kilos de Scrap">
          <input
            type="number" min="0" step="0.1" className={INPUT}
            placeholder="Ej. 4.5"
            value={form.kilos_scrap}
            onChange={(e) => set("kilos_scrap", e.target.value)}
          />
        </Field>
      </div>

      <hr className="border-surface-border" />

      {/* ── Bloque 5: PO / Comentarios ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="PO (Orden de Producción)">
          <input
            className={INPUT} placeholder="Ej. PO-2026-0412"
            value={form.po}
            onChange={(e) => set("po", e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Comentarios Generales">
            <textarea
              className={INPUT + " resize-none"} rows={3}
              placeholder="Observaciones del turno, incidencias, etc."
              value={form.comentarios}
              onChange={(e) => set("comentarios", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* ── Feedback ── */}
      {status === "ok" && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-semibold">¡Reporte guardado correctamente!</p>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{errMsg}</p>
        </div>
      )}

      {/* ── Enviar ── */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 text-lg font-bold bg-brand text-white rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors"
      >
        {saving ? "Guardando…" : "ENVIAR REPORTE"}
      </button>
    </form>
  );
}
