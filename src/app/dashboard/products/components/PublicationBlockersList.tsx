/**
 * @file PublicationBlockersList.tsx
 * @description Lo que impide enviar el producto a revisión (stock, precio,
 * descripción, categoría, imagen, nutricional…), TODO junto y con la acción
 * para arreglarlo a la vista: stock y precio se corrigen en el propio panel
 * (sin entrar al formulario ni pulsar «Corregir»); el resto enlaza
 * directamente al paso del formulario que lo arregla.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@arcediano/ux-library';
import { updateProduct, updateProductStock, type PublicationRequirement } from '@/lib/api/products';
import { FORM_STEPS } from '@/types/product';
import type { Product } from '@/types/product';

function InlineNumberFix({
  id,
  label,
  hint,
  unit,
  step,
  min,
  onSave,
}: {
  id: string;
  label: string;
  hint: string;
  unit?: string;
  step: string;
  min: string;
  onSave: (value: number) => Promise<string | null>;
}) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const parsed = Number(value.replace(',', '.'));
  const valid = value.trim() !== '' && Number.isFinite(parsed) && parsed > 0;

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const problem = await onSave(parsed);
    setBusy(false);
    if (problem) setError(problem);
    else setDone(true);
  };

  if (done) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-feedback-success-text" role="status">
        <Check className="h-4 w-4" aria-hidden="true" />
        {label} guardado.
      </p>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <p className="text-xs text-text-subtle">{hint}</p>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-40">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            step={step}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void save()}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 pr-10 text-sm text-foreground focus:border-origen-pradera focus:outline-none focus:ring-2 focus:ring-origen-pradera/30"
          />
          {unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-subtle">
              {unit}
            </span>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          className="w-full sm:w-auto"
          onClick={save}
          disabled={!valid || busy}
          loading={busy}
          loadingText="Guardando..."
        >
          Guardar
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-feedback-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}

export function PublicationBlockersList({
  product,
  missing,
  onProductUpdated,
}: {
  product: Pick<Product, 'id' | 'hasVariants'>;
  missing: PublicationRequirement[];
  /** Tras guardar stock/precio: el padre recarga el producto y el estado de publicación. */
  onProductUpdated?: (updated?: Product) => void;
}) {
  const hasVariants = product.hasVariants === true;
  const editBase = `/dashboard/products/${product.id}/edit`;

  return (
    <ul className="space-y-2.5" data-testid="publication-blockers">
      {missing.map((req) => {
        const stepLabel = FORM_STEPS.find((s) => s.id === req.stepId)?.label;
        const inlineStock = req.id === 'stock' && !hasVariants;
        const inlinePrice = req.id === 'price' && !hasVariants;
        return (
          <li key={req.id} className="rounded-2xl border border-border bg-surface p-3 text-foreground">
            {inlineStock ? (
              <InlineNumberFix
                id={`fix-${req.id}`}
                label="Stock disponible"
                hint="Indica cuántas unidades tienes para vender (mayor que 0)."
                unit="uds"
                step="1"
                min="1"
                onSave={async (n) => {
                  const res = await updateProductStock(product.id, 'set', Math.floor(n));
                  if (res.error) return res.error;
                  onProductUpdated?.(res.data);
                  return null;
                }}
              />
            ) : inlinePrice ? (
              <InlineNumberFix
                id={`fix-${req.id}`}
                label="Precio"
                hint="Precio de venta al público, IVA incluido (mayor que 0)."
                unit="€"
                step="0.01"
                min="0.01"
                onSave={async (n) => {
                  const res = await updateProduct(product.id, { basePrice: n });
                  if (res.error) return res.error;
                  onProductUpdated?.(res.data);
                  return null;
                }}
              />
            ) : (
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p className="text-sm text-foreground">{req.message}</p>
                <Link
                  href={`${editBase}?step=${req.stepId}`}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-origen-hoja hover:underline sm:min-h-0"
                >
                  {stepLabel ? `Ir a «${stepLabel}»` : 'Corregir'}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
