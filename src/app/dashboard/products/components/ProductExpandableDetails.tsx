/**
 * @file ProductExpandableDetails.tsx
 * @description Informe de rendimiento del producto - DISEÑO DESTACADO SIN CARDS ANIDADAS
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Eye,
  Star,
  Calendar,
  Package,
  Sparkles
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { type Product } from '@/types/product';
import { OrganicScoreBadge } from '@/components/shared/products/OrganicScoreBadge';
import { fetchProductViewChartById, fetchProductViewCount, type ProductViewChartPoint } from '@/lib/api/products';

// ============================================================================
// TIPOS
// ============================================================================

export interface ProductExpandableDetailsProps {
  /** Producto a mostrar */
  product: Product;
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ProductExpandableDetails({ product, className }: ProductExpandableDetailsProps) {
  // Calcular métricas
  const discount = product.comparePrice && product.comparePrice > product.basePrice
    ? ((product.comparePrice - product.basePrice) / product.comparePrice * 100).toFixed(0)
    : null;

  // Visitas últimos 7 días desde product_view_events (cargado async)
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    fetchProductViewCount(product.id, '7d').then((res) => {
      if (!res.error && res.data) setViewCount(res.data.count);
    });
  }, [product.id]);

  const conversionRate = viewCount !== null && viewCount > 0 && product.sales && product.sales > 0
    ? ((product.sales / viewCount) * 100).toFixed(1)
    : null;

  const revenuePerSale = product.revenue && product.revenue > 0 && product.sales && product.sales > 0
    ? (product.revenue / product.sales).toFixed(2)
    : null;

  // Gráfica de visitas por producto
  const [viewChartData, setViewChartData] = useState<ProductViewChartPoint[]>([]);
  const [viewChartPeriod, setViewChartPeriod] = useState<'7d' | '6m' | '1y'>('7d');
  const [viewChartLoading, setViewChartLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setViewChartLoading(true);
    fetchProductViewChartById(product.id, viewChartPeriod).then((res) => {
      if (!active) return;
      setViewChartData(!res.error && res.data && res.data.length > 0 ? res.data : []);
      setViewChartLoading(false);
    });
    return () => { active = false; };
  }, [product.id, viewChartPeriod]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Cabecera del informe con borde decorativo */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-origen-pradera/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-origen-pradera" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-origen-bosque">Informe de rendimiento</h4>
            <p className="text-xs text-muted-foreground">Análisis detallado del producto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-origen-pradera/10 text-origen-pradera px-3 py-1.5 rounded-full border border-origen-pradera/30">
            {product.sku}
          </span>
          {product.organicScore !== undefined && (
            <OrganicScoreBadge score={product.organicScore} showLabel />
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Últimos 7 días
          </span>
        </div>
      </div>

      {/* Grid de métricas clave */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Ventas */}
        <div className="p-4 bg-gradient-to-br from-origen-pradera/5 to-transparent rounded-xl border border-origen-pradera/10">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-origen-pradera" />
            <span className="text-xs font-medium text-muted-foreground">Ventas</span>
          </div>
          <p className="text-2xl font-bold text-origen-bosque">{product.sales || 0}</p>
          <p className="mt-2 text-xs text-muted-foreground">Ventas confirmadas acumuladas</p>
        </div>

        {/* Ingresos */}
        <div className="p-4 bg-gradient-to-br from-origen-crema/40 to-transparent rounded-xl border border-origen-pradera/10">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-origen-pradera" />
            <span className="text-xs font-medium text-muted-foreground">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-origen-bosque">{product.revenue?.toFixed(2) || 0}€</p>
          <p className="mt-2 text-xs text-muted-foreground">Ingresos acumulados registrados</p>
        </div>

        {/* Vistas */}
        <div className="p-4 bg-gradient-to-br from-origen-crema/20 to-transparent rounded-xl border border-border-subtle">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-origen-bosque" />
            <span className="text-xs font-medium text-muted-foreground">Vistas (7 días)</span>
          </div>
          <p className="text-2xl font-bold text-origen-bosque">
            {viewCount === null ? '—' : viewCount}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Visitantes únicos últimos 7 días</p>
        </div>

        {/* Conversión */}
        <div className="p-4 bg-gradient-to-br from-origen-hoja/5 to-transparent rounded-xl border border-origen-hoja/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-origen-hoja" />
            <span className="text-xs font-medium text-muted-foreground">Conversión</span>
          </div>
          <p className="text-2xl font-bold text-origen-bosque">{conversionRate || 0}%</p>
          <p className="mt-2 text-xs text-muted-foreground">Calculada sobre ventas y vistas reales</p>
        </div>
      </div>

      {/* Gráfica de visitas por producto */}
      <div className="p-5 bg-origen-crema/30 rounded-xl border border-origen-pradera/20">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h5 className="text-sm font-medium text-origen-bosque flex items-center gap-2">
            <Eye className="w-4 h-4 text-origen-pradera" />
            Visitas a este producto
          </h5>
          <div className="inline-flex rounded-lg border border-border-subtle bg-surface p-0.5">
            {(['7d', '6m', '1y'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setViewChartPeriod(p)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewChartPeriod === p
                    ? 'bg-origen-bosque text-white'
                    : 'text-text-subtle hover:text-origen-bosque'
                }`}
                aria-pressed={viewChartPeriod === p}
              >
                {p === '7d' ? '7D' : p === '6m' ? '6M' : '1A'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-40 w-full">
          {viewChartLoading ? (
            <div className="h-full flex flex-col justify-end px-1 pb-1 animate-pulse">
              <div className="flex items-end gap-1.5 h-full">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-border-subtle"
                    style={{ height: `${20 + ((i * 13) % 60)}%` }}
                  />
                ))}
              </div>
            </div>
          ) : viewChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-subtle">
              <span className="text-sm">Sin visitas registradas en este período</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={viewChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--text-subtle))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--text-subtle))', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="currentPeriod" name="Periodo actual" fill="hsl(var(--hoja))" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="previousPeriod"
                  name="Periodo anterior"
                  stroke="hsl(var(--pino))"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Último pedido</p>
            <p className="mt-2 text-sm font-semibold text-origen-bosque">
              {product.lastOrderDate ? new Date(product.lastOrderDate).toLocaleDateString() : 'Sin pedidos todavía'}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ingreso medio por venta</p>
            <p className="mt-2 text-sm font-semibold text-origen-bosque">{revenuePerSale ? `${revenuePerSale}€` : 'Sin datos suficientes'}</p>
          </div>
        </div>
      </div>

      {/* Dos columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Información financiera */}
        <div className="p-5 bg-origen-crema/20 rounded-xl border border-origen-pradera/20">
          <h5 className="text-sm font-medium text-origen-bosque mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-origen-pradera" />
            Detalles financieros
          </h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Precio base</span>
              <span className="text-base font-semibold text-origen-pradera">{product.basePrice.toFixed(2)}€</span>
            </div>
            {product.comparePrice && product.comparePrice > product.basePrice && (
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">PVP referencia</span>
                <span className="text-base font-medium text-text-subtle line-through">{product.comparePrice.toFixed(2)}€</span>
              </div>
            )}
            {discount && (
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Dto. sobre PVP</span>
                <span className="text-base font-semibold text-origen-hoja">-{discount}%</span>
              </div>
            )}
            {revenuePerSale && (
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Ingreso medio/venta</span>
                <span className="text-base font-semibold text-origen-bosque">{revenuePerSale}€</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total ingresos</span>
              <span className="text-base font-bold text-origen-bosque">{product.revenue?.toFixed(2) || 0}€</span>
            </div>
          </div>
        </div>

        {/* Información de producto */}
        <div className="p-5 bg-origen-crema/20 rounded-xl border border-origen-pradera/20">
          <h5 className="text-sm font-medium text-origen-bosque mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-origen-pradera" />
            Detalles del producto
          </h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Categoría</span>
              <span className="text-base font-medium text-origen-bosque">{product.categoryName}</span>
            </div>
            {product.subcategoryId && (
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Subcategoría</span>
                <span className="text-base font-medium text-muted-foreground capitalize">{product.subcategoryName || product.subcategoryId}</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Stock actual</span>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  product.stock === 0 ? 'bg-feedback-danger' :
                  product.lowStockThreshold && product.stock <= product.lowStockThreshold ? 'bg-amber-500' : 'bg-feedback-success'
                )} />
                <span className="text-base font-semibold text-origen-bosque">{product.stock} uds</span>
              </div>
            </div>
            {product.lowStockThreshold && (
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Umbral bajo</span>
                <span className="text-base font-medium text-muted-foreground">{product.lowStockThreshold} uds</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valoración</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-base font-semibold text-origen-bosque">{product.rating?.toFixed(1) || 0}</span>
                {product.reviewCount && (
                  <span className="text-xs text-text-subtle ml-1">({product.reviewCount})</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges de atributos */}
      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {product.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-origen-pradera/10 text-origen-pradera rounded-full border border-origen-pradera/30">
              <Sparkles className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Fecha de última actualización */}
      <div className="text-xs text-text-subtle text-right pt-2">
        Actualizado: {new Date(product.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
}