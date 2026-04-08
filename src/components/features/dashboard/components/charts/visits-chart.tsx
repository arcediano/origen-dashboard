'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ChartPeriod = '7d' | '6m' | '1y';

interface VisitsChartProps {
  period?: ChartPeriod;
}

const VISITS_DATA: Record<ChartPeriod, Array<{ day: string; currentPeriod: number; previousPeriod: number }>> = {
  '7d': [
    { day: 'Lun', currentPeriod: 120, previousPeriod: 105 },
    { day: 'Mar', currentPeriod: 180, previousPeriod: 150 },
    { day: 'Mié', currentPeriod: 165, previousPeriod: 172 },
    { day: 'Jue', currentPeriod: 260, previousPeriod: 215 },
    { day: 'Vie', currentPeriod: 310, previousPeriod: 265 },
    { day: 'Sáb', currentPeriod: 280, previousPeriod: 240 },
    { day: 'Dom', currentPeriod: 220, previousPeriod: 210 },
  ],
  '6m': [
    { day: 'Nov', currentPeriod: 5760, previousPeriod: 5290 },
    { day: 'Dic', currentPeriod: 5910, previousPeriod: 5480 },
    { day: 'Ene', currentPeriod: 5620, previousPeriod: 5210 },
    { day: 'Feb', currentPeriod: 6040, previousPeriod: 5570 },
    { day: 'Mar', currentPeriod: 6290, previousPeriod: 5820 },
    { day: 'Abr', currentPeriod: 6150, previousPeriod: 5690 },
  ],
  '1y': [
    { day: 'May', currentPeriod: 4820, previousPeriod: 4390 },
    { day: 'Jun', currentPeriod: 4950, previousPeriod: 4520 },
    { day: 'Jul', currentPeriod: 5070, previousPeriod: 4680 },
    { day: 'Ago', currentPeriod: 4930, previousPeriod: 4510 },
    { day: 'Sep', currentPeriod: 5210, previousPeriod: 4760 },
    { day: 'Oct', currentPeriod: 5380, previousPeriod: 4890 },
    { day: 'Nov', currentPeriod: 5760, previousPeriod: 5290 },
    { day: 'Dic', currentPeriod: 5910, previousPeriod: 5480 },
    { day: 'Ene', currentPeriod: 5620, previousPeriod: 5210 },
    { day: 'Feb', currentPeriod: 6040, previousPeriod: 5570 },
    { day: 'Mar', currentPeriod: 6290, previousPeriod: 5820 },
    { day: 'Abr', currentPeriod: 6150, previousPeriod: 5690 },
  ],
};

export function VisitsChart({ period = '6m' }: VisitsChartProps) {
  const title =
    period === '7d'
      ? 'Visitas: últimos 7 días vs 7 anteriores'
      : period === '6m'
        ? 'Visitas: últimos 6 meses vs 6 anteriores'
        : 'Visitas: último año vs año anterior';

  return (
    <section className="rounded-[24px] border border-border-subtle bg-surface-alt p-4 shadow-sm sm:p-5" data-testid="visits-chart">
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={VISITS_DATA[period]} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
            <XAxis dataKey="day" tick={{ fill: 'hsl(var(--text-subtle))', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(var(--text-subtle))', fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="currentPeriod" name="Periodo actual" fill="hsl(var(--hoja))" radius={[6, 6, 0, 0]} />
            <Line
              type="monotone"
              dataKey="previousPeriod"
              name="Periodo anterior"
              stroke="hsl(var(--pino))"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
