"use client";

import { useState } from "react";
import { Factory, Clock } from "lucide-react";
import { FormProduccion } from "./form-produccion";
import { FormDowntime }   from "./form-downtime";

interface Props {
  prensas:      { id: string; nombre: string }[];
  operadores:   string[];
  numerosParte: string[];
}

export function RegistroTabs({ prensas, operadores, numerosParte }: Props) {
  const [tab, setTab] = useState<"produccion" | "downtime">("produccion");

  return (
    <div className="space-y-4">
      {/* Tabs grandes — fáciles de tocar en tableta */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setTab("produccion")}
          className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 text-base font-semibold transition-all
            ${tab === "produccion"
              ? "border-brand bg-brand/10 text-brand-dark"
              : "border-surface-border bg-white text-gray-500 hover:border-gray-300"}`}
        >
          <Factory className="w-6 h-6" />
          Reporte de Producción
        </button>
        <button
          onClick={() => setTab("downtime")}
          className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 text-base font-semibold transition-all
            ${tab === "downtime"
              ? "border-brand bg-brand/10 text-brand-dark"
              : "border-surface-border bg-white text-gray-500 hover:border-gray-300"}`}
        >
          <Clock className="w-6 h-6" />
          Tiempo Muerto
        </button>
      </div>

      {/* Contenido */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card">
        {tab === "produccion"
          ? <FormProduccion prensas={prensas} operadores={operadores} numerosParte={numerosParte} />
          : <FormDowntime   prensas={prensas} operadores={operadores} numerosParte={numerosParte} />
        }
      </div>
    </div>
  );
}
