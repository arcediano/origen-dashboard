/**
 * @page AnalyticasPage
 * @description Panel de analíticas del productor.
 *   Sección 1: KPIs de visitas al perfil público — GET /producers/me/profile-views.
 *   Sección 2: KPIs de ventas y pedidos — GET /orders/seller.
 */

import type { Metadata } from 'next';
import {
  Eye, TrendingUp, Calendar, Clock,
  ShoppingBag, Euro, Package, CheckCircle2, Clock3, BarChart3,
} from 'lucide-react';
import { SoftStatCard } from '@/components/shared/SoftStatCard';
import { fetchProfileViewStats } from '@/lib/api/producers';
import { fetchOrderStats } from '@/lib/api/orders';
import { ProfileViewsBarChart } from './ProfileViewsBarChart';

export const metadata: Metadata = {
  title: 'Analíticas | Origen Dashboard',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export default async function AnalyticasPage() {
  const [viewsResult, salesResult] = await Promise.all([
    fetchProfileViewStats(),
    fetchOrderStats(),
  ]);

  const views = viewsResult.data ?? { today: 0, week: 0, month: 0, total: 0 };
  const sales = salesResult.data ?? {
    total: 0, pending: 0, processing: 0, shipped: 0,
    delivered: 0, cancelled: 0, refunded: 0,
    totalRevenue: 0, averageOrderValue: 0, todayOrders: 0, todayRevenue: 0,
  };

  const chartData = [
    { label: 'Hoy',     value: views.today },
    { label: 'Semana',  value: views.week },
    { label: 'Mes',     value: views.month },
    { label: 'Total',   value: views.total },
  ];

  return (
    <div className="space-y-8">
      {/* ─── Cabecera ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-origen-bosque sm:text-2xl">Analíticas</h1>
        <p className="mt-1 text-sm text-text-subtle">
          Resumen de rendimiento de tu tienda en Origen.
        </p>
      </div>

      {/* ─── SECCIÓN: Visitas al perfil ──────────────────────────────────── */}
      <section aria-labelledby="views-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-origen-pradera" aria-hidden />
          <h2 id="views-heading" className="text-sm font-semibold text-origen-oscuro">
            Visitas al perfil
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SoftStatCard
            label="Hoy"
            value={views.today}
            icon={Clock}
            bg="from-origen-pradera/5 to-transparent"
            border="border-origen-pradera/10"
            iconColor="text-origen-pradera"
          />
          <SoftStatCard
            label="Esta semana"
            value={views.week}
            icon={TrendingUp}
            bg="from-origen-hoja/5 to-transparent"
            border="border-origen-hoja/10"
            iconColor="text-origen-hoja"
          />
          <SoftStatCard
            label="Este mes"
            value={views.month}
            icon={Calendar}
            bg="from-origen-pradera/5 to-transparent"
            border="border-origen-pradera/10"
            iconColor="text-origen-pradera"
          />
          <SoftStatCard
            label="Histórico"
            value={views.total}
            icon={Eye}
            bg="from-feedback-warning-subtle/20 to-transparent"
            border="border-feedback-warning/30"
            iconColor="text-feedback-warning"
          />
        </div>

        <ProfileViewsBarChart data={chartData} />

        <p className="text-xs text-text-subtle">
          Las visitas se contabilizan por visitante único (hash anónimo de IP + agente de usuario) con una
          ventana de 24 horas para evitar duplicados.
        </p>
      </section>

      {/* ─── Divisor ─────────────────────────────────────────────────────── */}
      <hr className="border-border-subtle" />

      {/* ─── SECCIÓN: Ventas ─────────────────────────────────────────────── */}
      <section aria-labelledby="sales-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-origen-hoja" aria-hidden />
          <h2 id="sales-heading" className="text-sm font-semibold text-origen-oscuro">
            Ventas y pedidos
          </h2>
          <span className="ml-auto text-xs text-text-subtle">Últimos 50 pedidos</span>
        </div>

        {/* Ingresos */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SoftStatCard
            label="Ingresos totales"
            value={formatCurrency(sales.totalRevenue)}
            icon={Euro}
            bg="from-origen-bosque/5 to-transparent"
            border="border-origen-bosque/10"
            iconColor="text-origen-bosque"
          />
          <SoftStatCard
            label="Ingresos hoy"
            value={formatCurrency(sales.todayRevenue)}
            icon={TrendingUp}
            bg="from-origen-hoja/5 to-transparent"
            border="border-origen-hoja/10"
            iconColor="text-origen-hoja"
          />
          <SoftStatCard
            label="Ticket medio"
            value={formatCurrency(sales.averageOrderValue)}
            icon={BarChart3}
            bg="from-origen-pradera/5 to-transparent"
            border="border-origen-pradera/10"
            iconColor="text-origen-pradera"
          />
          <SoftStatCard
            label="Pedidos totales"
            value={sales.total}
            icon={ShoppingBag}
            bg="from-feedback-warning-subtle/20 to-transparent"
            border="border-feedback-warning/30"
            iconColor="text-feedback-warning"
          />
        </div>

        {/* Estado de pedidos */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SoftStatCard
            label="Entregados"
            value={sales.delivered}
            icon={CheckCircle2}
            bg="from-green-50 to-transparent"
            border="border-green-100"
            iconColor="text-green-600"
          />
          <SoftStatCard
            label="En proceso"
            value={sales.processing + sales.shipped}
            icon={Package}
            bg="from-blue-50 to-transparent"
            border="border-blue-100"
            iconColor="text-blue-500"
          />
          <SoftStatCard
            label="Pendientes"
            value={sales.pending}
            icon={Clock3}
            bg="from-amber-50 to-transparent"
            border="border-amber-100"
            iconColor="text-amber-500"
          />
          <SoftStatCard
            label="Cancelados"
            value={sales.cancelled + sales.refunded}
            icon={ShoppingBag}
            bg="from-red-50 to-transparent"
            border="border-red-100"
            iconColor="text-red-400"
          />
        </div>
      </section>
    </div>
  );
}

