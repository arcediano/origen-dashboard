/**
 * @component WeightBuyerPreview
 * @description Panel «Así lo verá el comprador» del paso de precios en venta a
 * granel (ADR-024, propuesta C): selector de preparación, cantidad por
 * incrementos, importe estimado y stock restante, calculados con las mismas
 * reglas que el backend (cantidad en g o ml, precio por kg o litro).
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@arcediano/ux-library';
import { Eye, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MeasureKind } from '@/types/product';
import {
  formatBaseQuantity, formatCents, measureUnits, nextQuantity, weightLineCents,
} from '@/lib/products/quantity-format';

export interface PreviewPreparation {
  key: string;
  name: string;
  pricePerKgCents: number;
  stockBaseUnits: number;
}

interface WeightBuyerPreviewProps {
  productName?: string;
  measureKind?: MeasureKind;
  minQuantity?: number;
  increment?: number;
  preparations: PreviewPreparation[];
}

export function WeightBuyerPreview({
  productName,
  measureKind,
  minQuantity,
  increment,
  preparations,
}: WeightBuyerPreviewProps) {
  const units = measureUnits(measureKind);
  const minimum = minQuantity && minQuantity > 0 ? minQuantity : 0;
  const step = increment && increment > 0 ? increment : 0;
  const ready = minimum > 0 && step > 0 && preparations.length > 0;

  const [selectedKey, setSelectedKey] = useState<string | undefined>(preparations[0]?.key);
  const [quantity, setQuantity] = useState<number>(minimum);

  // Si la preparación elegida desaparece o cambian las reglas de cantidad, se reajusta la vista.
  useEffect(() => {
    if (!preparations.some((p) => p.key === selectedKey)) setSelectedKey(preparations[0]?.key);
  }, [preparations, selectedKey]);
  useEffect(() => {
    setQuantity(minimum);
  }, [minimum, step]);

  const selected = useMemo(
    () => preparations.find((p) => p.key === selectedKey) ?? preparations[0],
    [preparations, selectedKey],
  );

  const fromPrice = preparations.length > 0
    ? Math.min(...preparations.map((p) => p.pricePerKgCents))
    : undefined;
  const soldOut = !!selected && selected.stockBaseUnits < minimum;
  const available = selected?.stockBaseUnits ?? 0;
  const estimate = selected ? weightLineCents(selected.pricePerKgCents, quantity) : 0;

  return (
    <section
      aria-label="Así lo verá el comprador"
      className="rounded-2xl border border-border bg-surface-alt p-4 shadow-subtle sm:p-5"
    >
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Eye className="h-3.5 w-3.5 text-hoja-tinta" aria-hidden="true" />
        Así lo verá el comprador
      </p>

      {!ready ? (
        <p className="text-sm text-muted-foreground">
          Indica la cantidad mínima, el incremento y al menos una preparación con precio para ver la vista previa.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-semibold text-origen-bosque">{productName || 'Tu producto'}</h4>
            {fromPrice !== undefined && (
              <p className="text-sm text-muted-foreground">
                {preparations.length > 1 ? 'Desde ' : ''}{formatCents(fromPrice)}/{units.big}
              </p>
            )}
          </div>

          {preparations.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Preparación</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Preparación">
                {preparations.map((preparation) => {
                  const isSelected = preparation.key === selected?.key;
                  const isSoldOut = preparation.stockBaseUnits < minimum;
                  return (
                    <button
                      key={preparation.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedKey(preparation.key)}
                      className={cn(
                        'min-h-11 rounded-full border px-4 text-sm transition-colors',
                        isSelected
                          ? 'border-origen-bosque bg-origen-pastel/40 font-semibold ring-1 ring-origen-bosque'
                          : 'border-border bg-surface-alt hover:border-origen-pradera/40',
                        isSoldOut && 'text-text-disabled',
                      )}
                    >
                      {preparation.name}
                      {isSoldOut && <span className="ml-1.5 text-xs">· Agotado</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold text-foreground">Cantidad</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={`Quitar ${formatBaseQuantity(step, measureKind)}`}
                onClick={() => setQuantity((q) => nextQuantity(q, -1, minimum, step))}
                disabled={soldOut || quantity <= minimum}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-[5.5rem] text-center text-lg font-bold text-origen-bosque" aria-live="polite">
                {formatBaseQuantity(quantity, measureKind)}
              </span>
              <button
                type="button"
                aria-label={`Añadir ${formatBaseQuantity(step, measureKind)}`}
                onClick={() => setQuantity((q) => nextQuantity(q, 1, minimum, step, available))}
                disabled={soldOut || quantity + step > available}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-text-subtle">
              Desde {formatBaseQuantity(minimum, measureKind)}, de {formatBaseQuantity(step, measureKind)} en {formatBaseQuantity(step, measureKind)}.
            </p>
          </div>

          <div className="space-y-1.5 border-t border-border pt-3">
            {selected && !soldOut && (
              <>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {formatBaseQuantity(quantity, measureKind)} × {formatCents(selected.pricePerKgCents)}/{units.big}
                  </span>
                  <span>{formatCents(estimate)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-base font-bold text-origen-bosque">
                  <span>Importe estimado</span>
                  <span>{formatCents(estimate)}</span>
                </div>
                <p className="text-xs text-text-subtle">
                  Quedan {formatBaseQuantity(available, measureKind)}
                  {selected && preparations.length > 1 ? ` de «${selected.name}»` : ''}.
                </p>
              </>
            )}
            {soldOut && <Badge variant="warning" size="sm">Agotado: el comprador no podrá añadirlo a la cesta</Badge>}
          </div>
        </div>
      )}
    </section>
  );
}
