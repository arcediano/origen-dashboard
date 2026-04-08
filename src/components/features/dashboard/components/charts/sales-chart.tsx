'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SALES_DATA = [
  { day: 'Lun', sales: 180 },
  { day: 'Mar', sales: 240 },
  { day: 'Mié', sales: 210 },
  { day: 'Jue', sales: 320 },
  { day: 'Vie', sales: 360 },
  { day: 'Sáb', sales: 410 },
  { day: 'Dom', sales: 290 },
];

export function SalesChart() {
  return (
    <section className="rounded-[24px] border border-border-subtle bg-surface-alt p-4 shadow-sm sm:p-5" data-testid="sales-chart">
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ventas últimos 7 días</h3>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={SALES_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5BA94D" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#5BA94D" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6ece3" />
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip formatter={(value: number) => [`${value}€`, 'Ventas']} />
            <Area type="monotone" dataKey="sales" stroke="#2f7a2b" strokeWidth={2.5} fill="url(#salesGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
