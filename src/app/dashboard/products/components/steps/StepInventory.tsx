/**
 * @component StepInventory
 * @description Paso 6: Inventario y gestión de stock - VERSIÓN ACTUALIZADA (SIN GENERAR SKU)
 */

'use client';

import { Card } from '@/components/ui/atoms/card';
import { Input } from '@/components/ui/atoms/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/atoms/select';
import { Badge } from '@/components/ui/atoms/badge';
import { Checkbox } from '@/components/ui/atoms/checkbox';
import { Progress } from '@/components/ui/atoms/progress';
import { Tooltip } from '@/components/ui/atoms/tooltip';
import { 
  Package, 
  CheckCircle, 
  Sparkles,
  AlertCircle,
  Barcode,
  Ruler,
  Weight,
  Truck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

// ============================================================================
// TIPOS
// ============================================================================

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
}

export interface InventoryData {
  sku: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders: boolean;
  weight?: number;
  weightUnit?: 'kg' | 'g';
  dimensions?: Dimensions;
  shippingClass?: string;
  reorderPoint?: number;
  maxStock?: number;
}

interface StepInventoryProps {
  formData?: any;
  onInputChange: (field: string, value: any) => void;
  onNestedChange: (section: string, field: string, value: any) => void;
  completed?: boolean;
  skuSuggestion?: string; // ← NUEVO: para mostrar sugerencia
}

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const InventorySchema = z.object({
  sku: z.string().min(3, 'Mínimo 3 caracteres').max(30, 'Máximo 30 caracteres'),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  lowStockThreshold: z.number().min(0, 'El umbral debe ser positivo'),
});

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const StockLevelIndicator = ({ current, threshold, max }: { current: number; threshold: number; max?: number }) => {
  const percentage = max ? Math.min((current / max) * 100, 100) : Math.min((current / (threshold * 3)) * 100, 100);
  
  let status: 'success' | 'warning' | 'danger' = 'success';
  if (current === 0) status = 'danger';
  else if (current <= threshold) status = 'warning';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Stock actual</span>
        <span className={cn(
          "font-semibold",
          status === 'success' && "text-green-600",
          status === 'warning' && "text-amber-600",
          status === 'danger' && "text-red-600"
        )}>
          {current} unidades
        </span>
      </div>
      <Progress 
        value={percentage} 
        max={100} 
        className={cn(
          "h-2 rounded-full",
          status === 'success' ? "bg-green-500" : 
          status === 'warning' ? "bg-amber-500" : "bg-red-500"
        )} 
      />
      {current <= threshold && current > 0 && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          Stock bajo (umbral: {threshold} unidades)
        </p>
      )}
      {current === 0 && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Agotado
        </p>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function StepInventory({ 
  formData = { 
    sku: '', 
    barcode: '', 
    stock: 0, 
    lowStockThreshold: 5, 
    trackInventory: true,
    allowBackorders: false,
    weightUnit: 'kg',
    shippingClass: '',
  },
  onInputChange,
  onNestedChange,
  completed,
  skuSuggestion = '', // ← NUEVO: valor por defecto
}: StepInventoryProps) {
  
  const [localTouched, setLocalTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validar si el paso está completo
  const isStepComplete = formData?.sku && formData.sku.trim() !== '';

  const validateField = useCallback((field: string, value: any) => {
    try {
      const fieldSchema = InventorySchema.shape[field as keyof typeof InventorySchema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setValidationErrors(prev => ({ ...prev, [field]: '' }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(prev => ({ ...prev, [field]: error.errors[0]?.message || '' }));
      }
    }
  }, []);

  const handleChange = (field: string, value: any) => {
    onInputChange(field, value);
    validateField(field, value);
    setLocalTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    onNestedChange(section, field, value);
  };

  const availableStock = formData?.stock || 0;
  const isLowStock = availableStock <= (formData?.lowStockThreshold || 0) && availableStock > 0;

  // Calcular volumen si hay dimensiones
  const volume = formData?.dimensions?.length && formData?.dimensions?.width && formData?.dimensions?.height
    ? (formData.dimensions.length * formData.dimensions.width * formData.dimensions.height / 1000).toFixed(2)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" hoverEffect="organic" className="p-4 sm:p-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isStepComplete ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white" : "bg-origen-pradera/10 text-origen-hoja"
            )}>
              {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Inventario</h2>
              <p className="text-sm text-muted-foreground truncate">Controla el stock y la logística</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {isStepComplete ? (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completado
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Pendiente
              </Badge>
            )}
            <Badge variant="leaf" size="sm" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Paso 6 de 8
            </Badge>
          </div>
        </div>

        {/* SKU y Código de barras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* SKU */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                SKU
                <span className="text-red-500 ml-1">*</span>
              </span>
              <Tooltip 
                content="Código único para identificar el producto"
                detailed="El SKU (Stock Keeping Unit) es un código único para tu inventario interno. El backend lo generará automáticamente."
                size="sm"
              />
            </div>
            <div className="relative">
              <Input
                value={formData?.sku || ''}
                onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                className={cn(
                  "h-12 font-mono text-base w-full rounded-xl",
                  (localTouched.sku && validationErrors.sku) && "border-red-500"
                )}
                placeholder={skuSuggestion || "El backend generará el SKU"}
                style={{ textTransform: 'uppercase' }}
                disabled // ← OPCIONAL: deshabilitar si quieres que sea solo lectura
              />
              {skuSuggestion && !formData?.sku && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-subtle">
                  Sugerencia: {skuSuggestion}
                </div>
              )}
              {formData?.sku && !validationErrors.sku && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>
            {localTouched.sku && validationErrors.sku && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.sku}</p>
            )}
          </div>

          {/* Código de barras */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Código de barras
              </span>
              <Tooltip 
                content="EAN-13 o UPC (opcional)"
                detailed="Código de barras estándar para productos. Formato EAN-13 (13 dígitos) o UPC (12 dígitos)."
                size="sm"
              />
            </div>
            <Input
              value={formData?.barcode || ''}
              onChange={(e) => handleChange('barcode', e.target.value)}
              className="h-12 font-mono text-base rounded-xl"
              placeholder="841234567890"
            />
          </div>
        </div>

        {/* Stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Stock actual */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Stock actual
                <span className="text-red-500 ml-1">*</span>
              </span>
              <Tooltip 
                content="Cantidad disponible"
                detailed="Número de unidades disponibles para la venta. Se actualizará automáticamente con los pedidos."
                size="sm"
              />
            </div>
            <Input
              type="number"
              value={formData?.stock || 0}
              onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
              min={0}
              className="h-12 rounded-xl"
            />
          </div>

          {/* Umbral de stock bajo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Umbral de stock bajo
              </span>
              <Tooltip 
                content="Alerta cuando el stock esté por debajo"
                detailed="Recibirás una notificación cuando el stock esté por debajo de este número. Recomendado: 5-10 unidades."
                size="sm"
              />
            </div>
            <Input
              type="number"
              value={formData?.lowStockThreshold || 5}
              onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 5)}
              min={0}
              className="h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Indicador de nivel de stock */}
        <div className="mb-8 p-4 bg-origen-crema/30 rounded-xl border border-origen-pradera/20">
          <StockLevelIndicator 
            current={formData?.stock || 0}
            threshold={formData?.lowStockThreshold || 5}
            max={formData?.maxStock}
          />
        </div>

        {/* Opciones de inventario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="flex items-start gap-3 p-4 bg-surface-alt rounded-xl border border-border hover:border-origen-pradera/30 transition-all">
            <Checkbox
              id="trackInventory"
              checked={formData?.trackInventory}
              onCheckedChange={(checked) => handleChange('trackInventory', checked)}
              className="data-[state=checked]:bg-origen-pradera mt-1"
            />
            <div>
              <label htmlFor="trackInventory" className="text-sm font-medium text-origen-bosque cursor-pointer">
                Controlar inventario automáticamente
              </label>
              <p className="text-xs text-muted-foreground mt-1">Descuenta stock automáticamente cuando se realizan ventas</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-surface-alt rounded-xl border border-border hover:border-origen-pradera/30 transition-all">
            <Checkbox
              id="allowBackorders"
              checked={formData?.allowBackorders}
              onCheckedChange={(checked) => handleChange('allowBackorders', checked)}
              className="data-[state=checked]:bg-origen-pradera mt-1"
            />
            <div>
              <label htmlFor="allowBackorders" className="text-sm font-medium text-origen-bosque cursor-pointer">
                Permitir pedidos sin stock
              </label>
              <p className="text-xs text-muted-foreground mt-1">Los clientes pueden comprar aunque no haya stock disponible</p>
            </div>
          </div>
        </div>

        {/* Datos de envío */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-origen-bosque mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-origen-pradera" />
            Datos de envío
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Peso */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Weight className="h-5 w-5 text-origen-pradera" />
                <span className="text-sm font-medium text-foreground">
                  Peso
                </span>
                <Tooltip 
                  content="Peso del producto para envío"
                  detailed="El peso es necesario para calcular los costes de envío. Incluye el peso del producto más el embalaje."
                  size="sm"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData?.weight || ''}
                  onChange={(e) => handleChange('weight', parseFloat(e.target.value) || undefined)}
                  step="0.1"
                  min={0}
                  className="h-12 flex-1 rounded-xl"
                  placeholder="0.5"
                />
                <Select
                  value={formData?.weightUnit || 'kg'}
                  onValueChange={(v) => handleChange('weightUnit', v)}
                >
                  <SelectTrigger className="h-12 w-20 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clase de envío */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-origen-pradera" />
                <span className="text-sm font-medium text-foreground">
                  Clase de envío
                </span>
                <Tooltip 
                  content="Categoría para tarifas"
                  detailed="La clase de envío determina la tarifa aplicable según el tipo de producto (estándar, frágil, perecedero, etc.)"
                  size="sm"
                />
              </div>
              <Select
                value={formData?.shippingClass || ''}
                onValueChange={(v) => handleChange('shippingClass', v)}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Seleccionar clase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Estándar</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="fragile">Frágil</SelectItem>
                  <SelectItem value="perishable">Perecedero</SelectItem>
                  <SelectItem value="bulky">Voluminoso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dimensiones */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Dimensiones (cm)
              </span>
              <Tooltip 
                content="Largo, ancho y alto del paquete"
                detailed="Dimensiones del paquete para calcular el volumen y costes de envío. Medir el producto embalado."
                size="sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                value={formData?.dimensions?.length || ''}
                onChange={(e) => handleNestedChange('dimensions', 'length', parseFloat(e.target.value) || undefined)}
                className="h-12 rounded-xl"
                placeholder="Largo"
                step="0.1"
                min={0}
              />
              <Input
                type="number"
                value={formData?.dimensions?.width || ''}
                onChange={(e) => handleNestedChange('dimensions', 'width', parseFloat(e.target.value) || undefined)}
                className="h-12 rounded-xl"
                placeholder="Ancho"
                step="0.1"
                min={0}
              />
              <Input
                type="number"
                value={formData?.dimensions?.height || ''}
                onChange={(e) => handleNestedChange('dimensions', 'height', parseFloat(e.target.value) || undefined)}
                className="h-12 rounded-xl"
                placeholder="Alto"
                step="0.1"
                min={0}
              />
            </div>
          </div>

          {/* Volumen calculado */}
          {volume && (
            <div className="mt-3 p-3 bg-origen-crema/30 rounded-lg border border-origen-pradera/20">
              <p className="text-sm text-muted-foreground">
                Volumen estimado: <span className="font-bold text-origen-bosque">{volume} litros</span>
              </p>
            </div>
          )}
        </div>

        {/* Punto de reorden y stock máximo (opcional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border">
          <div>
            <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-origen-pradera" />
              Punto de reorden
            </p>
            <Input
              type="number"
              value={formData?.reorderPoint || ''}
              onChange={(e) => handleChange('reorderPoint', parseInt(e.target.value) || undefined)}
              min={0}
              className="h-11 rounded-xl"
              placeholder="Opcional"
            />
            <p className="text-xs text-text-subtle mt-1">Cantidad para sugerir reposición</p>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-origen-pradera" />
              Stock máximo
            </p>
            <Input
              type="number"
              value={formData?.maxStock || ''}
              onChange={(e) => handleChange('maxStock', parseInt(e.target.value) || undefined)}
              min={0}
              className="h-11 rounded-xl"
              placeholder="Opcional"
            />
            <p className="text-xs text-text-subtle mt-1">Límite superior de inventario</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}