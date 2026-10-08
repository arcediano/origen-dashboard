/**
 * @component StepVariants
 * @description Paso 8: Variantes del producto (estilo Shopify) — petición
 * del humano, 2026-10-08: "además del precio, se podrá configurar las
 * variantes que puede tener ese producto... se puede replicar cómo se
 * configura esto en Shopify". Alcance de esta primera versión: solo modelo
 * + edición en el dashboard, sin conectar todavía al checkout/carrito.
 *
 * Solo disponible en edición (requiere `productId` — las opciones/variantes
 * se guardan contra el producto ya creado, mismo criterio que "Ofertas por
 * cantidad"/"Oferta flash" tras la tanda 2026-10-08).
 *
 * Valor de cada opción = texto libre (igual que Shopify, sin campo de unidad
 * aparte) — si representa una cantidad (peso, volumen…), la unidad se
 * escribe dentro del propio texto ("250g", "1kg"), avisado en la propia UI.
 * Decisión del humano (misma fecha): de momento no hace falta un desplegable
 * de unidad que concatene al valor -- posible mejora futura, no para esta
 * versión (el alcance sigue siendo solo modelo + edición en dashboard).
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Input, CurrencyInput, Badge, Alert, Card } from '@arcediano/ux-library';
import {
  Boxes,
  CheckCircle,
  Sparkles,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { ProductOption, ProductVariant } from '@/types/product';
import { fetchProductById, syncProductOptions, syncProductVariants } from '@/lib/api/products';

interface StepVariantsProps {
  productId?: string;
  basePrice?: number;
  completed?: boolean;
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
  sku: string;
  price: number;
  stock: number;
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

export function StepVariants({ productId, basePrice = 0, completed }: StepVariantsProps) {
  const [isLoading, setIsLoading] = useState(!!productId);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savedOptions, setSavedOptions] = useState<ProductOption[]>([]);
  const [optionDrafts, setOptionDrafts] = useState<OptionDraft[]>([]);
  const [isSavingOptions, setIsSavingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [isSavingVariants, setIsSavingVariants] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);

  const isStepComplete = savedOptions.length > 0 && variantDrafts.length > 0;

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
          sku: variant.sku ?? '',
          price: variant.price,
          stock: variant.stock,
        })),
      );
    }
  }, [productId]);

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
          sku: '',
          price: basePrice || 0,
          stock: 0,
        }
      );
    });

    setVariantDrafts(generated);
  };

  const handleRemoveVariant = (index: number) => {
    setVariantDrafts(variantDrafts.filter((_, i) => i !== index));
  };

  const handleVariantFieldChange = (index: number, field: keyof VariantDraft, value: string | number) => {
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
        sku: v.sku || undefined,
        price: v.price,
        stock: v.stock,
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
          sku: variant.sku ?? '',
          price: variant.price,
          stock: variant.stock,
        })),
      );
    }
  };

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
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              isStepComplete ? 'bg-origen-bosque text-white' : 'bg-origen-pradera/10 text-origen-bosque',
            )}>
              {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Variantes</h2>
              <p className="text-sm text-muted-foreground truncate">Formatos, cantidades u otras opciones de venta</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {completed || isStepComplete ? (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completado
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">Opcional</Badge>
            )}
            <Badge variant="leaf" size="sm" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Paso 7 de 8
            </Badge>
          </div>
        </div>

        {!productId ? (
          <div className="text-center py-8 bg-origen-crema/20 rounded-xl border-2 border-dashed border-origen-pradera/30">
            <Boxes className="w-12 h-12 text-origen-pradera/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Guarda el producto primero</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              Las variantes (Tamaño, Formato…) se configuran una vez creado el producto — guarda este paso o publica para poder añadirlas.
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-origen-crema/40" />
            ))}
          </div>
        ) : loadError ? (
          <Alert variant="error">{loadError}</Alert>
        ) : (
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
                  <div className="space-y-2">
                    {variantDrafts.map((variant, index) => (
                      <div
                        key={variant.id ?? `${comboLabel(variant)}-${index}`}
                        className="p-3 bg-surface-alt rounded-xl border border-border-subtle grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-2 items-center"
                      >
                        <span className="text-sm font-medium text-origen-bosque truncate" title={comboLabel(variant)}>
                          {comboLabel(variant) || '—'}
                        </span>
                        <Input
                          placeholder="SKU"
                          value={variant.sku}
                          onChange={(e) => handleVariantFieldChange(index, 'sku', e.target.value)}
                          className="h-10"
                        />
                        <CurrencyInput
                          value={variant.price}
                          onChange={(v) => handleVariantFieldChange(index, 'price', v)}
                          min={0.01}
                          className="h-10"
                        />
                        <Input
                          type="number"
                          placeholder="Stock"
                          value={variant.stock}
                          onChange={(e) => handleVariantFieldChange(index, 'stock', parseInt(e.target.value, 10) || 0)}
                          min={0}
                          className="h-10"
                        />
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
        )}
      </Card>
    </motion.div>
  );
}
