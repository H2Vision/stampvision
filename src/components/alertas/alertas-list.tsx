"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, XCircle, Info, CheckCircle2,
  RefreshCw, BellOff, Loader2, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alerta {
  id:           string;
  tipo:         string;
  severidad:    "info" | "warning" | "critical";
  mensaje:      string;
  prensa_id:    string;
  valor_actual: number;
  umbral:       number;
  leida:        boolean;
  created_at:   string;
  prensas:      { nombre: string } | null;
}

type Tab = "todas" | "no_leidas" | "critical";

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV = {
  critical: {
    icon:    XCircle,
    label:   "Crítica",
    bg:      "bg-red-50 border-red-200",
    icon_bg: "bg-red-100",
    icon_cl: "text-red-600",
    badge:   "bg-red-100 text-red-700 border-red-200",
    dot:     "bg-red-500",
  },
  warning: {
    icon:    AlertTriangle,
    label:   "Advertencia",
    bg:      "bg-amber-50 border-amber-200",
    icon_bg: "bg-amber-100",
    icon_cl: "text-amber-600",
    badge:   "bg-amber-100 text-amber-700 border-amber-200",
    dot:     "bg-amber-400",
  },
  info: {
    icon:    Info,
    label:   "Info",
    bg:      "bg-blue-50 border-blue-200",
    icon_bg: "bg-blue-100",
    icon_cl: "text-blue-600",
    badge:   "bg-blue-100 text-blue-700 border-blue-200",
    dot:     "bg-blue-400",
  },
} as const;

const TIPO_LABEL: Record<string, string> = {
  oee_bajo:           "OEE Bajo",
  scrap_alto:         "Scrap Alto",
  paro_largo:         "Paro Largo",
  meta_no_alcanzada:  "Meta no alcanzada",
};

const UNIT: Record<string, string> = {
  oee_bajo:   "%",
  scrap_alto: "%",
  paro_largo: " min",
  meta_no_alcanzada: "%",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({
  alerta,
  onMarkRead,
}: {
  alerta: Alerta;
  onMarkRead: (id: string) => void;
}) {
  const cfg = SEV[alerta.severidad] ?? SEV.info;
  const Icon = cfg.icon;
  const unit = UNIT[alerta.tipo] ?? "";
  const tipoLabel = TIPO_LABEL[alerta.tipo] ?? alerta.tipo;
  const prensaNombre = alerta.prensas?.nombre ?? "—";

  return (
    <div className={`rounded-xl border p-4 transition-opacity ${cfg.bg} ${alerta.leida ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.icon_bg}`}>
          <Icon className={`w-5 h-5 ${cfg.icon_cl}`} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
              {tipoLabel}
            </span>
            {!alerta.leida && (
              <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
            )}
          </div>

          <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug">
            {alerta.mensaje}
          </p>

          {/* Metrics row */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-medium text-gray-500">Prensa:</span>
              <span className="font-semibold text-gray-800">{prensaNombre}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500">Valor actual:</span>
              <span className={`font-bold ${alerta.severidad === "critical" ? "text-red-600" : "text-amber-600"}`}>
                {Number(alerta.valor_actual).toFixed(1)}{unit}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500">Umbral:</span>
              <span className="font-semibold text-gray-700">
                {alerta.severidad === "critical" ? "<" : alerta.tipo === "paro_largo" ? ">" : alerta.tipo === "scrap_alto" ? ">" : "<"}
                {Number(alerta.umbral)}{unit}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 ml-auto">
              {timeAgo(alerta.created_at)}
            </span>
          </div>
        </div>

        {/* Mark as read */}
        {!alerta.leida && (
          <button
            onClick={() => onMarkRead(alerta.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Leída
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AlertasList() {
  const [alertas, setAlertas]       = useState<Alerta[]>([]);
  const [loading, setLoading]       = useState(true);
  const [checking, setChecking]     = useState(false);
  const [tab, setTab]               = useState<Tab>("todas");
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchAlertas = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/alertas");
      const json = await res.json();
      setAlertas(json.alerts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlertas(); }, [fetchAlertas]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res  = await fetch("/api/alertas/check", { method: "POST" });
      const json = await res.json();
      setLastChecked(json.message ?? "Revisión completada");
      await fetchAlertas();
    } finally {
      setChecking(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    setAlertas((prev) => prev.map((a) => a.id === id ? { ...a, leida: true } : a));
    await fetch("/api/alertas", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
  };

  const handleMarkAllRead = async () => {
    setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
    await fetch("/api/alertas", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ markAllRead: true }),
    });
  };

  // Filtered lists
  const filtered = alertas.filter((a) => {
    if (tab === "no_leidas") return !a.leida;
    if (tab === "critical")  return a.severidad === "critical";
    return true;
  });

  const unreadCount   = alertas.filter((a) => !a.leida).length;
  const criticalCount = alertas.filter((a) => a.severidad === "critical" && !a.leida).length;

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "todas",     label: "Todas",     count: alertas.length },
    { key: "no_leidas", label: "No leídas", count: unreadCount },
    { key: "critical",  label: "Críticas",  count: criticalCount },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-white rounded-lg border border-surface-border p-1 gap-0.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "bg-brand text-brand-black shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tab === t.key
                      ? "bg-black/15 text-brand-black"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-surface-border text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marcar todas leídas
            </button>
          )}
          <button
            onClick={handleCheck}
            disabled={checking}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand hover:bg-brand-hover text-brand-black text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {checking
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Zap className="w-4 h-4" />
            }
            {checking ? "Revisando…" : "Revisar ahora"}
          </button>
        </div>
      </div>

      {/* Last check info */}
      {lastChecked && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-sm text-emerald-700 font-medium">{lastChecked}</span>
        </div>
      )}

      {/* Cron info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-white border border-surface-border rounded-xl">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Revisión automática:</span>{" "}
          Llama a <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">POST /api/alertas/check</code> desde un cron job (Vercel Cron, GitHub Actions, o cualquier scheduler) para revisión continua.
          Protege el endpoint con la variable de entorno <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">CRON_SECRET</code> y el header <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">Authorization: Bearer &lt;secret&gt;</code>.
        </div>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando alertas…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <BellOff className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Sin alertas</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {tab === "no_leidas" ? "Todas las alertas han sido leídas" :
               tab === "critical"  ? "No hay alertas críticas activas" :
               "Haz clic en 'Revisar ahora' para generar alertas"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((a) => (
            <AlertCard key={a.id} alerta={a} onMarkRead={handleMarkRead} />
          ))}
        </div>
      )}
    </div>
  );
}
