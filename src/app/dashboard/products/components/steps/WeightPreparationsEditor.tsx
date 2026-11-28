/**
 * @component WeightPreparationsEditor
 * @description Preparaciones de un producto a granel (ADR-024): cada una con su
 * propio precio por kg o litro y su propio stock en g o ml (p. ej. lubina
 * entera, en rodajas, lomos limpios). Guarda por la misma vía que las
 * variantes: una opción única «Preparación» y una variante por fila.
 *
 * Solo disponible con el producto ya creado (`productId`), igual que el editor
 * de variantes. En un producto publicado, una preparación retirada queda
 * desactivada (el backend nunca la borra).
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, CurrencyInput, Input } from '@arcediano/ux-library';
import { Boxes, Plus, Save, Trash2 } from 'lucide-react';
import type { MeasureKind } from '@/types/product';
import { fetchProductById, syncProductOptions, syncProductVariants } from '@/lib/api/products';
import { MIN_PRODUCT_PRICE_EUROS } from '@/lib/constants/pricing';
import { formatBaseQuantity, measureUnits } from '@/lib/products/quantity-format';
import { WeightBuyerPreview, type PreviewPreparation } from './WeightBuyerPreview';

const OPTION_NAME = 'Preparación';

interface PreparationDraft {
  key: string;
  id?: string;
  name: string;
  /** Precio por kg o litro, en euros (se envía en céntimos). */
  price: number;
  /** Stock en gramos o mililitros. */
  stock: number;
  sku?: string;
}

interface WeightPreparationsEditorProps {
  productId?: string;
  productName?: string;
  measureKind?: MeasureKind;
  minQuantity?: number;
  increment?: number;
  /** Notifica al padre cuántas preparaciones hay guardadas (valida que el paso está completo). */
  onVariantsChange?: (count: number) => void;
}

let draftCounter = 0;
const nextKey = () => `prep-${(draftCounter += 1)}`;

export function WeightPreparationsEditor({
  productId,
  productName,
  measureKind,
  minQuantity,
  increment,
  onVariantsChange,
}: WeightPreparationsEditorProps) {
  const units = measureUnits(measureKind);
  const [isLoading, setIsLoading] = useState(!!productId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PreparationDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setLoadError(null);
    const result = await fetchProductById(productId);
    setIsLoading(false);
    if (result.error) {
      setLoadError(result.error);
      return;
    }
    const variants = (result.data?.variants ?? []).filter((v) => v.isActive);
    setDrafts(
      variants.map((v) => ({
        key: nextKey(),
        id: v.id,
        name: v.option1Value ?? '',
        price: (v.pricePerKgCents ?? 0) / 100,
        stock: v.stockBaseUnits ?? 0,
        sku: v.sku,
      })),
    );
    onVariantsChange?.(variants.length);
  }, [productId, onVariantsChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (key: string, patch: Partial<PreparationDraft>) => {
    setSaved(false);
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  };

  const totalStock = drafts.reduce((sum, d) => sum + (d.stock || 0), 0);

  const preview: PreviewPreparation[] = useMemo(
    () => drafts
      .filter((d) => d.name.trim() && d.price * 100 > 0)
      .map((d) => ({
        key: d.key,
        name: d.name.trim(),
        pricePerKgCents: Math.round(d.price * 100),
        stockBaseUnits: d.stock || 0,
      })),
    [drafts],
  );

  const handleSave = async () => {
    if (!productId) return;
    setError(null);
    const names = drafts.map((d) => d.name.trim());
    if (drafts.length === 0) {
      setError('Añade al menos una preparación.');
      return;
    }
    if (names.some((n) => !n)) {
      setError('Todas las preparaciones necesitan un nombre.');
      return;
    }
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) {
      setError('Hay preparaciones con el mismo nombre.');
      return;
    }
    if (drafts.some((d) => !d.price || d.price < MIN_PRODUCT_PRICE_EUROS)) {
      setError(`Cada preparación necesita un precio por ${units.big} de al menos ${MIN_PRODUCT_PRICE_EUROS.toFixed(2)} €.`);
      return;
    }

    setIsSaving(true);
    const options = await syncProductOptions(productId, [{ name: OPTION_NAME, values: names }]);
    if (options.error) {
      setIsSaving(false);
      setError(options.error);
      return;
    }
    const result = await syncProductVariants(
      productId,
      drafts.map((d) => ({
        id: d.id,
        option1Value: d.name.trim(),
        pricePerKgCents: Math.round(d.price * 100),
        stockBaseUnits: Math.max(0, Math.round(d.stock || 0)),
      })),
    );
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data) {
      setDrafts(
        result.data
          .filter((v) => v.isActive)
          .map((v) => ({
            key: nextKey(),
            id: v.id,
            name: v.option1Value ?? '',
            price: (v.pricePerKgCents ?? 0) / 100,
            stock: v.stockBaseUnits ?? 0,
            sku: v.sku,
          })),
      );
      onVariantsChange?.(result.data.filter((v) => v.isActive).length);
      setSaved(true);
    }
  };

  if (!productId) {
    return (
      <div className="rounded-xl border-2 border-dashed border-origen-pradera/30 bg-origen-crema/20 py-8 text-center">
        <Boxes className="mx-auto mb-3 h-12 w-12 text-origen-pradera/40" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Guarda el producto primero</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
          Las preparaciones (entero, en rodajas, lomos limpios…) se configuran una vez creado el producto — guarda este paso para añadirlas.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Cargando preparaciones">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border-subtle bg-origen-pastel/40" />
        ))}
      </div>
    );
  }

  if (loadError) return <Alert variant="error">{loadError}</Alert>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-origen-bosque">Preparaciones, precio y stock</h3>
            <p className="text-xs text-muted-foreground">
              Cada una con su precio por {units.big} y su propio stock en {units.base}.
            </p>
          </div>
          {drafts.length > 0 && <Badge variant="leaf" size="sm">{drafts.length}</Badge>}
        </div>

        {drafts.length === 0 ? (
          <p className="text-xs text-text-subtle">Aún no hay preparaciones. Añade la primera, por ejemplo «Entero».</p>
        ) : (
          <ul className="space-y-3">
            {drafts.map((draft) => (
              <li key={draft.key} className="space-y-3 rounded-xl border border-border-subtle bg-surface-alt p-3">
                <div className="flex items-start gap-2">
                  <Input
                    label="Nombre"
                    placeholder="Ej: En rodajas"
                    value={draft.name}
                    onChange={(e) => update(draft.key, { name: e.target.value })}
                    maxLength={60}
                    containerClassName="min-w-0 flex-1"
                    className="h-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setSaved(false);
                      setDrafts((prev) => prev.filter((d) => d.key !== draft.key));
                    }}
                    aria-label={`Quitar la preparación ${draft.name || 'sin nombre'}`}
                    className="mt-6 h-11 w-11 shrink-0 text-feedback-danger hover:bg-feedback-danger-subtle hover:text-feedback-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <CurrencyInput
                    label={`Precio por ${units.big}`}
                    value={draft.price}
                    onChange={(value) => update(draft.key, { price: value })}
                    min={MIN_PRODUCT_PRICE_EUROS}
                    className="h-11"
                  />
                  <Input
                    type="number"
                    label={`Stock (${units.base})`}
                    tooltip={`Cantidad disponible de esta preparación en ${units.base}; es independiente del stock de las demás.`}
                    value={draft.stock}
                    onChange={(e) => update(draft.key, { stock: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                    className="h-11"
                  />
                </div>
                {draft.sku && (
                  <Badge variant="neutral" size="sm" className="font-mono">{draft.sku}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          onClick={() => {
            setSaved(false);
            setDrafts((prev) => [...prev, { key: nextKey(), name: '', price: 0, stock: 0 }]);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Añadir preparación
        </Button>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-origen-pastel/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Stock total (suma de preparaciones)</span>
          <strong className="text-origen-bosque">{formatBaseQuantity(totalStock, measureKind)}</strong>
        </div>

        {error && <Alert variant="error" className="text-xs">{error}</Alert>}
        {saved && !error && <Alert variant="success" className="text-xs">Preparaciones guardadas.</Alert>}

        <Button
          type="button"
          variant="primary"
          size="sm"
          className="min-h-11"
          onClick={() => void handleSave()}
          disabled={isSaving}
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Guardando...' : 'Guardar preparaciones'}
        </Button>
      </div>

      <div className="min-w-0">
        <WeightBuyerPreview
          productName={productName}
          measureKind={measureKind}
          minQuantity={minQuantity}
          increment={increment}
          preparations={preview}
        />
      </div>
    </div>
  );
}
