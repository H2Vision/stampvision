"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { read, utils } from "xlsx";
import {
  UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { uploadProduccionRows, type UploadRow } from "@/app/(dashboard)/upload/actions";

// ── Column aliases (flexible header names) ────────────────────────────────────
const ALIASES: Record<string, string> = {
  fecha:               "fecha",
  date:                "fecha",
  prensa:              "prensa_nombre",
  prensa_nombre:       "prensa_nombre",
  press:               "prensa_nombre",
  turno:               "turno",
  shift:               "turno",
  piezas_ok:           "piezas_ok",
  ok:                  "piezas_ok",
  good:                "piezas_ok",
  piezas_nok:          "piezas_nok",
  nok:                 "piezas_nok",
  scrap:               "piezas_nok",
  bad:                 "piezas_nok",
  tiempo_planeado_min: "tiempo_planeado_min",
  tiempo_planeado:     "tiempo_planeado_min",
  planned_time:        "tiempo_planeado_min",
  tiempo_muerto_min:   "tiempo_muerto_min",
  tiempo_muerto:       "tiempo_muerto_min",
  downtime:            "tiempo_muerto_min",
  causa_paro:          "causa_paro",
  causa:               "causa_paro",
  downtime_cause:      "causa_paro",
  numero_parte:        "numero_parte",
  part_number:         "numero_parte",
  parte:               "numero_parte",
  operador:            "operador",
  operator:            "operador",
};

const REQUIRED: (keyof UploadRow)[] = [
  "fecha", "prensa_nombre", "turno",
  "piezas_ok", "piezas_nok",
  "tiempo_planeado_min", "tiempo_muerto_min",
  "numero_parte", "operador",
];

type ParsedRow = Partial<UploadRow> & Record<string, unknown>;

interface ParseResult {
  rows:    UploadRow[];
  errors:  string[];
  headers: string[];
}

function parseSheet(buffer: ArrayBuffer): ParseResult {
  const wb      = read(buffer, { type: "array", cellDates: true });
  const ws      = wb.Sheets[wb.SheetNames[0]];
  const raw     = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  const errors: string[] = [];

  if (raw.length === 0) return { rows: [], errors: ["El archivo está vacío"], headers: [] };

  // Normalize headers via alias map
  const firstRow  = raw[0];
  const headerMap = new Map<string, string>(); // original → normalized
  for (const key of Object.keys(firstRow)) {
    const alias = ALIASES[key.toLowerCase().trim().replace(/ /g, "_")];
    if (alias) headerMap.set(key, alias);
  }

  const rows: UploadRow[] = [];

  raw.forEach((rawRow, i) => {
    const line = i + 2;
    const row: ParsedRow = {};

    for (const [origKey, normKey] of headerMap) {
      row[normKey] = rawRow[origKey];
    }

    // Check required fields
    const missing = REQUIRED.filter((f) => row[f] === undefined || row[f] === "");
    if (missing.length > 0) {
      errors.push(`Fila ${line}: faltan campos — ${missing.join(", ")}`);
      return;
    }

    // Normalize fecha
    let fecha = String(row.fecha ?? "");
    if (fecha.includes("/")) {
      // DD/MM/YYYY → YYYY-MM-DD
      const parts = fecha.split("/");
      if (parts.length === 3) fecha = `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
    } else if ((row.fecha as unknown) instanceof Date) {
      fecha = (row.fecha as unknown as Date).toISOString().split("T")[0];
    }

    rows.push({
      fecha,
      prensa_nombre:       String(row.prensa_nombre ?? "").trim(),
      turno:               Number(row.turno),
      piezas_ok:           Number(row.piezas_ok),
      piezas_nok:          Number(row.piezas_nok),
      tiempo_planeado_min: Number(row.tiempo_planeado_min),
      tiempo_muerto_min:   Number(row.tiempo_muerto_min),
      causa_paro:          String(row.causa_paro ?? ""),
      numero_parte:        String(row.numero_parte ?? "").trim(),
      operador:            String(row.operador ?? "").trim(),
    });
  });

  return {
    rows,
    errors,
    headers: Array.from(headerMap.values()),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

type Stage = "idle" | "preview" | "uploading" | "done" | "error";

export function UploadZone() {
  const inputRef        = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [fileName, setFileName]           = useState<string | null>(null);
  const [parsed, setParsed]               = useState<ParseResult | null>(null);
  const [stage, setStage]                 = useState<Stage>("idle");
  const [serverResult, setServerResult]   = useState<{ inserted: number; errors: string[] } | null>(null);
  const [isPending, startTransition]      = useTransition();

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setStage("idle");
    setParsed(null);
    setServerResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buf    = e.target?.result as ArrayBuffer;
      const result = parseSheet(buf);
      setParsed(result);
      setStage("preview");
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleUpload = () => {
    if (!parsed || parsed.rows.length === 0) return;
    startTransition(async () => {
      setStage("uploading");
      const result = await uploadProduccionRows(parsed.rows);
      setServerResult({ inserted: result.inserted, errors: result.errors });
      setStage(result.ok ? "done" : "error");
    });
  };

  const reset = () => {
    setFileName(null);
    setParsed(null);
    setStage("idle");
    setServerResult(null);
  };

  // ── Drop zone ──────────────────────────────────────────────────────────────
  if (stage === "idle" || !parsed) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          group relative flex flex-col items-center justify-center gap-5
          min-h-[320px] rounded-xl border-2 border-dashed cursor-pointer
          transition-colors duration-150
          ${isDragging
            ? "border-brand bg-brand-10"
            : "border-surface-border bg-white hover:border-brand hover:bg-brand-5"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={onFileChange}
        />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-brand/20" : "bg-brand-10 group-hover:bg-brand/20"}`}>
          <UploadCloud className="w-8 h-8 text-brand" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            Arrastra tu archivo aquí
          </p>
          <p className="text-xs text-gray-400 mt-1">
            o haz clic para seleccionar · CSV, XLSX, XLS
          </p>
        </div>

        {/* Column reference */}
        <div className="absolute bottom-5 left-0 right-0 px-6">
          <p className="text-xs text-center text-gray-400 mb-2 font-medium">Columnas requeridas en el archivo</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {REQUIRED.map((f) => (
              <span key={f} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-mono text-[10px]">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  if (stage === "preview") {
    const validRows   = parsed.rows.length;
    const parseErrors = parsed.errors;

    return (
      <div className="flex flex-col gap-5">
        {/* File chip */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-surface-border p-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{fileName}</p>
            <p className="text-xs text-gray-400">
              {validRows} fila{validRows !== 1 ? "s" : ""} válida{validRows !== 1 ? "s" : ""}
              {parseErrors.length > 0 && ` · ${parseErrors.length} error${parseErrors.length !== 1 ? "es" : ""} de parseo`}
            </p>
          </div>
          <button onClick={reset} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                {parseErrors.length} fila{parseErrors.length !== 1 ? "s" : ""} con problemas (se omitirán)
              </p>
            </div>
            <ul className="text-xs text-amber-700 space-y-0.5 max-h-32 overflow-y-auto">
              {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Preview table */}
        {validRows > 0 && (
          <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Vista previa — primeras {Math.min(5, validRows)} filas
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-surface-border">
                    {["Fecha","Prensa","Turno","OK","NOK","T.Plan","T.Muerto","Parte","Operador"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-surface-border last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{r.fecha}</td>
                      <td className="px-3 py-2">{r.prensa_nombre}</td>
                      <td className="px-3 py-2 text-center">{r.turno}</td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-medium">{r.piezas_ok}</td>
                      <td className="px-3 py-2 text-right text-red-600 font-medium">{r.piezas_nok}</td>
                      <td className="px-3 py-2 text-right">{r.tiempo_planeado_min}</td>
                      <td className="px-3 py-2 text-right">{r.tiempo_muerto_min}</td>
                      <td className="px-3 py-2 font-mono">{r.numero_parte}</td>
                      <td className="px-3 py-2">{r.operador}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {validRows > 5 && (
              <p className="text-center py-2 text-xs text-gray-400">
                + {validRows - 5} filas más
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg border border-surface-border bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={validRows === 0 || isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand text-brand-black font-semibold text-sm hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Insertando…</>
              : <>Subir {validRows} registro{validRows !== 1 ? "s" : ""}</>
            }
          </button>
        </div>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (stage === "done" || stage === "error") {
    const isSuccess = stage === "done";
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isSuccess ? "bg-emerald-100" : "bg-red-100"}`}>
          {isSuccess
            ? <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            : <AlertCircle  className="w-10 h-10 text-red-600" />
          }
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {isSuccess ? "¡Carga exitosa!" : "Error en la carga"}
          </p>
          {serverResult && (
            <p className="text-sm text-gray-500 mt-1">
              {serverResult.inserted > 0 && `${serverResult.inserted} registros insertados. `}
              {serverResult.errors.length > 0 && `${serverResult.errors.length} error(es).`}
            </p>
          )}
        </div>
        {serverResult && serverResult.errors.length > 0 && (
          <div className="w-full max-w-lg bg-red-50 border border-red-200 rounded-xl p-4">
            <ul className="text-xs text-red-700 space-y-0.5">
              {serverResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        <button
          onClick={reset}
          className="px-6 py-2 rounded-lg bg-brand text-brand-black font-semibold text-sm hover:bg-brand-hover transition-colors"
        >
          Subir otro archivo
        </button>
      </div>
    );
  }

  return null;
}
