/**
 * @file page.tsx (dev-preview/weight-sale-step)
 * @description Página de solo-desarrollo para revisar visualmente el paso
 * «Precio y formato de venta» con venta a granel y preparaciones (ADR-024,
 * propuesta C). `?productId=...` monta el editor de preparaciones con un
 * producto existente (en QA, las llamadas al gateway se simulan);
 * `?published=1` muestra el estado de un producto publicado (modo y medida
 * bloqueados). No enlazada desde ninguna navegación — fuera de
 * `PROTECTED_PREFIXES` en `middleware.ts`, así que no requiere sesión.
 */

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StepPricingInventory } from '@/app/dashboard/products/components/steps/StepPricingInventory';

function Preview() {
  const params = useSearchParams();
  const productId = params.get('productId') ?? undefined;
  const published = params.get('published') === '1';
  const [formData, setFormData] = useState<Record<string, unknown>>({
    name: 'Lubina de estero',
    saleMode: 'WEIGHT',
    saleModeLocked: published,
    measureKind: 'MASS',
    hasVariants: params.get('variants') === '1',
    pricePerKgCents: 1400,
    basePrice: 14,
    minWeightGrams: 500,
    weightIncrementGrams: 250,
    stock: 12000,
    lowStockThreshold: 1000,
    trackInventory: true,
    allowBackorders: false,
  });

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-surface-alt p-4 shadow-subtle sm:p-6">
        <StepPricingInventory
          formData={formData}
          productId={productId}
          onInputChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          onNestedChange={(section, field, value) =>
            setFormData((prev) => ({
              ...prev,
              [section]: { ...((prev[section] as object) ?? {}), [field]: value },
            }))}
        />
      </div>
    </div>
  );
}

export default function WeightSaleStepPreviewPage() {
  return (
    <Suspense fallback={null}>
      <Preview />
    </Suspense>
  );
}
