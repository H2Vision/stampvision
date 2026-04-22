"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import type { PrensaOEEHistory } from "@/lib/data/prensas";

export function PrensaOEEChart({ data }: { data: PrensaOEEHistory[] }) {
  const meta = data[0]?.meta ?? 82;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Sin datos en los últimos 30 días
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="oeeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F5C400" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F5C400" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          width={38}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [`${v}%`, "OEE"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <ReferenceLine
          y={meta}
          stroke="#6b7280"
          strokeDasharray="4 3"
          label={{ value: `Meta ${meta}%`, position: "right", fontSize: 10, fill: "#6b7280" }}
        />
        <Area
          type="monotone"
          dataKey="oee"
          stroke="#F5C400"
          strokeWidth={2}
          fill="url(#oeeGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#F5C400" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
