'use client';

import * as React from 'react';
import { InputAffixField, RadioGroup, RadioGroupItem } from '@arcediano/ux-library';
import type { FreeShippingConfig, FreeShippingMode } from '@/lib/onboarding/free-shipping';

interface FreeShippingFieldProps {
  value: FreeShippingConfig;
  onChange: (value: FreeShippingConfig) => void;
  error?: string;
  /** Prefijo de ids (accesibilidad y foco desde el resumen de errores). */
  idPrefix?: string;
}

/**
 * Envío gratuito del productor: sin envío gratuito, gratuito desde un importe,
 * o siempre gratuito (con el importe bloqueado y vacío).
 */
export function FreeShippingField({ value, onChange, error, idPrefix = 'onb-free-shipping' }: FreeShippingFieldProps) {
  const setMode = (mode: string) => {
    const next = mode as FreeShippingMode;
    // "Siempre gratuito" vacía el importe; el resto conserva lo escrito.
    onChange({ mode: next, amount: next === 'always' || next === 'none' ? 0 : value.amount });
  };

  return (
    <div className="space-y-3">
      <RadioGroup value={value.mode} onValueChange={setMode} aria-label="Envío gratuito" className="space-y-2">
        <RadioGroupItem id={`${idPrefix}-none`} value="none" label="No ofrecer envío gratuito" />
        <RadioGroupItem id={`${idPrefix}-from`} value="from" label="Envío gratuito a partir de un importe" />
        <RadioGroupItem
          id={`${idPrefix}-always`}
          value="always"
          label="Envío siempre gratuito"
          description="Se aplica a todos tus pedidos, sin importe mínimo."
        />
      </RadioGroup>

      <div className="max-w-xs">
        <InputAffixField
          id={`${idPrefix}-amount`}
          aria-label="Importe a partir del cual el envío es gratuito"
          type="number"
          inputMode="decimal"
          value={value.mode === 'from' && value.amount > 0 ? value.amount : ''}
          onChange={(e) => onChange({ mode: 'from', amount: parseFloat(e.target.value) || 0 })}
          disabled={value.mode !== 'from'}
          min={0}
          step={5}
          affixLeft="€"
          placeholder={value.mode === 'from' ? '40' : ''}
          error={error}
        />
      </div>
      {!error && value.mode === 'from' && (
        <p className="text-xs text-text-subtle">El envío será gratis cuando el subtotal de tus productos en la cesta alcance este importe.</p>
      )}
    </div>
  );
}
