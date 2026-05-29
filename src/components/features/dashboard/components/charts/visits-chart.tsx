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
import { fetchProductViewChart } from '@/lib/api/products';

type ChartPeriod = '7d' | '6m' | '1y';

interface VisitsChartProps {
  period?: ChartPeriod;
  /** 'profile' = visitas al perfil del productor (default). 'products' = visitas a sus productos. */
  type?: 'profile' | 'products';
}

const FALLBACK_DATA: Record<ChartPeriod, ProfileViewChartPoint[]> = {
  '7d': [
    { label: 'Lun', currentPeriod: 120, previousPeriod: 105 },
    { label: 'Mar', currentPeriod: 180, previousPeriod: 150 },
    { label: 'Mié', currentPeriod: 165, previousPeriod: 172 },
    { label: 'Jue', currentPeriod: 260, previousPeriod: 215 },
    { label: 'Vie', currentPeriod: 310, previousPeriod: 265 },
    { label: 'Sáb', currentPeriod: 280, previousPeriod: 240 },
    { label: 'Dom', currentPeriod: 220, previousPeriod: 210 },
  ],
  '6m': [
    { label: 'Nov', currentPeriod: 5760, previousPeriod: 5290 },
    { label: 'Dic', currentPeriod: 5910, previousPeriod: 5480 },
    { label: 'Ene', currentPeriod: 5620, previousPeriod: 5210 },
    { label: 'Feb', currentPeriod: 6040, previousPeriod: 5570 },
    { label: 'Mar', currentPeriod: 6290, previousPeriod: 5820 },
    { label: 'Abr', currentPeriod: 6150, previousPeriod: 5690 },
  ],
  '1y': [
    { label: 'May', currentPeriod: 4820, previousPeriod: 4390 },
    { label: 'Jun', currentPeriod: 4950, previousPeriod: 4520 },
    { label: 'Jul', currentPeriod: 5070, previousPeriod: 4680 },
    { label: 'Ago', currentPeriod: 4930, previousPeriod: 4510 },
    { label: 'Sep', currentPeriod: 5210, previousPeriod: 4760 },
    { label: 'Oct', currentPeriod: 5380, previousPeriod: 4890 },
    { label: 'Nov', currentPeriod: 5760, previousPeriod: 5290 },
    { label: 'Dic', currentPeriod: 5910, previousPeriod: 5480 },
    { label: 'Ene', currentPeriod: 5620, previousPeriod: 5210 },
    { label: 'Feb', currentPeriod: 6040, previousPeriod: 5570 },
    { label: 'Mar', currentPeriod: 6290, previousPeriod: 5820 },
    { label: 'Abr', currentPeriod: 6150, previousPeriod: 5690 },
  ],
};

export function VisitsChart({ period = '6m', type = 'profile' }: VisitsChartProps) {
  const [chartData, setChartData] = useState<ProfileViewChartPoint[]>(FALLBACK_DATA[period]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const fetch = type === 'products' ? fetchProductViewChart : fetchProfileViewChart;
    fetch(period).then((res) => {
      if (!active) return;
      if (!res.error && res.data && res.data.length > 0) {
        setChartData(res.data);
      } else {
        setChartData(FALLBACK_DATA[period]);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [period, type]);

  const entityLabel = type === 'products' ? 'Visitas a productos' : 'Visitas al perfil';
  const title =
    period === '7d'
      ? `${entityLabel}: últimos 7 días vs 7 anteriores`
      : period === '6m'
        ? `${entityLabel}: últimos 6 meses vs 6 anteriores`
        : `${entityLabel}: último año vs año anterior`;

  return (
    <section
      className={`rounded-[24px] border border-border-subtle bg-surface-alt p-4 shadow-sm sm:p-5 overflow-hidden transition-opacity${isLoading ? ' opacity-60' : ''}`}
      data-testid="visits-chart"
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      </div>
      <div className="h-52 w-full">
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
      </div>
    </section>
  );
}
