"use client";

import type { DataCard } from "@/app/api/chat/route";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

const COLOR_MAP: Record<string, string> = {
  green:  "text-emerald-600 bg-emerald-50 border-emerald-200",
  yellow: "text-yellow-700 bg-yellow-50 border-yellow-200",
  orange: "text-orange-600 bg-orange-50 border-orange-200",
  red:    "text-red-600 bg-red-50 border-red-200",
};

const BAR_COLOR: Record<string, string> = {
  green:  "bg-emerald-500",
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
  red:    "bg-red-500",
};

function KPICard({ card }: { card: DataCard }) {
  return (
    <div className="bg-white rounded-lg border border-surface-border p-3 flex items-center gap-3 min-w-[130px]">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        card.positive ? "bg-emerald-50" : "bg-red-50"
      }`}>
        {card.positive
          ? <TrendingUp className="w-4 h-4 text-emerald-600" />
          : <TrendingDown className="w-4 h-4 text-red-500" />
        }
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-medium leading-none">{card.label}</p>
        <p className="text-sm font-bold text-gray-900 mt-0.5 leading-none">{card.value}</p>
        {card.delta && (
          <p className={`text-[10px] mt-0.5 font-medium ${card.positive ? "text-emerald-600" : "text-red-500"}`}>
            {card.delta}
          </p>
        )}
      </div>
    </div>
  );
}

function RankingCard({ card }: { card: DataCard }) {
  const rows = card.rows ?? [];
  const maxVal = Math.max(...rows.map((r) => parseFloat(r.value) || 0));

  return (
    <div className="bg-white rounded-lg border border-surface-border p-3 min-w-[220px] max-w-[280px]">
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
      </div>
      <div className="space-y-1.5">
        {rows.map((row, i) => {
          const pct = maxVal > 0 ? ((parseFloat(row.value) || 0) / maxVal) * 100 : 0;
          const cls = COLOR_MAP[row.color ?? "green"] ?? COLOR_MAP.green;
          const barCls = BAR_COLOR[row.color ?? "green"] ?? BAR_COLOR.green;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] text-gray-700 font-medium">{row.label}</span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${cls}`}>
                  {row.value}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barCls}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DataCardsProps {
  cards: DataCard[];
}

export function DataCards({ cards }: DataCardsProps) {
  if (!cards.length) return null;

  const kpis     = cards.filter((c) => c.type === "kpi");
  const rankings = cards.filter((c) => c.type === "ranking");

  return (
    <div className="mb-3 space-y-2">
      {kpis.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {kpis.map((card, i) => <KPICard key={i} card={card} />)}
        </div>
      )}
      {rankings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rankings.map((card, i) => <RankingCard key={i} card={card} />)}
        </div>
      )}
    </div>
  );
}
