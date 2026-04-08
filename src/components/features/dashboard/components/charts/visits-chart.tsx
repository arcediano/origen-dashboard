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

const VISITS_DATA = [
  { day: 'Lun', visits: 120 },
  { day: 'Mar', visits: 180 },
  { day: 'Mié', visits: 165 },
  { day: 'Jue', visits: 260 },
  { day: 'Vie', visits: 310 },
  { day: 'Sáb', visits: 280 },
  { day: 'Dom', visits: 220 },
];

export function VisitsChart() {
  return (
    <section className="rounded-[24px] border border-border-subtle bg-surface-alt p-4 shadow-sm sm:p-5" data-testid="visits-chart">
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Visitas semanales</h3>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={VISITS_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6ece3" />
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip formatter={(value: number) => [`${value}`, 'Visitas']} />
            <Bar dataKey="visits" fill="#3f8f3b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
