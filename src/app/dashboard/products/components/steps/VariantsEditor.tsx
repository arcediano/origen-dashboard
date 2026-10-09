/**
 * @component VariantsEditor
 * @description Opciones (Tamaño, Formato…) y variantes del producto, estilo
 * Shopify — extraído de lo que antes era el paso "Variantes" independiente,
 * ahora parte del paso unificado "Precio, variantes e inventario" (petición
 * del humano, 2026-10-09: "unificar para no duplicar trabajo... primero el
 * usuario seleccionará si el producto tiene o no variantes, y si tiene, el
 * precio, peso del envío y SKU se crea para cada variante").
 *
 * Diferencias con la versión anterior (`StepVariants`):
 * - El SKU ya NO es un campo editable: lo genera el backend (coherente con
 *   el SKU del producto, p. ej. "QUE-QUES-1829-500G") y solo se muestra.
 * - Nuevo campo de peso (con unidad) por variante, para calcular envíos —
 *   antes solo existía a nivel de producto; con variantes, cada una define
 *   el suyo (dimensiones/tipo de paquete siguen siendo del producto).
 *
 * Solo disponible en edición (requiere `productId` — las opciones/variantes
 * se guardan contra el producto ya creado).
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button, Input, CurrencyInput, Badge, Alert,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@arcediano/ux-library';
import { Boxes, Plus, Trash2, Save, RefreshCw, Package } from 'lucide-react';
import type { ProductOption } from '@/types/product';
import { fetchProductById, syncProductOptions, syncProductVariants } from '@/lib/api/products';

interface VariantsEditorProps {
  productId?: string;
  basePrice?: number;
  /** Notifica al padre (`useProductForm`) el nº de variantes guardadas tras un alta/baja — usado para validar que el paso está completo. */
  onVariantsChange?: (count: number) => void;
}

interface OptionDraft {
  name: string;
  valuesText: string;
}

interface VariantDraft {
  id?: string;
  option1Value?: string;
  option2Value?: string;
  option3Value?: string;
  /** Generado por el backend al guardar — nunca editable aquí. */
  sku?: string;
  price: number;
  stock: number;
  weight?: number;
  weightUnit?: 'kg' | 'g';
}

const MAX_OPTIONS = 3;

function parseValues(valuesText: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of valuesText.split(',')) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function comboLabel(variant: { option1Value?: string; option2Value?: string; option3Value?: string }): string {
  return [variant.option1Value, variant.option2Value, variant.option3Value].filter(Boolean).join(' / ');
}

export function VariantsEditor({ productId, basePrice = 0, onVariantsChange }: VariantsEditorProps) {
  const [isLoading, setIsLoading] = useState(!!productId);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savedOptions, setSavedOptions] = useState<ProductOption[]>([]);
  const [optionDrafts, setOptionDrafts] = useState<OptionDraft[]>([]);
  const [isSavingOptions, setIsSavingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [isSavingVariants, setIsSavingVariants] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setLoadError(null);

    const result = await fetchProductById(productId);
    setIsLoading(false);

    if (result.error) {
      setLoadError(result.error);
      return;
    }
    if (result.data) {
      setSavedOptions(result.data.options ?? []);
      setOptionDrafts(
        (result.data.options ?? []).map((option) => ({
          name: option.name,
          valuesText: option.values.map((v) => v.value).join(', '),
        })),
      );
      setVariantDrafts(
        (result.data.variants ?? []).map((variant) => ({
          id: variant.id,
          option1Value: variant.option1Value,
          option2Value: variant.option2Value,
          option3Value: variant.option3Value,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
          weight: variant.weight,
          weightUnit: variant.weightUnit,
        })),
      );
      onVariantsChange?.(result.data.variants?.length ?? 0);
    }
  }, [productId, onVariantsChange]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  // ─── Opciones ───────────────────────────────────────────────────────────

  const handleAddOption = () => {
    if (optionDrafts.length >= MAX_OPTIONS) return;
    setOptionDrafts([...optionDrafts, { name: '', valuesText: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptionDrafts(optionDrafts.filter((_, i) => i !== index));
  };

  const handleSaveOptions = async () => {
    if (!productId) return;
    setOptionsError(null);

    const options = optionDrafts
      .map((draft) => ({ name: draft.name.trim(), values: parseValues(draft.valuesText) }))
      .filter((option) => option.name && option.values.length > 0);

    setIsSavingOptions(true);
    const result = await syncProductOptions(productId, options);
    setIsSavingOptions(false);

    if (result.error) {
      setOptionsError(result.error);
      return;
    }
    if (result.data) {
      setSavedOptions(result.data);
      setOptionDrafts(
        result.data.map((option) => ({
          name: option.name,
          valuesText: option.values.map((v) => v.value).join(', '),
        })),
      );
      // Las opciones guardadas pueden invalidar combinaciones de variantes
      // existentes (valor eliminado/renombrado) — se recalculan al generar.
    }
  };

  // ─── Variantes ──────────────────────────────────────────────────────────

  const handleGenerateVariants = () => {
    if (savedOptions.length === 0) return;

    const valueLists = savedOptions.map((option) => option.values.map((v) => v.value));
    let combos: Array<Array<string | undefined>> = [[]];
    for (const values of valueLists) {
      const next: Array<Array<string | undefined>> = [];
      for (const combo of combos) {
        for (const value of values) {
          next.push([...combo, value]);
        }
      }
      combos = next;
    }

    const existingByKey = new Map(
      variantDrafts.map((v) => [[v.option1Value, v.option2Value, v.option3Value].join('␟'), v]),
    );

    const generated: VariantDraft[] = combos.map((combo) => {
      const [option1Value, option2Value, option3Value] = combo;
      const key = [option1Value, option2Value, option3Value].join('␟');
      const existing = existingByKey.get(key);
      return (
        existing ?? {
          option1Value,
          option2Value,
          option3Value,
          price: basePrice || 0,
          stock: 0,
          weightUnit: 'kg',
        }
      );
    });

    setVariantDrafts(generated);
  };

  const handleRemoveVariant = (index: number) => {
    setVariantDrafts(variantDrafts.filter((_, i) => i !== index));
  };

  const handleVariantFieldChange = (index: number, field: keyof VariantDraft, value: string | number | undefined) => {
    setVariantDrafts((prev) =>
      prev.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant)),
    );
  };

  const handleSaveVariants = async () => {
    if (!productId) return;
    setVariantsError(null);

    const invalid = variantDrafts.some((v) => !v.price || v.price <= 0);
    if (invalid) {
      setVariantsError('Todas las variantes necesitan un precio mayor que 0');
      return;
    }

    setIsSavingVariants(true);
    const result = await syncProductVariants(
      productId,
      variantDrafts.map((v) => ({
        id: v.id,
        option1Value: v.option1Value,
        option2Value: v.option2Value,
        option3Value: v.option3Value,
        price: v.price,
        stock: v.stock,
        weight: v.weight,
        weightUnit: v.weightUnit,
      })),
    );
    setIsSavingVariants(false);

    if (result.error) {
      setVariantsError(result.error);
      return;
    }
    if (result.data) {
      setVariantDrafts(
        result.data.map((variant) => ({
          id: variant.id,
          option1Value: variant.option1Value,
          option2Value: variant.option2Value,
          option3Value: variant.option3Value,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
          weight: variant.weight,
          weightUnit: variant.weightUnit,
        })),
      );
      onVariantsChange?.(result.data.length);
    }
  };

  if (!productId) {
    return (
      <div className="text-center py-8 bg-origen-crema/20 rounded-xl border-2 border-dashed border-origen-pradera/30">
        <Boxes className="w-12 h-12 text-origen-pradera/40 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Guarda el producto primero</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
          Las variantes (Tamaño, Formato…) se configuran una vez creado el producto — guarda este paso para poder añadirlas.
        </p>
      </div>
    );
  }

  if (isLoading) {
    // Bordeado (no solo relleno) para que se note de verdad sobre la card
    // blanca -- `bg-origen-crema/40` (heredado de la versión anterior de
    // este bloque) es casi invisible sobre `bg-surface-alt`, porque
    // `origen-crema` es el propio color de fondo de página (sección 1.1 de
    // la guía de diseño). Con este paso ahora dentro de una pantalla que ya
    // estaba asentada (el toggle no dispara ninguna transición de salida/
    // entrada como el cambio de paso), ese contraste tan bajo se nota como
    // una zona en blanco mientras carga -- hallazgo real, petición del
    // humano, 2026-10-09. Geometría parecida a la sección real (título +
    // fila de opción) para no colapsar tanto la altura del paso.
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Cargando variantes">
        <div className="h-4 w-56 animate-pulse rounded bg-origen-pastel/60" />
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
          <div className="h-11 animate-pulse rounded-xl border border-border-subtle bg-origen-pastel/40" />
          <div className="h-11 animate-pulse rounded-xl border border-border-subtle bg-origen-pastel/40" />
          <div className="h-11 w-11 animate-pulse rounded-xl border border-border-subtle bg-origen-pastel/40 hidden sm:block" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded-xl bg-origen-pastel/60" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-border-subtle bg-origen-pastel/40" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return <Alert variant="error">{loadError}</Alert>;
  }

  return (
    <div className="space-y-8">
      {/* Opciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-origen-bosque">Opciones (p. ej. Tamaño, Formato)</h3>
          {optionDrafts.length < MAX_OPTIONS && (
            <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
              <Plus className="w-3.5 h-3.5" /> Añadir opción
            </Button>
          )}
        </div>

        <p className="text-[10px] text-text-subtle leading-relaxed">
          Si el valor es una cantidad (peso, volumen…), incluye la unidad en el propio texto —
          escribe <span className="font-medium">&quot;250g&quot;</span>, <span className="font-medium">&quot;1kg&quot;</span> o{' '}
          <span className="font-medium">&quot;750ml&quot;</span>, no solo el número.
        </p>

        {optionDrafts.length === 0 ? (
          <p className="text-xs text-text-subtle">
            Sin opciones todavía — añade una (p. ej. &quot;Tamaño&quot;) para empezar a generar variantes.
          </p>
        ) : (
          <div className="space-y-3">
            {optionDrafts.map((option, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 items-start">
                <Input
                  placeholder="Nombre (ej: Tamaño)"
                  value={option.name}
                  onChange={(e) =>
                    setOptionDrafts((prev) =>
                      prev.map((o, i) => (i === index ? { ...o, name: e.target.value } : o)),
                    )
                  }
                  className="h-11"
                />
                <Input
                  placeholder="Valores separados por comas (ej: S, M, L o 250g, 500g, 1kg)"
                  value={option.valuesText}
                  onChange={(e) =>
                    setOptionDrafts((prev) =>
                      prev.map((o, i) => (i === index ? { ...o, valuesText: e.target.value } : o)),
                    )
                  }
                  className="h-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveOption(index)}
                  aria-label="Eliminar opción"
                  className="text-feedback-danger hover:text-feedback-danger hover:bg-feedback-danger-subtle shrink-0 self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {optionsError && (
          <Alert variant="error" className="text-xs">{optionsError}</Alert>
        )}

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => void handleSaveOptions()}
          disabled={isSavingOptions}
        >
          <Save className="w-3.5 h-3.5" />
          {isSavingOptions ? 'Guardando...' : 'Guardar opciones'}
        </Button>
      </div>

      {/* Variantes */}
      {savedOptions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border-subtle">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-origen-bosque">Variantes</h3>
              {variantDrafts.length > 0 && (
                <Badge variant="leaf" size="sm">{variantDrafts.length}</Badge>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleGenerateVariants}>
              <RefreshCw className="w-3.5 h-3.5" /> Generar combinaciones
            </Button>
          </div>

          {variantDrafts.length === 0 ? (
            <div className="text-center py-6 bg-origen-crema/20 rounded-xl border-2 border-dashed border-origen-pradera/30">
              <Package className="w-8 h-8 text-origen-pradera/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Pulsa &quot;Generar combinaciones&quot; para crear una variante por cada combinación de valores.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {variantDrafts.map((variant, index) => (
                <div
                  key={variant.id ?? `${comboLabel(variant)}-${index}`}
                  className="p-3 bg-surface-alt rounded-xl border border-border-subtle space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-origen-bosque truncate" title={comboLabel(variant)}>
                        {comboLabel(variant) || '—'}
                      </span>
                      {/* SKU generado por el backend al guardar -- nunca editable aquí (petición del humano, 2026-10-09). */}
                      {variant.sku && (
                        <Badge variant="neutral" size="sm" className="font-mono shrink-0">{variant.sku}</Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveVariant(index)}
                      aria-label="Eliminar variante"
                      className="text-feedback-danger hover:text-feedback-danger hover:bg-feedback-danger-subtle shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <CurrencyInput
                      label="Precio"
                      value={variant.price}
                      onChange={(v) => handleVariantFieldChange(index, 'price', v)}
                      min={0.01}
                      className="h-10"
                    />
                    <Input
                      type="number"
                      label="Stock"
                      tooltip="Unidades disponibles de esta variante en concreto (no del producto en general)."
                      placeholder="0"
                      value={variant.stock}
                      onChange={(e) => handleVariantFieldChange(index, 'stock', parseInt(e.target.value, 10) || 0)}
                      min={0}
                      className="h-10"
                    />
                    <div className="flex gap-1.5 col-span-2 sm:col-span-1">
                      <Input
                        type="number"
                        label="Peso envío"
                        tooltip="Peso de esta variante con embalaje, para calcular el envío."
                        placeholder="0.5"
                        value={variant.weight ?? ''}
                        onChange={(e) => handleVariantFieldChange(index, 'weight', parseFloat(e.target.value) || undefined)}
                        step="0.1"
                        min={0}
                        className="h-10 flex-1 min-w-0"
                      />
                      <Select
                        value={variant.weightUnit || 'kg'}
                        onValueChange={(v) => handleVariantFieldChange(index, 'weightUnit', v)}
                      >
                        <SelectTrigger className="h-10 w-16 shrink-0 mt-[22px] rounded-xl">
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
              ))}
            </div>
          )}

          {variantsError && (
            <Alert variant="error" className="text-xs">{variantsError}</Alert>
          )}

          {variantDrafts.length > 0 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handleSaveVariants()}
              disabled={isSavingVariants}
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingVariants ? 'Guardando...' : 'Guardar variantes'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
