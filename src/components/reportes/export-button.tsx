"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  inicio: string;
  fin:    string;
  turno:  string;
}

export function ExportButton({ inicio, fin, turno }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ inicio, fin, turno });
      const res = await fetch(`/api/reportes/export?${params}`);
      if (!res.ok) throw new Error("Error al generar el reporte");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `reporte_${inicio}_${fin}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("No se pudo exportar el reporte. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-brand-black font-semibold text-sm hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Download className="w-4 h-4" />}
      {loading ? "Generando..." : "Exportar Excel"}
    </button>
  );
}
