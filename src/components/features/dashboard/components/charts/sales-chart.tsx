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

const SALES_DATA = [
  { day: 'Lun', currentMonth: 180, previousMonth: 155 },
  { day: 'Mar', currentMonth: 240, previousMonth: 205 },
  { day: 'Mié', currentMonth: 210, previousMonth: 225 },
  { day: 'Jue', currentMonth: 320, previousMonth: 270 },
  { day: 'Vie', currentMonth: 360, previousMonth: 315 },
  { day: 'Sáb', currentMonth: 410, previousMonth: 350 },
  { day: 'Dom', currentMonth: 290, previousMonth: 265 },
];

export function SalesChart() {
  return (
    <section className="rounded-[24px] border border-border-subtle bg-surface-alt p-4 shadow-sm sm:p-5" data-testid="sales-chart">
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ventas: mes actual vs anterior</h3>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={SALES_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6ece3" />
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip formatter={(value: number, name: string) => [`${value}€`, name]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="currentMonth" name="Mes actual" fill="#3f8f3b" radius={[6, 6, 0, 0]} />
            <Line
              type="monotone"
              dataKey="previousMonth"
              name="Mes anterior"
              stroke="#8b5e3c"
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
