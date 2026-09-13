'use client';

import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export interface ChartSlice {
  name: string;
  value: number;
  color: string;
  /** Admin route this slice should navigate to when clicked. */
  href?: string;
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid rgba(17,16,20,0.1)',
  boxShadow: '0 8px 24px rgba(17,16,20,0.08)',
  fontSize: 12,
  padding: '6px 10px',
};

/** Donut chart with a total in the center — click a slice to jump to its filtered admin page. */
export function DonutChart({ data, centerLabel }: { data: ChartSlice[]; centerLabel?: string }) {
  const router = useRouter();
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
          >
            {data.map((slice) => (
              <Cell
                key={slice.name}
                fill={slice.color}
                cursor={slice.href ? 'pointer' : 'default'}
                onClick={() => slice.href && router.push(slice.href)}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="section-title text-2xl text-onyx">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-charcoal/45">{centerLabel}</span>
        </div>
      )}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {data.map((slice) => (
          <button
            key={slice.name}
            type="button"
            onClick={() => slice.href && router.push(slice.href)}
            disabled={!slice.href}
            className={`flex items-center gap-1.5 text-xs text-charcoal/70 ${
              slice.href ? 'cursor-pointer hover:text-onyx' : 'cursor-default'
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} />
            {slice.name} · {slice.value}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Simple vertical bar chart — not interactive by default, used for counts with no natural drill-down page. */
export function SimpleBarChart({
  data,
  color = '#1B3FA0',
}: {
  data: { name: string; value: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(17,16,20,0.08)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#2B2A29', fillOpacity: 0.6 }}
          axisLine={{ stroke: 'rgba(17,16,20,0.12)' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#2B2A29', fillOpacity: 0.6 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(17,16,20,0.04)' }} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
