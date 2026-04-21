/**
 * @component StepInventory
 * @description Paso 6: Inventario y gestión de stock - VERSIÓN ACTUALIZADA (SIN GENERAR SKU)
 */

'use client';

import { Card } from '@arcediano/ux-library';
import { Input } from '@arcediano/ux-library';
import { Badge } from '@arcediano/ux-library';
import { Checkbox } from '@arcediano/ux-library';
import { Progress } from '@arcediano/ux-library';
import { Tooltip } from '@arcediano/ux-library';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@arcediano/ux-library';
import {
  Package,
  CheckCircle,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Truck,
  TrendingDown,
  TrendingUp,
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
  sku: z.string().max(30, 'Máximo 30 caracteres').optional(),
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
          status === 'warning' ? "bg-amber-500" : "bg-feedback-danger"
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

  // El SKU lo asigna el backend; el paso depende del estado del inventario editable.
  const isStepComplete = (formData?.stock ?? 0) >= 0 && (formData?.lowStockThreshold ?? 0) >= 0;

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
      <Card variant="elevated" className="p-4 sm:p-6">
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

        {/* SKU — informativo + Código de barras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              SKU
              <Tooltip content="El SKU (Stock Keeping Unit) es el código único de inventario. Se genera automáticamente al guardar el producto." />
            </p>
            <div className="flex items-center gap-2 h-12 px-4 rounded-xl border border-dashed border-origen-pradera/30 bg-origen-crema/40">
              <Sparkles className="w-4 h-4 text-origen-pradera/60 shrink-0" />
              <span className="text-sm text-muted-foreground">
                {formData?.sku
                  ? <span className="font-mono font-semibold text-origen-bosque">{formData.sku}</span>
                  : 'Se asignará al guardar el producto'}
              </span>
            </div>
            {skuSuggestion && !formData?.sku && (
              <p className="text-xs text-text-subtle flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-origen-pradera/60" />
                Referencia estimada: <span className="font-mono">{skuSuggestion}</span>
              </p>
            )}
          </div>

          <Input
            label="Código de barras"
            tooltip="Código de barras estándar para productos. Formato EAN-13 (13 dígitos) o UPC (12 dígitos)."
            helperText="Opcional — EAN-13 o UPC"
            value={formData?.barcode || ''}
            onChange={(e) => handleChange('barcode', e.target.value)}
            inputSize="lg"
            className="font-mono"
            placeholder="841234567890"
          />
        </div>

        {/* Stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Input
            label="Stock actual"
            required
            tooltip="Número de unidades disponibles para la venta. Se actualizará automáticamente con los pedidos."
            type="number"
            value={formData?.stock || 0}
            onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
            min={0}
            inputSize="lg"
          />

          <Input
            label="Umbral de stock bajo"
            tooltip="Recibirás una notificación cuando el stock esté por debajo de este número. Recomendado: 5-10 unidades."
            type="number"
            value={formData?.lowStockThreshold || 5}
            onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 5)}
            min={0}
            inputSize="lg"
          />
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
            <div>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    label="Peso del producto"
                    tooltip="El peso es necesario para calcular los costes de envío. Incluye el peso del producto más el embalaje."
                    type="number"
                    value={formData?.weight || ''}
                    onChange={(e) => handleChange('weight', parseFloat(e.target.value) || undefined)}
                    step="0.1"
                    min={0}
                    inputSize="lg"
                    placeholder="0.5"
                  />
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <span className="text-xs font-medium text-foreground">Unidad</span>
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
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Tipo de paquete</span>
              <Select
                value={formData?.shippingClass || ''}
                onValueChange={(v) => handleChange('shippingClass', v)}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Estándar</SelectItem>
                  <SelectItem value="express">Express / urgente</SelectItem>
                  <SelectItem value="fragile">Frágil</SelectItem>
                  <SelectItem value="perishable">Perecedero / frío</SelectItem>
                  <SelectItem value="bulky">Voluminoso</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-text-subtle">Indica cómo debe tratarse el paquete durante el envío</p>
            </div>
          </div>

          {/* Dimensiones */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-origen-bosque">Dimensiones del paquete <span className="text-text-subtle font-normal">(cm)</span></p>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Largo"
                type="number"
                value={formData?.dimensions?.length || ''}
                onChange={(e) => handleNestedChange('dimensions', 'length', parseFloat(e.target.value) || undefined)}
                step="0.1"
                min={0}
              />
              <Input
                label="Ancho"
                type="number"
                value={formData?.dimensions?.width || ''}
                onChange={(e) => handleNestedChange('dimensions', 'width', parseFloat(e.target.value) || undefined)}
                step="0.1"
                min={0}
              />
              <Input
                label="Alto"
                type="number"
                value={formData?.dimensions?.height || ''}
                onChange={(e) => handleNestedChange('dimensions', 'height', parseFloat(e.target.value) || undefined)}
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

