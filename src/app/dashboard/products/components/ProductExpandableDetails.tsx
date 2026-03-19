/**
 * @file ProductExpandableDetails.tsx
 * @description Informe de rendimiento del producto - DISEÑO DESTACADO SIN CARDS ANIDADAS
 */

'use client';

import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Eye, 
  Star,
  Calendar,
  Package,
  Clock,
  TrendingDown,
  Award,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Product } from '@/types/product';

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
// COMPONENTE DE GRÁFICA CON DATOS DE EJEMPLO
// ============================================================================

interface SalesChartProps {
  /** Datos de ventas de los últimos 7 días */
  data?: number[];
  /** Días de la semana */
  labels?: string[];
}

function SalesChart({ 
  data = [18, 24, 15, 30, 22, 28, 35],
  labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] 
}: SalesChartProps) {
  const max = Math.max(...data);
  
  return (
    <div className="space-y-2">
      <div className="h-24 flex items-end gap-2">
        {data.map((value, i) => {
          const height = (value / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full">
                {/* Tooltip con valor al hacer hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-origen-oscuro text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {value} ventas
                </div>
                {/* Barra */}
                <div 
                  className="w-full bg-gradient-to-t from-origen-pradera to-origen-menta rounded-t-sm hover:from-origen-pradera/80 hover:to-origen-menta/80 transition-all cursor-pointer"
                  style={{ height: `${height}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        {labels.map((label, i) => (
          <span key={i} className="flex-1 text-center">{label}</span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ProductExpandableDetails({ product, className }: ProductExpandableDetailsProps) {
  // Calcular métricas
  const discount = product.comparePrice && product.comparePrice > product.basePrice
    ? ((product.comparePrice - product.basePrice) / product.comparePrice * 100).toFixed(0)
    : null;

  const conversionRate = product.views && product.views > 0 && product.sales && product.sales > 0
    ? ((product.sales / product.views) * 100).toFixed(1)
    : null;

  const revenuePerSale = product.revenue && product.revenue > 0 && product.sales && product.sales > 0
    ? (product.revenue / product.sales).toFixed(2)
    : null;

  // Datos de ejemplo específicos para cada producto (simulados)
  const getSalesData = () => {
    // Generar datos diferentes según el ID del producto para que no sean todos iguales
    const seed = parseInt(product.id) || 1;
    return [
      12 + (seed % 10),
      18 + (seed % 8),
      15 + (seed % 12),
      22 + (seed % 5),
      19 + (seed % 7),
      25 + (seed % 15),
      30 + (seed % 10)
    ];
  };

  const getTrend = () => {
    const total = getSalesData().reduce((a, b) => a + b, 0);
    const avg = total / 7;
    return avg > 20 ? '+23%' : avg > 15 ? '+15%' : '+8%';
  };

  const salesData = getSalesData();
  const trend = getTrend();

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
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+12% vs semana ant.</span>
          </div>
        </div>

        {/* Ingresos */}
        <div className="p-4 bg-gradient-to-br from-blue-50/50 to-transparent rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-origen-bosque">{product.revenue?.toFixed(2) || 0}€</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+8% vs semana ant.</span>
          </div>
        </div>

        {/* Vistas */}
        <div className="p-4 bg-gradient-to-br from-purple-50/50 to-transparent rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground">Vistas</span>
          </div>
          <p className="text-2xl font-bold text-origen-bosque">{product.views || 0}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
            <TrendingDown className="w-3 h-3" />
            <span>-3% vs semana ant.</span>
          </div>
        </div>

        {/* Conversión */}
        <div className="p-4 bg-gradient-to-br from-green-50/50 to-transparent rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-xs font-medium text-muted-foreground">Conversión</span>
          </div>
          <p className="text-2xl font-bold text-origen-bosque">{conversionRate || 0}%</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+0.5% vs semana ant.</span>
          </div>
        </div>
      </div>

      {/* Gráfica de ventas con datos de ejemplo */}
      <div className="p-5 bg-origen-crema/30 rounded-xl border border-origen-pradera/20">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-sm font-medium text-origen-bosque flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-origen-pradera" />
            Tendencia de ventas (últimos 7 días)
          </h5>
          <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
            {trend} vs semana anterior
          </span>
        </div>
        <SalesChart data={salesData} />
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-origen-pradera rounded-sm"></span>
            <span>Ventas diarias</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium">Total semana: {salesData.reduce((a, b) => a + b, 0)} uds</span>
            <span className="font-medium">Media diaria: {Math.round(salesData.reduce((a, b) => a + b, 0) / 7)} uds</span>
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
                <span className="text-base font-semibold text-green-600">-{discount}%</span>
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
                <span className="text-base font-medium text-muted-foreground capitalize">{product.subcategoryId}</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Stock actual</span>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  product.stock === 0 ? 'bg-red-500' :
                  product.lowStockThreshold && product.stock <= product.lowStockThreshold ? 'bg-amber-500' : 'bg-green-500'
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