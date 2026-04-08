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

const VISITS_DATA = [
  { day: 'Lun', currentPeriod: 120, previousPeriod: 105 },
  { day: 'Mar', currentPeriod: 180, previousPeriod: 150 },
  { day: 'Mié', currentPeriod: 165, previousPeriod: 172 },
  { day: 'Jue', currentPeriod: 260, previousPeriod: 215 },
  { day: 'Vie', currentPeriod: 310, previousPeriod: 265 },
  { day: 'Sáb', currentPeriod: 280, previousPeriod: 240 },
  { day: 'Dom', currentPeriod: 220, previousPeriod: 210 },
];

export function VisitsChart() {
  return (
    <section className="rounded-[24px] border border-border-subtle bg-surface-alt p-4 shadow-sm sm:p-5" data-testid="visits-chart">
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Visitas: periodo actual vs anterior</h3>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={VISITS_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6ece3" />
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="currentPeriod" name="Periodo actual" fill="#3f8f3b" radius={[6, 6, 0, 0]} />
            <Line
              type="monotone"
              dataKey="previousPeriod"
              name="Periodo anterior"
              stroke="#3d6b8d"
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
