'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface ProfileViewsBarChartProps {
  data: ChartDataPoint[];
}

export function ProfileViewsBarChart({ data }: ProfileViewsBarChartProps) {
  return (
    <section
      className="rounded-[24px] border border-border-subtle bg-surface-alt p-4 shadow-sm sm:p-5 overflow-hidden"
      aria-label="Gráfica de visitas al perfil"
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Visitas acumuladas por período
      </h3>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'hsl(var(--text-subtle))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--text-subtle))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value: number) => [value, 'Visitas']}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid hsl(var(--border-subtle))',
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="value"
              name="Visitas"
              fill="hsl(var(--hoja))"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
