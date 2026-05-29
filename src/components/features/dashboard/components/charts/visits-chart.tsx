'use client';

import { useEffect, useState } from 'react';
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
import { fetchProfileViewChart, type ProfileViewChartPoint } from '@/lib/api/producers';

type ChartPeriod = '7d' | '6m' | '1y';

interface VisitsChartProps {
  period?: ChartPeriod;
}

export function VisitsChart({ period = '6m' }: VisitsChartProps) {
  const [chartData, setChartData] = useState<ProfileViewChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    fetchProfileViewChart(period).then((res) => {
      if (!active) return;
      setChartData(!res.error && res.data && res.data.length > 0 ? res.data : []);
      setIsLoading(false);
    });

    return () => { active = false; };
  }, [period]);

  const periodLabel =
    period === '7d'
      ? 'últimos 7 días vs 7 anteriores'
      : period === '6m'
        ? 'últimos 6 meses vs 6 anteriores'
        : 'último año vs año anterior';

  return (
    <section
      className="rounded-[24px] border border-border-subtle bg-surface-alt p-4 shadow-sm sm:p-5 overflow-hidden"
      data-testid="visits-chart"
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Visitas al perfil · {periodLabel}
        </h3>
      </div>
      <div className="h-52 w-full">
        {isLoading ? (
          <div className="h-full w-full flex flex-col justify-end px-1 pb-1 animate-pulse">
            <div className="flex items-end gap-1.5 h-full">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-border-subtle"
                  style={{ height: `${25 + ((i * 17) % 60)}%` }}
                />
              ))}
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-subtle">
            <span className="text-sm">Sin visitas en este período</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--text-subtle))', fontSize: 12 }} axisLine={false} tickLine={false} />
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
        )}
      </div>
    </section>
  );
}
