/**
 * @page AnalyticasPage
 * @description Panel de analíticas del productor — visitas al perfil público.
 *   Muestra KPIs de visitas (hoy / semana / mes / histórico) conectados al
 *   endpoint real GET /producers/me/profile-views.
 */

import type { Metadata } from 'next';
import { Eye, TrendingUp, Calendar, Clock } from 'lucide-react';
import { SoftStatCard } from '@/components/shared/SoftStatCard';
import { fetchProfileViewStats } from '@/lib/api/producers';
import { ProfileViewsBarChart } from './ProfileViewsBarChart';

export const metadata: Metadata = {
  title: 'Analíticas | Origen Dashboard',
};

export default async function AnalyticasPage() {
  const result = await fetchProfileViewStats();
  const stats = result.data ?? { today: 0, week: 0, month: 0, total: 0 };

  const chartData = [
    { label: 'Hoy',     value: stats.today },
    { label: 'Semana',  value: stats.week },
    { label: 'Mes',     value: stats.month },
    { label: 'Total',   value: stats.total },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-xl font-bold text-origen-bosque sm:text-2xl">Analíticas</h1>
        <p className="mt-1 text-sm text-text-subtle">
          Visitas únicas a tu perfil público en Origen.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SoftStatCard
          label="Hoy"
          value={stats.today}
          icon={Clock}
          bg="from-origen-pradera/5 to-transparent"
          border="border-origen-pradera/10"
          iconColor="text-origen-pradera"
        />
        <SoftStatCard
          label="Esta semana"
          value={stats.week}
          icon={TrendingUp}
          bg="from-origen-hoja/5 to-transparent"
          border="border-origen-hoja/10"
          iconColor="text-origen-hoja"
        />
        <SoftStatCard
          label="Este mes"
          value={stats.month}
          icon={Calendar}
          bg="from-origen-pradera/5 to-transparent"
          border="border-origen-pradera/10"
          iconColor="text-origen-pradera"
        />
        <SoftStatCard
          label="Histórico"
          value={stats.total}
          icon={Eye}
          bg="from-feedback-warning-subtle/20 to-transparent"
          border="border-feedback-warning/30"
          iconColor="text-feedback-warning"
        />
      </div>

      {/* Gráfica de barras */}
      <ProfileViewsBarChart data={chartData} />

      {/* Nota informativa */}
      <p className="text-xs text-text-subtle">
        Las visitas se contabilizan por visitante único (hash anónimo de IP + agente de usuario) con una
        ventana de 24 horas para evitar duplicados.
      </p>
    </div>
  );
}
