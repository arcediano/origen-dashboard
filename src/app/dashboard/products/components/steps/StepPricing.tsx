/**
 * @component StepPricing
 * @description Paso 3: Precio de venta
 *
 * Las ofertas (flash y por cantidad) ya no se crean ni editan desde aquí —
 * se gestionan desde las secciones dedicadas `/dashboard/ofertas-flash` y
 * `/dashboard/ofertas-por-cantidad` (Marketing > Descuentos).
 */

'use client';

import { Badge } from '@arcediano/ux-library';
import { Tooltip } from '@arcediano/ux-library';
import {
  Card,
  CurrencyInput,
} from '@arcediano/ux-library';
import {
  DollarSign,
  Tag,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { NetContentField } from './NetContentField';
import { Boxes } from 'lucide-react';
import { FORM_STEPS, stepPosition } from '@/types/product';

interface StepPricingProps {
  formData?: any;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onInputChange: (field: string, value: any) => void;
  completed?: boolean;
  /** El producto ya tiene variantes guardadas (paso "Variantes") — cada una define su propio formato de venta, así que "Formato de venta" aquí deja de usarse (petición del humano, 2026-10-08). */
  hasVariants?: boolean;
}

export function StepPricing({
  formData = { basePrice: undefined, comparePrice: undefined },
  onInputChange,
  completed,
  hasVariants,
}: StepPricingProps) {
  const [priceTouched, setPriceTouched] = useState(false);
  const basePrice = formData.basePrice || 0;
  const hasBasePrice = basePrice > 0;
  const isStepComplete = hasBasePrice;

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
              isStepComplete ? "bg-origen-bosque text-white" : "bg-origen-pradera/10 text-origen-bosque"
            )}>
              {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Precio de venta</h2>
              <p className="text-sm text-muted-foreground truncate">Configura el precio de venta del producto</p>
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

        {/* Precios base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Precio base */}
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
                "h-12 w-full rounded-xl",
                priceTouched && !hasBasePrice && "border-feedback-danger"
              )}
              placeholder="Ej: 24,50"
              error={priceTouched && !hasBasePrice ? 'El precio de venta es obligatorio (debe ser mayor que 0)' : undefined}
            />
          </div>

          {/* Precio tachado */}
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

        {/* Contenido que se vende: a qué cantidad corresponde el precio —
            solo tiene sentido sin variantes (ver prop `hasVariants`): cada
            variante ya define su propio formato ("200gr", "500gr"...). */}
        {hasVariants ? (
          <div className="flex items-start gap-2 p-3 rounded-xl border border-dashed border-origen-pradera/30 bg-origen-crema/30">
            <Boxes className="h-4 w-4 text-origen-pradera/60 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-text-subtle leading-relaxed">
              Este producto tiene variantes — cada una define su propio formato de venta
              (p. ej. &quot;200g&quot;, &quot;500g&quot;). Este campo ya no se usa; gestiónalo en el paso{' '}
              <span className="font-medium text-origen-bosque">Variantes</span>.
            </p>
          </div>
        ) : (
          <div>
            <NetContentField
              netContent={formData.netContent}
              netContentUnit={formData.netContentUnit}
              onChange={(field, value) => onInputChange(field, value)}
            />
          </div>
        )}

        {/* Descuento calculado vs precio tachado */}
        {formData.comparePrice && formData.comparePrice > basePrice && (
          <div className="mt-6 p-4 bg-origen-pastel/30 rounded-xl border border-origen-pradera/20">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-origen-hoja" />
              <span className="text-sm font-medium text-origen-hoja">
                El cliente ahorra un {Math.round(((formData.comparePrice - basePrice) / formData.comparePrice) * 100)}% respecto al precio tachado
              </span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
