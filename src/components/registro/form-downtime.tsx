"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";

// ─── Catálogos ────────────────────────────────────────────────────────────────

const MOTIVOS_PARO = [
  "Arranque de turno",
  "Ajuste de troquel",
  "Cambio de modelo",
  "Cambio de rollo",
  "Cambio de caja",
  "Cambio de bobina",
  "Comida",
  "Liberación de pieza",
  "Falla de compresor (Presión baja)",
  "Falla eléctrica (Fallo de luz)",
  "Falla de sensores de doble chapa",
  "Falla de sistema de lubricación",
  "Falta de insumos",
  "Fin de turno",
  "Inspección de Calidad",
  "Mantenimiento general",
  "Mantenimiento Tool Shop",
  "Pérdida de avance",
  "Punzón roto",
  "Otro (especifique en comentarios)",
];

const TURNOS = [
  { value: 1, label: "Turno 1  (6:00 – 14:00)" },
  { value: 2, label: "Turno 2  (14:00 – 22:00)" },
  { value: 3, label: "Turno 3  (22:00 – 6:00)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoyMexico() {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function minutosEntre(inicio: string, fin: string): number | null {
  if (!inicio || !fin) return null;
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fin.split(":").map(Number);
  const diff = (hf * 60 + mf) - (hi * 60 + mi);
  return diff > 0 ? diff : null;
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

const INPUT  = "w-full border-2 border-surface-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand transition-colors bg-white";
const SELECT = INPUT + " cursor-pointer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventoParo {
  motivo:       string;
  hora_inicio:  string;
  hora_fin:     string;
  comentarios:  string;
}

interface FormBase {
  operador:     string;
  fecha:        string;
  turno:        string;
  prensa_id:    string;
  numero_parte: string;
  po:           string;
}

const EMPTY_BASE: FormBase = {
  operador: "", fecha: hoyMexico(), turno: "", prensa_id: "", numero_parte: "", po: "",
};

const EMPTY_EVENTO: EventoParo = { motivo: "", hora_inicio: "", hora_fin: "", comentarios: "" };

interface Props {
  prensas:      { id: string; nombre: string }[];
  operadores:   string[];
  numerosParte: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormDowntime({ prensas, operadores, numerosParte }: Props) {
  const [base, setBase]           = useState<FormBase>(EMPTY_BASE);
  const [eventos, setEventos]     = useState<EventoParo[]>([{ ...EMPTY_EVENTO }]);
  const [saving, startSaving]     = useTransition();
  const [status, setStatus]       = useState<"idle" | "ok" | "error">("idle");
  const [errMsg, setErrMsg]       = useState("");

  function setB(field: keyof FormBase, value: string) {
    setBase((f) => ({ ...f, [field]: value }));
    if (status !== "idle") setStatus("idle");
  }

  function setE(idx: number, field: keyof EventoParo, value: string) {
    setEventos((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
    if (status !== "idle") setStatus("idle");
  }

  function addEvento() {
    setEventos((prev) => [...prev, { ...EMPTY_EVENTO }]);
  }

  function removeEvento(idx: number) {
    setEventos((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!base.operador || !base.turno || !base.prensa_id || !base.fecha) {
      setErrMsg("Completa los campos obligatorios (*).");
      setStatus("error");
      return;
    }
    for (const ev of eventos) {
      if (!ev.motivo || !ev.hora_inicio || !ev.hora_fin) {
        setErrMsg("Cada paro necesita motivo, hora de inicio y hora de fin.");
        setStatus("error");
        return;
      }
      if (minutosEntre(ev.hora_inicio, ev.hora_fin) === null) {
        setErrMsg("La hora de fin debe ser después de la hora de inicio.");
        setStatus("error");
        return;
      }
    }
    setErrMsg("");
    startSaving(async () => {
      const results = await Promise.all(
        eventos.map((ev) =>
          fetch("/api/registro/downtime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prensa_id:    base.prensa_id,
              operador:     base.operador,
              turno:        Number(base.turno),
              fecha:        base.fecha,
              numero_parte: base.numero_parte || null,
              po:           base.po           || null,
              motivo:       ev.motivo,
              hora_inicio:  ev.hora_inicio,
              hora_fin:     ev.hora_fin,
              comentarios:  ev.comentarios    || null,
            }),
          })
        )
      );
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        setStatus("ok");
        setBase({ ...EMPTY_BASE, operador: base.operador, turno: base.turno, fecha: base.fecha });
        setEventos([{ ...EMPTY_EVENTO }]);
      } else {
        setErrMsg("Error al guardar uno o más registros.");
        setStatus("error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
        Los campos con <span className="text-red-500">*</span> son obligatorios
      </p>

      {/* ── Bloque 1: Identificación ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre del Operador" required>
          <select className={SELECT} value={base.operador} onChange={(e) => setB("operador", e.target.value)}>
            <option value="">— Selecciona —</option>
            {operadores.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Fecha" required>
          <input type="date" className={INPUT} value={base.fecha} onChange={(e) => setB("fecha", e.target.value)} />
        </Field>

        <Field label="Turno" required>
          <select className={SELECT} value={base.turno} onChange={(e) => setB("turno", e.target.value)}>
            <option value="">— Selecciona —</option>
            {TURNOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>

        <Field label="Número de Prensa" required>
          <select className={SELECT} value={base.prensa_id} onChange={(e) => setB("prensa_id", e.target.value)}>
            <option value="">— Selecciona —</option>
            {prensas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Field>

        <Field label="Número de Parte">
          <select className={SELECT} value={base.numero_parte} onChange={(e) => setB("numero_parte", e.target.value)}>
            <option value="">— Selecciona —</option>
            {numerosParte.map((np) => <option key={np} value={np}>{np}</option>)}
          </select>
        </Field>

        <Field label="PO (Orden de Producción)">
          <input
            className={INPUT} placeholder="Ej. PO-2026-0412"
            value={base.po} onChange={(e) => setB("po", e.target.value)}
          />
        </Field>
      </div>

      <hr className="border-surface-border" />

      {/* ── Bloque 2: Eventos de paro ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-base">Paros del turno</h3>
          <button
            type="button"
            onClick={addEvento}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-brand/10 text-brand-dark rounded-lg hover:bg-brand/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar paro
          </button>
        </div>

        {eventos.map((ev, idx) => {
          const mins = minutosEntre(ev.hora_inicio, ev.hora_fin);
          return (
            <div key={idx} className="border-2 border-surface-border rounded-xl p-4 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600 text-sm">Paro #{idx + 1}</span>
                {eventos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEvento(idx)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Field label="Motivo del Tiempo Muerto" required>
                <select className={SELECT} value={ev.motivo} onChange={(e) => setE(idx, "motivo", e.target.value)}>
                  <option value="">— Selecciona el motivo —</option>
                  {MOTIVOS_PARO.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Hora de Inicio" required>
                  <input
                    type="time" className={INPUT}
                    value={ev.hora_inicio}
                    onChange={(e) => setE(idx, "hora_inicio", e.target.value)}
                  />
                </Field>
                <Field label="Hora de Fin" required>
                  <input
                    type="time" className={INPUT}
                    value={ev.hora_fin}
                    onChange={(e) => setE(idx, "hora_fin", e.target.value)}
                  />
                </Field>
              </div>

              {mins !== null && (
                <p className="text-sm font-semibold text-brand-dark">
                  Duración: <span className="text-lg">{mins}</span> minutos
                </p>
              )}

              <Field label="Comentarios (opcional)">
                <input
                  className={INPUT}
                  placeholder="Detalle adicional del paro..."
                  value={ev.comentarios}
                  onChange={(e) => setE(idx, "comentarios", e.target.value)}
                />
              </Field>
            </div>
          );
        })}
      </div>

      {/* ── Total ── */}
      {eventos.length > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-brand/5 rounded-xl border border-brand/20">
          <span className="font-semibold text-gray-700">Total tiempo muerto:</span>
          <span className="text-xl font-bold text-brand-dark">
            {eventos.reduce((acc, ev) => acc + (minutosEntre(ev.hora_inicio, ev.hora_fin) ?? 0), 0)} min
          </span>
        </div>
      )}

      {/* ── Feedback ── */}
      {status === "ok" && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-semibold">¡Registro guardado correctamente!</p>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{errMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 text-lg font-bold bg-brand text-white rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors"
      >
        {saving ? "Guardando…" : "ENVIAR REGISTRO"}
      </button>
    </form>
  );
}
