'use client';

import { Button, Input, Alert, SelectableCard, Label } from '@arcediano/ux-library';
import { CurrencyInput, PercentageInput } from '@arcediano/ux-library';
import {
  DollarSign,
  AlertCircle,
  Percent,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { z } from 'zod';
import type { FlashDeal, FlashDealFormValue } from '@/types/product';
import { createFlashDeal, updateFlashDeal } from '@/lib/api/products';

interface FlashDealFormProps {
  productId?: string;
  basePrice: number;
  existingDeal?: FlashDeal | null;
  hasTiers?: boolean;
  onSaved: (deal: FlashDeal) => void;
  onCancel: () => void;
}

const FlashDealSchema = z.object({
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().min(0.01),
  startsAt: z.string(),
  endsAt: z.string(),
}).refine((data) => {
  const now = new Date();
  const endsAt = new Date(data.endsAt);
  const startsAt = new Date(data.startsAt);
  return endsAt > startsAt && endsAt > now;
}, 'Las fechas deben ser válidas');

export function FlashDealForm({
  productId,
  basePrice,
  existingDeal,
  hasTiers = false,
  onSaved,
  onCancel,
}: FlashDealFormProps) {
  const [formData, setFormData] = useState<Partial<FlashDealFormValue>>(() => {
    if (existingDeal) {
      return {
        discountType: existingDeal.discountType,
        discountValue: existingDeal.discountValue,
        startsAt: new Date(existingDeal.startsAt).toISOString().slice(0, 16),
        endsAt: new Date(existingDeal.endsAt).toISOString().slice(0, 16),
      };
    }
    return {
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startsAt: new Date().toISOString().slice(0, 16),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    };
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    try {
      FlashDealSchema.parse(formData);

      if (!productId) {
        // Modo formulario en wizard (sin guardar en BD)
        const flashDealData: FlashDealFormValue = {
          discountType: formData.discountType as 'PERCENTAGE' | 'FIXED',
          discountValue: formData.discountValue || 0,
          startsAt: formData.startsAt || '',
          endsAt: formData.endsAt || '',
        };

        // Llamar onSaved con un deal parcial (sin id, será generado por el backend)
        onSaved({
          id: '', // Se generará al guardar en BD
          discountType: formData.discountType as 'PERCENTAGE' | 'FIXED',
          discountValue: formData.discountValue || 0,
          startsAt: new Date(formData.startsAt || ''),
          endsAt: new Date(formData.endsAt || ''),
          isActive: true,
          isCurrentlyActive: false,
          stacksWithTiers: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return;
      }

      // Modo con productId: guardar en BD
      setIsLoading(true);

      if (existingDeal) {
        // Edición
        const result = await updateFlashDeal(productId, existingDeal.id, {
          discountType: formData.discountType || 'PERCENTAGE',
          discountValue: formData.discountValue || 0,
          startsAt: formData.startsAt || '',
          endsAt: formData.endsAt || '',
        });

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          onSaved(result.data);
        }
      } else {
        // Creación
        const result = await createFlashDeal(productId, {
          discountType: formData.discountType || 'PERCENTAGE',
          discountValue: formData.discountValue || 0,
          startsAt: formData.startsAt || '',
          endsAt: formData.endsAt || '',
        });

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          onSaved(result.data);
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError('Revisa las fechas y valores de la oferta flash');
      } else {
        setError('Error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const effectivePrice =
    formData.discountValue && basePrice
      ? formData.discountType === 'PERCENTAGE'
        ? basePrice * (1 - (formData.discountValue || 0) / 100)
        : formData.discountValue
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-4 sm:p-5 bg-white rounded-xl border border-origen-mandarina/20 shadow-subtle space-y-4">
        <h4 className="text-sm font-medium text-origen-bosque flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-origen-mandarina shrink-0" />
          {existingDeal ? 'Editar oferta flash' : 'Nueva oferta flash'}
        </h4>

        {/* Selector de tipo (2 tiles: PERCENTAGE, FIXED) */}
        <div className="grid grid-cols-2 gap-2">
          <SelectableCard
            layout="detailed"
            icon={<Percent className="h-4 w-4" />}
            label="Porcentaje"
            description="Descuento en %"
            selected={formData.discountType === 'PERCENTAGE'}
            onSelect={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
          />
          <SelectableCard
            layout="detailed"
            icon={<DollarSign className="h-4 w-4" />}
            label="Precio fijo"
            description="Precio especial"
            selected={formData.discountType === 'FIXED'}
            onSelect={() => setFormData({ ...formData, discountType: 'FIXED' })}
          />
        </div>

        {/* Campo de valor */}
        <div>
          <Label className="block text-xs font-medium text-origen-bosque mb-1.5">
            {formData.discountType === 'PERCENTAGE' ? 'Descuento (%)' : 'Precio fijo (€)'}
          </Label>
          {formData.discountType === 'PERCENTAGE' ? (
            <PercentageInput
              value={formData.discountValue || 10}
              onChange={(value) => setFormData({ ...formData, discountValue: value })}
              min={0.1}
              max={90}
              className="h-10 w-full rounded-lg"
            />
          ) : (
            <CurrencyInput
              value={formData.discountValue || 0}
              onChange={(value) => setFormData({ ...formData, discountValue: value })}
              min={0}
              className="h-10 w-full rounded-lg"
            />
          )}
        </div>

        {/* Campos de fecha — 1 columna en móvil: el widget nativo datetime-local
            necesita más ancho del que da media columna a 375px */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="block text-xs font-medium text-origen-bosque mb-1.5">Inicio</Label>
            <Input
              type="datetime-local"
              value={formData.startsAt || ''}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              className="h-10 w-full rounded-lg text-sm"
            />
          </div>
          <div>
            <Label className="block text-xs font-medium text-origen-bosque mb-1.5">Fin</Label>
            <Input
              type="datetime-local"
              value={formData.endsAt || ''}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              className="h-10 w-full rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Vista previa */}
        {effectivePrice && formData.startsAt && formData.endsAt && (
          <div className="p-3 bg-white rounded-lg border border-origen-mandarina/40">
            <p className="text-xs text-text-subtle mb-2">Vista previa:</p>
            <p className="text-sm font-semibold text-origen-bosque">
              Precio especial: {effectivePrice.toFixed(2)}€
            </p>
            <p className="text-xs text-text-subtle mt-1">
              Del {new Date(formData.startsAt).toLocaleDateString('es')} al {new Date(formData.endsAt).toLocaleDateString('es')}
            </p>
          </div>
        )}

        {/* Aviso de no-acumulación con tiers */}
        {hasTiers && (
          <Alert variant="info" className="text-xs">
            <AlertCircle className="w-3 h-3 mr-1 shrink-0 mt-0.5" />
            <p>Mientras la oferta flash esté activa, los descuentos por cantidad no se aplicarán</p>
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="text-xs">
            <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
            {error}
          </Alert>
        )}

        <div className="flex gap-2 pt-3 border-t border-border-subtle">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            variant="primary"
            className="flex-1"
            size="sm"
          >
            {isLoading ? 'Guardando...' : existingDeal ? 'Guardar cambios' : 'Crear oferta'}
          </Button>
          <Button
            onClick={onCancel}
            variant="secondary"
            size="sm"
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
