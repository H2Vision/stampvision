"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import type { OEEByPrensaRow } from "@/lib/data/dashboard";

interface OEEByPrensaChartProps {
  data: OEEByPrensaRow[];
}

function oeeColor(oee: number): string {
  if (oee >= 85) return "#22c55e"; // green
  if (oee >= 70) return "#F5C400"; // brand yellow
  if (oee >= 50) return "#f97316"; // orange
  return "#ef4444";                // red
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: OEEByPrensaRow = payload[0].payload;
  return (
    <div className="bg-white border border-surface-border rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-gray-900 mb-2">{d.nombre}</p>
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between gap-4">
          <span>OEE</span>
          <span className="font-medium text-gray-900">{d.oee}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Meta</span>
          <span className="font-medium text-gray-900">{d.meta}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Disponibilidad</span>
          <span className="font-medium text-gray-900">{d.disponibilidad}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Scrap</span>
          <span className="font-medium text-gray-900">{d.scrapRate}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Piezas OK</span>
          <span className="font-medium text-gray-900">{d.piezasOk.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export function OEEByPrensaChart({ data }: OEEByPrensaChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Sin datos para esta fecha
      </div>
    );
  }

  const avgMeta = data.length > 0
    ? Math.round(data.reduce((s, r) => s + r.meta, 0) / data.length)
    : 85;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 48, bottom: 0, left: 8 }}
        barCategoryGap="28%"
      >
        <CartesianGrid horizontal={false} stroke="#E2E8F0" strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickCount={6}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          tickFormatter={(v) => `${v}%`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          width={72}
          tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <ReferenceLine
          x={avgMeta}
          stroke="#F5C400"
          strokeDasharray="4 3"
          strokeWidth={1.5}
          label={{ value: `Meta ${avgMeta}%`, position: "top", fontSize: 10, fill: "#C9A000" }}
        />
        <Bar dataKey="oee" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((entry) => (
            <Cell key={entry.prensaId} fill={oeeColor(entry.oee)} />
          ))}
          <LabelList
            dataKey="oee"
            position="right"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => `${v}%`}
            style={{ fontSize: 11, fontWeight: 600, fill: "#374151" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
