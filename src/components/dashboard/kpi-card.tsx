import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title:     string;
  value:     string;
  delta:     number;
  unit?:     string;
  icon:      LucideIcon;
  isInverse?: boolean; // true = lower delta is better (e.g. Scrap Rate)
}

export function KPICard({ title, value, delta, unit, icon: Icon, isInverse = false }: KPICardProps) {
  const isPositive = isInverse ? delta < 0 : delta > 0;
  const isNeutral  = delta === 0;

  const trendColor = isNeutral
    ? "text-gray-400"
    : isPositive
      ? "text-emerald-500"
      : "text-red-500";

  const trendBg = isNeutral
    ? "bg-gray-100"
    : isPositive
      ? "bg-emerald-50"
      : "bg-red-50";

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  const sign = delta > 0 ? "+" : "";

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-brand-yellow-10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-yellow" strokeWidth={2} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-gray-900 leading-none tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-base font-medium text-gray-400 mb-0.5">{unit}</span>
        )}
      </div>

      {/* Delta badge */}
      <div className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-xs font-semibold ${trendBg} ${trendColor}`}>
        <TrendIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span>
          {isNeutral ? "Sin cambio" : `${sign}${delta}${unit ?? ""} vs ayer`}
        </span>
      </div>
    </div>
  );
}
