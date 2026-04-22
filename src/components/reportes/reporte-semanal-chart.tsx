"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import type { ReporteSemanalRow } from "@/lib/data/reportes";

const COLORS = ["#F5C400", "#3B82F6", "#10B981"];

interface Props {
  prensaNombres: string[];
  rows: ReporteSemanalRow[];
}

export function ReporteSemanalChart({ prensaNombres, rows }: Props) {
  if (rows.length === 0 || prensaNombres.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Sin datos suficientes para la tendencia semanal
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="semana"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
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
          formatter={(v: any, name: any) => [`${v}%`, name]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <ReferenceLine
          y={82}
          stroke="#9ca3af"
          strokeDasharray="4 3"
          label={{ value: "Meta 82%", position: "right", fontSize: 10, fill: "#9ca3af" }}
        />
        {prensaNombres.map((nombre, i) => (
          <Bar
            key={nombre}
            dataKey={nombre}
            fill={COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
