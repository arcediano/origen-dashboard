'use client';

import { Button, Input, Alert, SelectableCard, Label } from '@arcediano/ux-library';
import { CurrencyInput, PercentageInput } from '@arcediano/ux-library';
import { DollarSign, AlertCircle, Percent, Gift, Hash, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { z } from 'zod';
import type { QuantityOffer } from '@/types/product';
import { createQuantityOffer, updateQuantityOffer } from '@/lib/api/products';

interface QuantityOfferFormValue {
  minQuantity: number;
  maxQuantity?: number;
  type: 'PERCENTAGE' | 'FIXED' | 'BUNDLE';
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
}

interface QuantityOfferFormProps {
  productId?: string;
  basePrice: number;
  existingOffer?: QuantityOffer | null;
  hasFlashDeal?: boolean;
  /**
   * `replacedFlashDeal` es `true` cuando el tier se creó reemplazando una
   * oferta flash activa/programada (el backend ya la desactivó) — el
   * llamador debe limpiar cualquier estado local de la oferta flash.
   */
  onSaved: (offer: QuantityOffer, replacedFlashDeal?: boolean) => void;
  onCancel: () => void;
}

const QuantityOfferSchema = z
  .object({
    minQuantity: z.number().min(1, 'La cantidad mínima debe ser al menos 1 unidad'),
    maxQuantity: z.number().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED', 'BUNDLE']),
    value: z.number().optional(),
    buyQuantity: z.number().optional(),
    payQuantity: z.number().optional(),
  })
  .refine((data) => {
    if (data.type === 'PERCENTAGE') return !!data.value && data.value > 0 && data.value <= 100;
    if (data.type === 'FIXED') return !!data.value && data.value > 0;
    if (data.type === 'BUNDLE') return !!data.buyQuantity && !!data.payQuantity && data.buyQuantity > data.payQuantity;
    return true;
  }, 'Valores no válidos');

function getValidationError(data: Partial<QuantityOfferFormValue>, basePrice: number): string {
  if (data.type === 'PERCENTAGE') {
    if (!data.value || data.value <= 0) return 'Introduce un porcentaje de descuento mayor que 0%';
    if (data.value > 100) return 'El descuento no puede superar el 100%';
  }
  if (data.type === 'FIXED') {
    if (!data.value || data.value <= 0) return 'El precio de oferta debe ser mayor que 0€';
    if (basePrice && data.value >= basePrice) return `El precio de oferta debe ser menor que el precio de venta (${basePrice.toFixed(2)}€)`;
  }
  if (data.type === 'BUNDLE') {
    if (!data.buyQuantity || !data.payQuantity) return 'Indica cuántas unidades lleva el cliente y cuántas paga';
    if (data.buyQuantity <= data.payQuantity) return 'Las unidades que se llevan deben ser más que las que pagan (ej: lleva 3, paga 2)';
  }
  return 'Revisa los valores de la oferta';
}

export function QuantityOfferForm({
  productId,
  basePrice,
  existingOffer,
  hasFlashDeal = false,
  onSaved,
  onCancel,
}: QuantityOfferFormProps) {
  const [formData, setFormData] = useState<Partial<QuantityOfferFormValue>>(() => {
    if (existingOffer) {
      return {
        minQuantity: existingOffer.minQuantity,
        maxQuantity: existingOffer.maxQuantity ?? undefined,
        type: existingOffer.type,
        value: existingOffer.value ?? undefined,
        buyQuantity: existingOffer.buyQuantity ?? undefined,
        payQuantity: existingOffer.payQuantity ?? undefined,
      };
    }
    return { minQuantity: 2, type: 'PERCENTAGE', value: 10, buyQuantity: 3, payQuantity: 2 };
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Conflicto 409 EXCLUSIVE_OFFER_CONFLICT (ya hay una oferta flash activa/programada)
  const [hasConflict, setHasConflict] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const buildPayload = () => ({
    minQuantity: formData.minQuantity || 2,
    maxQuantity: formData.maxQuantity,
    type: (formData.type || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED' | 'BUNDLE',
    value: formData.value,
    buyQuantity: formData.buyQuantity,
    payQuantity: formData.payQuantity,
  });

  const handleSubmit = async () => {
    if (!productId) return;
    setError(null);
    setHasConflict(false);

    try {
      QuantityOfferSchema.parse(formData);
      if (formData.type === 'FIXED' && basePrice > 0 && (formData.value || 0) >= basePrice) {
        setError(`El precio de oferta debe ser menor que el precio de venta (${basePrice.toFixed(2)}€)`);
        return;
      }

      setIsLoading(true);

      if (existingOffer) {
        const result = await updateQuantityOffer(productId, existingOffer.id, buildPayload());
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          onSaved(result.data);
        }
      } else {
        const result = await createQuantityOffer(productId, buildPayload());
        if (result.error) {
          if (result.errorCode === 'EXCLUSIVE_OFFER_CONFLICT' && result.conflictingOfferType === 'FLASH') {
            setHasConflict(true);
          } else {
            setError(result.error);
          }
        } else if (result.data) {
          onSaved(result.data);
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(getValidationError(formData, basePrice));
      } else {
        setError('Error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /** Confirma el reemplazo tras el 409: el backend desactiva la Flash y crea el tier en el mismo paso. */
  const handleReplaceOffer = async () => {
    if (!productId) return;
    setIsReplacing(true);
    setError(null);

    const result = await createQuantityOffer(productId, {
      ...buildPayload(),
      replaceActiveFlashDeal: true,
    });

    setIsReplacing(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setHasConflict(false);
      onSaved(result.data, true);
    }
  };

  const offerPrice = (() => {
    if (!basePrice) return undefined;
    if (formData.type === 'PERCENTAGE' && formData.value) return basePrice * (1 - formData.value / 100);
    if (formData.type === 'FIXED' && formData.value) return formData.value;
    if (formData.type === 'BUNDLE' && formData.buyQuantity && formData.payQuantity) {
      return (basePrice * formData.payQuantity) / formData.buyQuantity;
    }
    return undefined;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="space-y-4">
        {/* Selector de tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <SelectableCard
            icon={<Percent className="h-5 w-5" />}
            label="Porcentaje"
            selected={formData.type === 'PERCENTAGE'}
            onSelect={() => setFormData({ ...formData, type: 'PERCENTAGE' })}
          />
          <SelectableCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Precio fijo"
            selected={formData.type === 'FIXED'}
            onSelect={() => setFormData({ ...formData, type: 'FIXED' })}
          />
          <SelectableCard
            icon={<Gift className="h-5 w-5" />}
            label="Pack"
            selected={formData.type === 'BUNDLE'}
            onSelect={() => setFormData({ ...formData, type: 'BUNDLE' })}
          />
        </div>

        {/* Cantidades */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
              <Hash className="h-3 w-3 text-hoja-tinta" /> Cantidad mínima
            </Label>
            <Input
              type="number"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value, 10) || 1 })}
              min={1}
              className="h-11"
              placeholder="2"
            />
          </div>
          <div>
            <Label className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
              <Hash className="h-3 w-3 text-hoja-tinta" /> Cantidad máxima
            </Label>
            <Input
              type="number"
              value={formData.maxQuantity || ''}
              onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value, 10) || undefined })}
              min={1}
              className="h-11"
              placeholder="Sin límite"
            />
          </div>
        </div>

        {/* Campo específico del tipo */}
        {formData.type === 'PERCENTAGE' && (
          <div>
            <Label className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
              <Percent className="h-3 w-3 text-hoja-tinta" /> Porcentaje de descuento
            </Label>
            <PercentageInput
              value={formData.value || 0}
              onChange={(v) => setFormData({ ...formData, value: v })}
              min={0.1}
              max={100}
              className="h-11"
            />
          </div>
        )}
        {formData.type === 'FIXED' && (
          <div>
            <Label className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
              <DollarSign className="h-3 w-3 text-hoja-tinta" /> Precio de oferta (€ por unidad)
            </Label>
            <CurrencyInput
              value={formData.value || 0}
              onChange={(v) => setFormData({ ...formData, value: v })}
              min={0.01}
              className="h-11"
            />
          </div>
        )}
        {formData.type === 'BUNDLE' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
                <Package className="h-3 w-3 text-hoja-tinta" /> El cliente lleva (uds)
              </Label>
              <Input
                type="number"
                value={formData.buyQuantity}
                onChange={(e) => setFormData({ ...formData, buyQuantity: parseInt(e.target.value, 10) || 2 })}
                min={2}
                className="h-11"
              />
            </div>
            <div>
              <Label className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
                <Gift className="h-3 w-3 text-hoja-tinta" /> El cliente paga solo (uds)
              </Label>
              <Input
                type="number"
                value={formData.payQuantity}
                onChange={(e) => setFormData({ ...formData, payQuantity: parseInt(e.target.value, 10) || 1 })}
                min={1}
                className="h-11"
              />
            </div>
          </div>
        )}

        {/* Vista previa */}
        {offerPrice !== undefined && basePrice > 0 && (
          <div className="rounded-lg border border-origen-pradera/20 bg-surface-alt p-3">
            <p className="mb-2 text-xs text-text-subtle">Vista previa:</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Precio normal:</span>
              <span className="font-medium">{basePrice.toFixed(2)} €</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Precio con oferta:</span>
              <span className="font-bold text-origen-hoja">{offerPrice.toFixed(2)} €</span>
            </div>
          </div>
        )}

        {/* Aviso de exclusividad: un producto no puede tener Flash y Volumen activas a la vez */}
        {hasFlashDeal && !hasConflict && (
          <Alert variant="info" className="text-xs">
            <AlertCircle className="mr-1 mt-0.5 h-3 w-3 shrink-0" />
            <p>
              Este producto ya tiene una oferta flash activa o programada. Un producto no puede
              tener a la vez oferta flash y descuentos por cantidad — si creas este tier, la
              oferta flash se desactivará.
            </p>
          </Alert>
        )}

        {/* Conflicto 409: ya hay una Flash activa/programada — ofrecer reemplazo en un solo paso */}
        {hasConflict && (
          <Alert variant="warning" className="text-xs">
            <AlertCircle className="mr-1 mt-0.5 h-3 w-3 shrink-0" />
            <div className="space-y-2">
              <p>
                Este producto ya tiene una oferta flash activa o programada y no puede tener
                también un descuento por cantidad a la vez. Puedes reemplazar la oferta flash
                por este tier en un solo paso.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleReplaceOffer} disabled={isReplacing} variant="primary" size="sm">
                  {isReplacing ? 'Reemplazando...' : 'Reemplazar oferta'}
                </Button>
                <Button onClick={() => setHasConflict(false)} variant="secondary" size="sm" disabled={isReplacing}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="text-xs">
            <AlertCircle className="mr-1 h-3 w-3 shrink-0" />
            {error}
          </Alert>
        )}

        {!hasConflict && (
          <div className="flex gap-2 border-t border-border-subtle pt-3">
            <Button onClick={handleSubmit} disabled={isLoading} variant="primary" className="flex-1" size="sm">
              {isLoading ? 'Guardando...' : existingOffer ? 'Guardar cambios' : 'Crear oferta'}
            </Button>
            <Button onClick={onCancel} variant="secondary" size="sm" disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
