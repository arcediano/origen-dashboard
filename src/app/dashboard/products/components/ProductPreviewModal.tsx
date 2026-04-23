/**
 * @file ProductPreviewModal.tsx
 * @description Modal de previsualización del producto antes de publicar.
 *
 * Muestra exactamente los datos del formulario (sin guardar en servidor).
 * Diseño similar a la ficha de marketplace: imagen + info + secciones colapsables.
 */

'use client';

import React, { useState } from 'react';
import { X, Star, Tag, Leaf, Award, CheckCircle, AlertCircle, Eye, ShoppingBag, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@arcediano/ux-library';
import { Button } from '@arcediano/ux-library';
import type { ProductFormData } from '@/types/product';

// ============================================================================
// TIPOS
// ============================================================================

export interface ProductPreviewModalProps {
  open: boolean;
  onClose: () => void;
  formData: ProductFormData;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(price?: number) {
  if (!price) return '—';
  return price.toFixed(2).replace('.', ',') + ' €';
}

function MainImage({ src, alt }: { src?: string; alt?: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-origen-crema/40">
        <Package className="w-16 h-16 text-origen-pradera/30" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || 'Imagen del producto'}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ProductPreviewModal({ open, onClose, formData }: ProductPreviewModalProps) {
  if (!open) return null;

  const mainImage = formData.gallery.find(img => img.isMain) ?? formData.gallery[0] ?? formData.mainImage;
  const gallery = formData.gallery.filter(img => !img.isMain && img.url && !img.url.startsWith('blob:'));
  const discount = formData.comparePrice && formData.comparePrice > (formData.basePrice ?? 0)
    ? Math.round(((formData.comparePrice - (formData.basePrice ?? 0)) / formData.comparePrice) * 100)
    : null;

  const hasNutritional = formData.nutritionalInfo?.calories || formData.nutritionalInfo?.allergens?.length;
  const hasProduction = formData.productionInfo?.farmName || formData.productionInfo?.origin || formData.productionInfo?.story;
  const hasCerts = formData.certifications?.length > 0;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa del producto"
    >
      <div className="relative w-full max-w-3xl bg-background rounded-2xl shadow-xl overflow-hidden my-auto">

        {/* ── Banner PREVIEW ───────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-origen-pradera px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold text-white tracking-wide uppercase">
              Vista previa — No publicado
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar vista previa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Cuerpo ───────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">

          {/* Hero: imagen + info principal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">

            {/* Imagen principal */}
            <div className="relative aspect-square sm:aspect-auto sm:min-h-[320px] bg-origen-crema/20">
              <MainImage src={mainImage?.url} alt={formData.name} />
              {discount && (
                <div className="absolute top-3 left-3 bg-feedback-danger text-white text-xs font-bold px-2 py-1 rounded-lg">
                  -{discount}%
                </div>
              )}
            </div>

            {/* Info derecha */}
            <div className="p-5 sm:p-6 flex flex-col gap-4">
              {/* Categoría */}
              {formData.categoryName && (
                <span className="text-xs text-muted-foreground uppercase tracking-widest">
                  {formData.categoryName}{formData.subcategoryName ? ` · ${formData.subcategoryName}` : ''}
                </span>
              )}

              {/* Nombre */}
              <h2 className="text-xl sm:text-2xl font-bold text-origen-bosque leading-tight">
                {formData.name || <span className="text-muted-foreground italic">Sin nombre</span>}
              </h2>

              {/* Descripción corta */}
              {formData.shortDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {formData.shortDescription}
                </p>
              )}

              {/* Precio */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-origen-pradera">
                  {formatPrice(formData.basePrice)}
                </span>
                {formData.comparePrice && formData.comparePrice > (formData.basePrice ?? 0) && (
                  <span className="text-base text-text-subtle line-through">
                    {formatPrice(formData.comparePrice)}
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  formData.stock === 0 ? 'bg-feedback-danger' :
                  formData.stock <= formData.lowStockThreshold ? 'bg-amber-500' : 'bg-feedback-success'
                )} />
                <span className="text-xs text-muted-foreground">
                  {formData.stock === 0 ? 'Agotado' :
                   formData.stock <= formData.lowStockThreshold ? `Stock bajo (${formData.stock} uds)` :
                   `Disponible (${formData.stock} uds)`}
                </span>
              </div>

              {/* Tags */}
              {formData.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.slice(0, 6).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 text-[10px] bg-origen-pradera/10 text-origen-pradera px-2 py-0.5 rounded-full border border-origen-pradera/20">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Badges de dietas especiales */}
              {(formData.nutritionalInfo?.isVegan || formData.nutritionalInfo?.isGlutenFree || formData.nutritionalInfo?.isVegetarian) && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.nutritionalInfo.isVegan && (
                    <Badge variant="leaf" size="sm">🌱 Vegano</Badge>
                  )}
                  {formData.nutritionalInfo.isVegetarian && !formData.nutritionalInfo.isVegan && (
                    <Badge variant="leaf" size="sm">🥦 Vegetariano</Badge>
                  )}
                  {formData.nutritionalInfo.isGlutenFree && (
                    <Badge variant="leaf" size="sm">🌾 Sin gluten</Badge>
                  )}
                  {formData.nutritionalInfo.isLactoseFree && (
                    <Badge variant="leaf" size="sm">🥛 Sin lactosa</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Galería adicional ──────────────────────────────────────────── */}
          {gallery.length > 0 && (
            <div className="px-5 sm:px-6 py-4 border-t border-border">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.slice(0, 6).map(img => (
                  <div key={img.id} className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-border bg-surface-alt">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Descripción completa ───────────────────────────────────────── */}
          {formData.fullDescription && (
            <div className="px-5 sm:px-6 py-5 border-t border-border space-y-2">
              <h3 className="text-sm font-semibold text-origen-bosque flex items-center gap-2">
                <Package className="w-4 h-4 text-origen-pradera" />
                Descripción
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {formData.fullDescription}
              </p>
            </div>
          )}

          {/* ── Certificaciones ─────────────────────────────────────────────── */}
          {hasCerts && (
            <div className="px-5 sm:px-6 py-5 border-t border-border space-y-3">
              <h3 className="text-sm font-semibold text-origen-bosque flex items-center gap-2">
                <Award className="w-4 h-4 text-origen-pradera" />
                Certificaciones
              </h3>
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map(cert => (
                  <div
                    key={cert.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-origen-pastel/30 rounded-xl border border-origen-pradera/20"
                  >
                    {cert.verified
                      ? <CheckCircle className="w-3.5 h-3.5 text-origen-hoja shrink-0" />
                      : <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    }
                    <span className="text-xs font-medium text-origen-bosque">{cert.name}</span>
                    {cert.issuingBody && (
                      <span className="text-[10px] text-muted-foreground">· {cert.issuingBody}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Info nutricional resumida ────────────────────────────────────── */}
          {hasNutritional && (
            <div className="px-5 sm:px-6 py-5 border-t border-border space-y-3">
              <h3 className="text-sm font-semibold text-origen-bosque flex items-center gap-2">
                <Leaf className="w-4 h-4 text-origen-pradera" />
                Información nutricional
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Calorías',   value: formData.nutritionalInfo?.calories,   unit: 'kcal' },
                  { label: 'Proteínas',  value: formData.nutritionalInfo?.protein,    unit: 'g' },
                  { label: 'Hidratos',   value: formData.nutritionalInfo?.carbohydrates, unit: 'g' },
                  { label: 'Grasas',     value: formData.nutritionalInfo?.totalFat,   unit: 'g' },
                ].filter(m => m.value).map(m => (
                  <div key={m.label} className="p-3 bg-surface-alt rounded-xl border border-border text-center">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-base font-bold text-origen-bosque mt-0.5">{m.value} <span className="text-xs font-normal">{m.unit}</span></p>
                  </div>
                ))}
              </div>
              {formData.nutritionalInfo?.allergens?.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Alérgenos: </span>
                  {formData.nutritionalInfo.allergens.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* ── Info de producción ───────────────────────────────────────────── */}
          {hasProduction && (
            <div className="px-5 sm:px-6 py-5 border-t border-border space-y-2">
              <h3 className="text-sm font-semibold text-origen-bosque flex items-center gap-2">
                <Leaf className="w-4 h-4 text-origen-pradera" />
                Producción
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {formData.productionInfo?.farmName && (
                  <div><span className="text-muted-foreground">Granja: </span><span className="font-medium">{formData.productionInfo.farmName}</span></div>
                )}
                {formData.productionInfo?.origin && (
                  <div><span className="text-muted-foreground">Origen: </span><span className="font-medium">{formData.productionInfo.origin}</span></div>
                )}
                {formData.productionInfo?.productionMethod && (
                  <div className="sm:col-span-2"><span className="text-muted-foreground">Método: </span><span className="font-medium">{formData.productionInfo.productionMethod}</span></div>
                )}
              </div>
              {formData.productionInfo?.story && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-1 italic">
                  "{formData.productionInfo.story}"
                </p>
              )}
            </div>
          )}

          {/* ── Footer con acciones ─────────────────────────────────────────── */}
          <div className="sticky bottom-0 bg-background border-t border-border px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Esta es la vista que verán los compradores</span>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar vista previa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
