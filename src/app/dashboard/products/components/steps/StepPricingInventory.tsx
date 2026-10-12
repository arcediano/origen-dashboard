/**
 * @component StepPricingInventory
 * @description Paso unificado de precio, variantes e inventario (petición
 * del humano, 2026-10-09: "unificar para no duplicar trabajo... primero el
 * usuario seleccionará si el producto tiene o no variantes, y si tiene, el
 * precio, peso del envío y SKU se crea para cada variante, de lo contrario
 * se hace para el producto único").
 *
 * Antes eran 3 pasos separados (Precios, Variantes, Inventario): el
 * productor rellenaba precio/stock/SKU del producto único ANTES de decidir
 * si en realidad tenía variantes, duplicando trabajo en cuanto las creaba.
 * Aquí el toggle "¿Tiene variantes?" va primero y el resto de la pantalla
 * se adapta: con variantes, precio/stock/peso/SKU se gestionan por
 * combinación (ver VariantsEditor, SKU auto-generado); sin variantes, son
 * los del producto único (SKU también auto-generado por el backend).
 * Dimensiones y tipo de paquete siguen siendo del producto en ambos casos
 * — no se pidió que varíen por combinación.
 */

'use client';

import { useState } from 'react';
import { StepShell } from './StepShell';
import { VariantsEditor } from './VariantsEditor';
import { NetContentField } from './NetContentField';
import {
  Badge, Tooltip, CurrencyInput, Input, Checkbox,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@arcediano/ux-library';
import {
  DollarSign, Tag, CheckCircle, Sparkles, AlertCircle, Percent,
  Package, Truck, TrendingDown, TrendingUp, Boxes, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FORM_STEPS, stepPosition } from '@/types/product';

interface StepPricingInventoryProps {
  formData?: any;
  onInputChange: (field: string, value: any) => void;
  onNestedChange: (section: string, field: string, value: any) => void;
  completed?: boolean;
  skuSuggestion?: string;
  /** ID del producto en modo edición — las variantes requieren que ya exista. */
  productId?: string;
  /** Nº de variantes guardadas tras un alta/baja (ver VariantsEditor) — para que la validación de "paso completo" reaccione sin recargar. */
  onVariantsChange?: (count: number) => void;
}

export function StepPricingInventory({
  formData = { basePrice: undefined, comparePrice: undefined, hasVariants: false },
  onInputChange,
  onNestedChange,
  completed,
  skuSuggestion = '',
  productId,
  onVariantsChange,
}: StepPricingInventoryProps) {
  const [priceTouched, setPriceTouched] = useState(false);

  const hasVariants = !!formData?.hasVariants;
  const basePrice = formData.basePrice || 0;
  const hasBasePrice = basePrice > 0;
  const isStepComplete = completed ?? hasBasePrice;

  const volume = formData?.dimensions?.length && formData?.dimensions?.width && formData?.dimensions?.height
    ? (formData.dimensions.length * formData.dimensions.width * formData.dimensions.height / 1000).toFixed(2)
    : null;

  return (
    <StepShell>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            isStepComplete ? 'bg-origen-bosque text-white' : 'bg-origen-pradera/10 text-origen-bosque',
          )}>
            {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-origen-bosque truncate">Precio, variantes e inventario</h2>
            <p className="text-sm text-muted-foreground truncate">Precio de venta, formatos y control de stock</p>
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
            Paso {stepPosition('pricing')} de {FORM_STEPS.length}
          </Badge>
        </div>
      </div>

      {/* Toggle: ¿tiene variantes? -- lo primero que decide el productor */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-hoja-tinta" aria-hidden="true" />
          ¿Este producto tiene variantes?
          <Tooltip
            content="Formatos, tamaños u otras opciones de venta"
            detailed="Si lo vendes en varios formatos (p. ej. 250g/500g/1kg o S/M/L), cada combinación tendrá su propio precio, stock y peso de envío. El SKU se genera solo en los dos casos."
            size="sm"
          />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="¿Este producto tiene variantes?">
          <button
            type="button"
            role="radio"
            aria-checked={!hasVariants}
            onClick={() => onInputChange('hasVariants', false)}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border text-left transition-all min-h-[44px]',
              !hasVariants
                ? 'border-origen-bosque bg-origen-pastel/30 ring-1 ring-origen-bosque'
                : 'border-border bg-surface-alt hover:border-origen-pradera/40',
            )}
          >
            <Package className={cn('w-5 h-5 shrink-0 mt-0.5', !hasVariants ? 'text-origen-bosque' : 'text-hoja-tinta')} aria-hidden="true" />
            <span>
              <span className="block text-sm font-semibold text-origen-bosque">Producto único</span>
              <span className="block text-xs text-muted-foreground mt-0.5">Un precio, un stock y un peso de envío</span>
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={hasVariants}
            onClick={() => onInputChange('hasVariants', true)}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border text-left transition-all min-h-[44px]',
              hasVariants
                ? 'border-origen-bosque bg-origen-pastel/30 ring-1 ring-origen-bosque'
                : 'border-border bg-surface-alt hover:border-origen-pradera/40',
            )}
          >
            <Boxes className={cn('w-5 h-5 shrink-0 mt-0.5', hasVariants ? 'text-origen-bosque' : 'text-hoja-tinta')} aria-hidden="true" />
            <span>
              <span className="block text-sm font-semibold text-origen-bosque">Con variantes</span>
              <span className="block text-xs text-muted-foreground mt-0.5">Varios formatos o tamaños, cada uno con su precio</span>
            </span>
          </button>
        </div>
      </div>

      {hasVariants ? (
        <div className="mb-8">
          <VariantsEditor productId={productId} basePrice={formData.basePrice} onVariantsChange={onVariantsChange} />
        </div>
      ) : (
        <>
          {/* Precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-hoja-tinta" />
                <span className="text-sm font-medium text-foreground">
                  Precio de venta
                  <span className="text-feedback-danger ml-1">*</span>
                </span>
                <Tooltip
                  content="Precio de venta al público"
                  detailed="Es el precio que verá el cliente. Todos los descuentos por cantidad se calculan sobre este valor."
                  size="sm"
                />
              </div>
              <CurrencyInput
                value={basePrice}
                onChange={(value) => onInputChange('basePrice', value)}
                onBlur={() => setPriceTouched(true)}
                min={0.01}
                inputSize="lg"
                className={cn(
                  'h-12 w-full rounded-xl',
                  priceTouched && !hasBasePrice && 'border-feedback-danger',
                )}
                placeholder="Ej: 24,50"
                error={priceTouched && !hasBasePrice ? 'El precio de venta es obligatorio (debe ser mayor que 0)' : undefined}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-hoja-tinta" />
                <span className="text-sm font-medium text-foreground">
                  Precio tachado
                  <span className="text-xs font-normal text-muted-foreground ml-1">(opcional)</span>
                </span>
                <Tooltip
                  content="PVP sugerido o precio anterior"
                  detailed="Si es mayor que el precio de venta, se mostrará tachado junto al precio actual para destacar el ahorro. Ejemplo: precio habitual en tienda."
                  size="sm"
                />
              </div>
              <CurrencyInput
                value={formData.comparePrice || 0}
                onChange={(value) => onInputChange('comparePrice', value || undefined)}
                min={0}
                inputSize="lg"
                className="h-12 w-full rounded-xl"
                placeholder="Ej: 29,90"
              />
            </div>
          </div>

          <div className="mb-8">
            <NetContentField
              netContent={formData.netContent}
              netContentUnit={formData.netContentUnit}
              onChange={(field, value) => onInputChange(field, value)}
            />
          </div>

          {formData.comparePrice && formData.comparePrice > basePrice && (
            <div className="mb-8 p-4 bg-origen-pastel/30 rounded-xl border border-origen-pradera/20">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-origen-hoja" />
                <span className="text-sm font-medium text-origen-hoja">
                  El cliente ahorra un {Math.round(((formData.comparePrice - basePrice) / formData.comparePrice) * 100)}% respecto al precio tachado
                </span>
              </div>
            </div>
          )}

          {/* SKU — informativo + Código de barras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pt-6 border-t border-border">
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
              onChange={(e) => onInputChange('barcode', e.target.value)}
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
              onChange={(e) => onInputChange('stock', parseInt(e.target.value) || 0)}
              min={0}
              inputSize="lg"
            />
            <Input
              label="Umbral de stock bajo"
              tooltip="Recibirás una notificación cuando el stock esté por debajo de este número. Recomendado: 5-10 unidades."
              type="number"
              value={formData?.lowStockThreshold || 5}
              onChange={(e) => onInputChange('lowStockThreshold', parseInt(e.target.value) || 5)}
              min={0}
              inputSize="lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-surface-alt rounded-xl border border-border hover:border-origen-pradera/30 transition-all">
              <Checkbox
                id="trackInventory"
                checked={formData?.trackInventory}
                onCheckedChange={(checked) => onInputChange('trackInventory', checked)}
                className="mt-1"
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
                onCheckedChange={(checked) => onInputChange('allowBackorders', checked)}
                className="mt-1"
              />
              <div>
                <label htmlFor="allowBackorders" className="text-sm font-medium text-origen-bosque cursor-pointer">
                  Permitir pedidos sin stock
                </label>
                <p className="text-xs text-muted-foreground mt-1">Los clientes pueden comprar aunque no haya stock disponible</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-6 border-t border-border">
            <div>
              <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-hoja-tinta" />
                Punto de reorden
              </p>
              <Input
                type="number"
                value={formData?.reorderPoint || ''}
                onChange={(e) => onInputChange('reorderPoint', parseInt(e.target.value) || undefined)}
                min={0}
                className="h-11 rounded-xl"
                placeholder="Opcional"
              />
              <p className="text-xs text-text-subtle mt-1">Cantidad para sugerir reposición</p>
            </div>

            <div>
              <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-hoja-tinta" />
                Stock máximo
              </p>
              <Input
                type="number"
                value={formData?.maxStock || ''}
                onChange={(e) => onInputChange('maxStock', parseInt(e.target.value) || undefined)}
                min={0}
                className="h-11 rounded-xl"
                placeholder="Opcional"
              />
              <p className="text-xs text-text-subtle mt-1">Límite superior de inventario</p>
            </div>
          </div>
        </>
      )}

      {/* Datos de envío — peso solo con producto único (con variantes, cada
          una define el suyo, ver VariantsEditor); dimensiones y tipo de
          paquete son siempre del producto. */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-origen-bosque mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-hoja-tinta" />
          Datos de envío
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {!hasVariants && (
            <div>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    label="Peso del producto"
                    tooltip="El peso es necesario para calcular los costes de envío. Incluye el peso del producto más el embalaje."
                    type="number"
                    value={formData?.weight || ''}
                    onChange={(e) => onInputChange('weight', parseFloat(e.target.value) || undefined)}
                    step="0.1"
                    min={0}
                    inputSize="lg"
                    placeholder="0.5"
                  />
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <span className="text-xs font-medium text-foreground">Unidad</span>
                  {/* Ancho en `Select`, no en `SelectTrigger` -- su raíz real
                      ignora el className de SelectTrigger y por defecto es
                      w-full, forzándose a ocupar toda la fila (mismo hallazgo
                      que el filtro de categorías del catálogo de
                      certificaciones, 2026-10-09). */}
                  <Select
                    value={formData?.weightUnit || 'kg'}
                    onValueChange={(v) => onInputChange('weightUnit', v)}
                    className="w-28 shrink-0"
                  >
                    <SelectTrigger className="h-12 w-full rounded-xl">
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
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">Tipo de paquete</span>
            <Select
              value={formData?.shippingClass || ''}
              onValueChange={(v) => onInputChange('shippingClass', v)}
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

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-origen-bosque">Dimensiones del paquete <span className="text-text-subtle font-normal">(cm)</span></p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Largo"
              type="number"
              value={formData?.dimensions?.length || ''}
              onChange={(e) => onNestedChange('dimensions', 'length', parseFloat(e.target.value) || undefined)}
              step="0.1"
              min={0}
            />
            <Input
              label="Ancho"
              type="number"
              value={formData?.dimensions?.width || ''}
              onChange={(e) => onNestedChange('dimensions', 'width', parseFloat(e.target.value) || undefined)}
              step="0.1"
              min={0}
            />
            <Input
              label="Alto"
              type="number"
              value={formData?.dimensions?.height || ''}
              onChange={(e) => onNestedChange('dimensions', 'height', parseFloat(e.target.value) || undefined)}
              step="0.1"
              min={0}
            />
          </div>
        </div>

        {volume && (
          <div className="mt-3 p-3 bg-origen-crema/30 rounded-lg border border-origen-pradera/20">
            <p className="text-sm text-muted-foreground">
              Volumen estimado: <span className="font-bold text-origen-bosque">{volume} litros</span>
            </p>
          </div>
        )}
      </div>
    </StepShell>
  );
}
