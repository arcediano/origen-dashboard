'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { fetchSellerOrders } from '@/lib/api/orders';

type ChartPeriod = '7d' | '6m' | '1y';

interface SalesChartProps {
  period?: ChartPeriod;
}

interface SalesPoint {
  day: string;
  currentPeriod: number;
  previousPeriod: number;
}



const PERIOD_SIZE: Record<ChartPeriod, number> = { '7d': 7, '6m': 6, '1y': 12 };

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatLabel(date: Date, period: ChartPeriod): string {
  if (period === '7d') {
    return date.toLocaleDateString('es-ES', { weekday: 'short' });
  }
  return date.toLocaleDateString('es-ES', { month: 'short' });
}

function buildSeriesFromOrders(period: ChartPeriod, orders: Array<{ createdAt: Date; total: number; status: string }>): SalesPoint[] {
  const buckets = PERIOD_SIZE[period];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMap = new Map<string, number>();
  const previousMap = new Map<string, number>();

  if (period === '7d') {
    const currentStart = new Date(today);
    currentStart.setDate(today.getDate() - (buckets - 1));

    const previousEnd = new Date(currentStart);
    previousEnd.setDate(currentStart.getDate() - 1);

    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - (buckets - 1));

    for (const order of orders) {
      if (order.status !== 'delivered') continue;

      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);

      if (orderDate >= currentStart && orderDate <= today) {
        const key = toDateKey(orderDate);
        currentMap.set(key, (currentMap.get(key) ?? 0) + order.total);
      }

      if (orderDate >= previousStart && orderDate <= previousEnd) {
        const key = toDateKey(orderDate);
        previousMap.set(key, (previousMap.get(key) ?? 0) + order.total);
      }
    }

    const series: SalesPoint[] = [];
    for (let i = 0; i < buckets; i++) {
      const currentDate = new Date(currentStart);
      currentDate.setDate(currentStart.getDate() + i);

      const previousDate = new Date(previousStart);
      previousDate.setDate(previousStart.getDate() + i);

      series.push({
        day: formatLabel(currentDate, period),
        currentPeriod: Math.round(currentMap.get(toDateKey(currentDate)) ?? 0),
        previousPeriod: Math.round(previousMap.get(toDateKey(previousDate)) ?? 0),
      });
    }

    return series;
  }

  const currentMonthStart = startOfMonth(today);
  const currentStart = addMonths(currentMonthStart, -(buckets - 1));
  const previousStart = addMonths(currentStart, -buckets);
  const previousEnd = addMonths(currentStart, -1);

  for (const order of orders) {
    if (order.status !== 'delivered') continue;

    const orderDate = startOfMonth(new Date(order.createdAt));

    if (orderDate >= currentStart && orderDate <= currentMonthStart) {
      const key = toMonthKey(orderDate);
      currentMap.set(key, (currentMap.get(key) ?? 0) + order.total);
    }

    if (orderDate >= previousStart && orderDate <= previousEnd) {
      const key = toMonthKey(orderDate);
      previousMap.set(key, (previousMap.get(key) ?? 0) + order.total);
    }
  }

  const series: SalesPoint[] = [];
  for (let i = 0; i < buckets; i++) {
    const currentDate = new Date(currentStart);
    currentDate.setMonth(currentStart.getMonth() + i);

    const previousDate = addMonths(currentDate, -buckets);

    const currentKey = toMonthKey(currentDate);
    const previousKey = toMonthKey(previousDate);

    series.push({
      day: formatLabel(currentDate, period),
      currentPeriod: Math.round(currentMap.get(currentKey) ?? 0),
      previousPeriod: Math.round(previousMap.get(previousKey) ?? 0),
    });
  }

  return series;
}

export function SalesChart({ period = '6m' }: SalesChartProps) {
  const [series, setSeries] = useState<SalesPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadChartData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchSellerOrders({ page: 1, limit: 500 });
        if (!active || response.error || !response.data) {
          if (active) setSeries([]);
          return;
        }

        const computed = buildSeriesFromOrders(
          period,
          response.data.orders.map((order) => ({
            createdAt: new Date(order.createdAt),
            total: order.total,
            status: order.status,
          })),
        );

        if (active) setSeries(computed);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadChartData();
    return () => {
      active = false;
    };
  }, [period]);

  const title = useMemo(() => {
    if (period === '7d') return 'Ventas: últimos 7 días vs 7 anteriores';
    if (period === '6m') return 'Ventas: últimos 6 meses vs 6 anteriores';
    return 'Ventas: último año vs año anterior';
  }, [period]);

  return (
    <section className="rounded-[24px] border border-border-subtle bg-surface-alt p-4 shadow-sm sm:p-5 overflow-hidden" data-testid="sales-chart">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
        {isLoading && <span className="text-[11px] text-text-subtle">Actualizando...</span>}
      </div>
      <div className="h-52 w-full">
        {isLoading ? (
          <div className="h-full w-full flex flex-col justify-end gap-2 px-1 pb-1 animate-pulse">
            <div className="flex items-end gap-1.5 h-full">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-border-subtle"
                  style={{ height: `${30 + ((i * 13) % 55)}%` }}
                />
              ))}
            </div>
          </div>
        ) : series.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-text-subtle">
            <span className="text-sm">Sin ventas en este período</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--text-subtle))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--text-subtle))', fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip formatter={(value: number, name: string) => [`${value}€`, name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="currentPeriod" name="Periodo actual" fill="hsl(var(--pradera))" radius={[6, 6, 0, 0]} />
              <Line
                type="monotone"
                dataKey="previousPeriod"
                name="Periodo anterior"
                stroke="hsl(var(--bosque))"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
