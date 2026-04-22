"use client";

import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import type { OEETrendRow } from "@/lib/data/dashboard";

interface OEETrendChartProps {
  data: OEETrendRow[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-gray-500">OEE</span>
        <span className="font-bold text-gray-900">{payload[0]?.value}%</span>
      </div>
      {payload[1] && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Meta</span>
          <span className="font-medium text-brand-dark">{payload[1]?.value}%</span>
        </div>
      )}
    </div>
  );
};

export function OEETrendChart({ data }: OEETrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Sin datos disponibles
      </div>
    );
  }

  const metaValue = data[0]?.meta ?? 85;

  // Show every ~5th label if many points
  const labelStep = data.length > 15 ? Math.ceil(data.length / 7) : 1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="oeeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 10, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          interval={labelStep - 1}
        />
        <YAxis
          domain={[40, 100]}
          tickCount={7}
          tick={{ fontSize: 10, fill: "#9CA3AF" }}
          tickFormatter={(v) => `${v}%`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={metaValue}
          stroke="#F5C400"
          strokeDasharray="5 3"
          strokeWidth={1.5}
          label={{ value: `Meta ${metaValue}%`, position: "right", fontSize: 10, fill: "#C9A000" }}
        />
        <Area
          type="monotone"
          dataKey="oee"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="url(#oeeGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: "#3B82F6" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
