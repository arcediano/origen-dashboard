/**
 * @component AiProductReview
 * @description Pantalla ÚNICA de revisión del alta de producto con IA (opción B,
 * decisión del humano): la ficha que preparó el asistente, en secciones
 * editables, más lo que solo el productor puede completar (precio y stock).
 * Nada se publica sin que el productor lo revise. El alta manual sigue usando
 * el wizard de 7 pasos.
 */

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, ChevronDown, Euro, FlaskConical, Images, Leaf, Package, Save, Send, Sparkles,
} from 'lucide-react';
import {
  ActionBar, Alert, AlertDescription, AlertTitle, Badge, Button, Card, CurrencyInput, Input,
  NAV_HEIGHT_MOBILE_DASHBOARD, appShellPaddingClass,
} from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import { StepBasic } from '../steps/StepBasic';
import { StepImages } from '../steps/StepImages';
import { StepNutritional } from '../steps/StepNutritional';
import { StepProduction } from '../steps/StepProduction';
import {
  defaultNutritionalInfo,
  defaultProductionInfo,
  type ProductFormData,
  type ProductImage,
} from '@/types/product';
import type { ProductDraftResponse } from '@/lib/ai-assist/product-draft';
import { summarizeDraft } from '@/lib/ai-assist/product-draft';

interface AiProductReviewProps {
  formData: ProductFormData;
  draft: ProductDraftResponse;
  completedTabs: Record<string, boolean>;
  onInputChange: (field: string, value: unknown) => void;
  onNestedChange: (section: string, field: string, value: unknown) => void;
  onImagesChange: (images: ProductImage[]) => void;
  onSave: () => void;
  isSaving: boolean;
  onPublish: () => void;
  isPublishing: boolean;
  publishError?: string | null;
  canPublish: boolean;
  /** Vuelve al formulario paso a paso conservando lo ya rellenado. */
  onOpenWizard: () => void;
}

function SectionCard({
  icon,
  title,
  description,
  aiFilled,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  aiFilled?: boolean;
  children: ReactNode;
}) {
  return (
    <Card variant="elevated" className="p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-origen-pradera/10 text-hoja-tinta">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-origen-bosque">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {aiFilled && (
          <Badge variant="leaf" size="sm" className="flex shrink-0 items-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            IA
          </Badge>
        )}
      </div>
      {children}
    </Card>
  );
}

function CollapsibleSection({
  icon,
  title,
  description,
  aiFilled,
  defaultOpen,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  aiFilled?: boolean;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `review-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <Card variant="elevated" className="p-4 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera rounded-xl"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-origen-pradera/10 text-hoja-tinta">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold text-origen-bosque">{title}</span>
            <span className="block text-sm text-muted-foreground">{description}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {aiFilled && (
            <Badge variant="leaf" size="sm" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              IA
            </Badge>
          )}
          <ChevronDown className={cn('h-5 w-5 text-text-subtle transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </span>
      </button>
      {open && (
        <div id={panelId} className="mt-5">
          {children}
        </div>
      )}
    </Card>
  );
}

export function AiProductReview({
  formData,
  draft,
  completedTabs,
  onInputChange,
  onNestedChange,
  onImagesChange,
  onSave,
  isSaving,
  onPublish,
  isPublishing,
  publishError,
  canPublish,
  onOpenWizard,
}: AiProductReviewProps) {
  const summary = useMemo(() => summarizeDraft(draft), [draft]);
  const hasProduction =
    !!draft.proposal.productionInfo.origin || !!draft.proposal.productionInfo.productionMethod;
  const hasNutrition =
    draft.labelLegible === true || draft.proposal.nutritionalInfo.isGlutenFree === true ||
    draft.proposal.nutritionalInfo.isVegan === true || draft.proposal.nutritionalInfo.isVegetarian === true;

  const missing = useMemo(() => {
    const list: string[] = [];
    if (!formData.name || formData.name.trim().length < 5) list.push('Nombre (mínimo 5 caracteres)');
    if (!formData.fullDescription || formData.fullDescription.trim().length < 100) list.push('Descripción (mínimo 100 caracteres)');
    if (!formData.categoryId) list.push('Categoría');
    if (!formData.gallery || formData.gallery.length === 0) list.push('Al menos una foto');
    if (!formData.basePrice || formData.basePrice <= 0) list.push('Precio de venta');
    return list;
  }, [formData]);

  const publishLabel = missing.length > 0 ? `Falta completar (${missing.length})` : 'Publicar';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('mx-auto max-w-3xl space-y-6', appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 64), 'lg:pb-0')}
    >
      {/* Resumen de lo que ha hecho el asistente */}
      <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-origen-bosque text-white">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-origen-bosque">Tu ficha está casi lista</h2>
            <p className="text-sm text-muted-foreground">
              Revisa lo que hemos preparado, ajusta lo que quieras y completa el precio. Nada se publica sin tu confirmación.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Campos rellenados por la IA">
          {summary.filled.map((label) => (
            <Badge key={label} variant="success" size="sm" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" aria-hidden="true" />
              {label}
            </Badge>
          ))}
        </div>

        {(summary.toReview.length > 0 || draft.notes) && (
          <Alert variant="warning">
            <AlertTitle>Revisa con atención</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 space-y-1 text-sm">
                {summary.toReview.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
                {draft.notes && (
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {draft.notes}
                  </li>
                )}
              </ul>
              <p className="mt-2 text-xs">
                Los alérgenos y la información nutricional son responsabilidad del productor: confírmalos antes de publicar.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </Card>

      <SectionCard icon={<Images className="h-5 w-5" aria-hidden="true" />} title="Fotos" description="La primera es la principal. Marca su encuadre para el catálogo.">
        <StepImages embedded gallery={formData.gallery} onImagesChange={onImagesChange} completed={completedTabs.images} />
      </SectionCard>

      <SectionCard icon={<Package className="h-5 w-5" aria-hidden="true" />} title="Información del producto" aiFilled>
        <StepBasic
          embedded
          formData={formData}
          errors={{}}
          touched={{}}
          onInputChange={onInputChange as (field: string, value: unknown) => void}
          completed={completedTabs.basic}
        />
      </SectionCard>

      <SectionCard
        icon={<Euro className="h-5 w-5" aria-hidden="true" />}
        title="Precio y stock"
        description="Esto solo lo sabes tú: la IA nunca lo propone."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Precio de venta<span className="ml-1 text-feedback-danger">*</span>
            </span>
            <CurrencyInput
              value={formData.basePrice ?? 0}
              onChange={(value) => onInputChange('basePrice', value)}
              min={0.01}
              inputSize="lg"
              className="h-12 w-full rounded-xl"
              placeholder="Ej: 24,50"
              error={!formData.basePrice || formData.basePrice <= 0 ? 'Indica el precio de venta (mayor que 0)' : undefined}
            />
          </div>
          <Input
            label="Stock actual"
            tooltip="Unidades disponibles para la venta. Se actualiza solo con los pedidos."
            type="number"
            inputMode="numeric"
            value={formData.stock ?? 0}
            onChange={(e) => onInputChange('stock', Math.max(0, parseInt(e.target.value, 10) || 0))}
            min={0}
            inputSize="lg"
          />
        </div>
        <p className="mt-4 text-xs text-text-subtle">
          Ofertas por cantidad, oferta flash, certificaciones y más ajustes están disponibles al editar el producto.
        </p>
      </SectionCard>

      <CollapsibleSection
        icon={<FlaskConical className="h-5 w-5" aria-hidden="true" />}
        title="Información nutricional"
        description="Ingredientes, alérgenos y valores por ración"
        aiFilled={hasNutrition}
        defaultOpen={hasNutrition}
      >
        <StepNutritional
          embedded
          nutritionalInfo={formData.nutritionalInfo || defaultNutritionalInfo}
          onNestedChange={onNestedChange as (section: string, field: string, value: unknown) => void}
          completed={completedTabs.nutritional}
        />
      </CollapsibleSection>

      <CollapsibleSection
        icon={<Leaf className="h-5 w-5" aria-hidden="true" />}
        title="Historia y producción"
        description="Origen y proceso de elaboración (opcional)"
        aiFilled={hasProduction}
        defaultOpen={hasProduction}
      >
        <StepProduction
          embedded
          productionInfo={formData.productionInfo || defaultProductionInfo}
          onNestedChange={onNestedChange as (section: string, field: string, value: unknown) => void}
          completed={completedTabs.production}
        />
      </CollapsibleSection>

      {publishError && (
        <Alert variant="error">
          <AlertTitle>No se ha podido publicar</AlertTitle>
          <AlertDescription>{publishError}</AlertDescription>
        </Alert>
      )}

      {missing.length > 0 && (
        <Alert variant="info">
          <AlertTitle>Para publicar falta</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Acciones — escritorio (en móvil, ActionBar fija) */}
      <div className="hidden lg:flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onOpenWizard}>
          Ver paso a paso
        </Button>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onSave}
            loading={isSaving}
            loadingText="Guardando..."
            leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onPublish}
            disabled={!canPublish || isPublishing}
            loading={isPublishing}
            loadingText="Publicando..."
            leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
          >
            {publishLabel}
          </Button>
        </div>
      </div>

      <ActionBar
        primaryAction={{
          id: 'publish',
          label: publishLabel,
          onClick: onPublish,
          disabled: !canPublish || isPublishing,
          loading: isPublishing,
          loadingText: 'Publicando...',
          leftIcon: <Send className="h-4 w-4" aria-hidden="true" />,
        }}
        secondaryActions={[
          {
            id: 'save',
            label: isSaving ? 'Guardando...' : 'Guardar',
            onClick: onSave,
            disabled: isSaving,
            loading: isSaving,
            variant: 'secondary',
            leftIcon: <Save className="h-4 w-4" aria-hidden="true" />,
          },
        ]}
      />
    </motion.div>
  );
}
