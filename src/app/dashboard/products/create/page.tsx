/**
 * @page CreateProductPage
 * @description Página de creación de productos.
 */

'use client';

import { Package, ChevronLeft, ChevronRight, Save, Send, RefreshCw, Sparkles, X } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

import { PageHeader } from '@/app/dashboard/components/PageHeader';
import {
  CreateProductProgress,
  CreateProductNavigation,
  CreateProductCancelDialog,
  SuccessPublishModal,
} from '@/app/dashboard/products/components';
import { ProductFormSteps } from '@/app/dashboard/products/components/ProductFormSteps';
import { AiProductIntake, type IntakeResult } from '@/app/dashboard/products/components/ai-onboarding/AiProductIntake';
import { AiProductReview } from '@/app/dashboard/products/components/ai-onboarding/AiProductReview';
import { ProductFormSidebar } from '@/app/dashboard/products/components/ProductFormSidebar';

import { useProductForm, discardLocalProductDraft } from '@/hooks/useProductForm';
import { useStepTips, KEY_FACTS_BY_STEP } from '@/hooks/useStepTips';
import { useHideBottomTabBar } from '@/hooks/useHideBottomTabBar';
import { FORM_STEPS, defaultNutritionalInfo, type FormStepId, type ProductImage } from '@/types/product';
import {
  toast,
  appShellPaddingClass,
  appShellBottomOffsetClass,
  NAV_HEIGHT_MOBILE_DASHBOARD,
  ActionBar,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
} from '@arcediano/ux-library';
import { useCallback, useEffect, useState } from 'react';
import { getAiAssistQuota, improveText } from '@/lib/api/ai-assist';
import { fetchCategoriesTree } from '@/lib/api/categories';
import { buildFollowUpNotes, draftToPatches, type FollowUpField, type ProductDraftResponse } from '@/lib/ai-assist/product-draft';
import type { AiAssistQuota } from '@/lib/ai-assist/label-proposal';
import { AiFollowUpQuestions } from '@/app/dashboard/products/components/ai-onboarding/AiFollowUpQuestions';

/** Las 3 marcas dietéticas de followUpQuestions responden "Sí"/"No": se guardan como boolean. */
const BOOLEAN_FOLLOW_UP_FIELDS = new Set<FollowUpField>([
  'nutritionalInfo.isGlutenFree',
  'nutritionalInfo.isVegan',
  'nutritionalInfo.isVegetarian',
]);

// ─── Animaciones ──────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

/**
 * Cómo se crea el producto: con el asistente de IA (pantalla de entrada +
 * pantalla única de revisión, opción B) o a mano con el wizard de 8 pasos.
 */
type CreateMode = 'loading' | 'ai-intake' | 'ai-review' | 'wizard';

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CreateProductPage() {
  const {
    formData,
    activeTab,
    setActiveTab,
    completedTabs,
    error,
    isSaving,
    isAutoSaving,
    lastSaved,
    isPublishing,
    publishStatus,
    publishError,
    showCancelDialog,
    setShowCancelDialog,
    showSuccessModal,
    setShowSuccessModal,
    allStepsCompleted,
    hasCertifications,
    certificationsApproved,
    hasPendingManualCerts,
    currentStepErrors,
    handleInputChange,
    handleNestedChange,
    handleImagesChange,
    handleSave,
    handlePublish,
    handleCancel,
    aiAssistKey,
    aiAssistUsedUnsaved,
    markAiAssistUsed,
    hasVariants,
    onVariantsChange,
  } = useProductForm();

  const [mode, setMode] = useState<CreateMode>('loading');
  const [quota, setQuota] = useState<AiAssistQuota | null>(null);
  const [draft, setDraft] = useState<ProductDraftResponse | null>(null);
  // Entre el borrador de la IA y la revisión final: si quedan campos que no
  // pudo determinar, se preguntan aquí para que la revisión llegue completa.
  const [pendingFollowUps, setPendingFollowUps] = useState<ProductDraftResponse['followUpQuestions']>([]);

  useEffect(() => {
    let cancelled = false;
    getAiAssistQuota()
      .then((q) => !cancelled && setQuota(q))
      // Sin permiso o servicio caído: alta manual, como siempre
      .catch(() => !cancelled && setQuota({ enabled: false, used: 0, total: 0 }));
    return () => {
      cancelled = true;
    };
  }, []);

  // Tras comprar créditos: el cupo total ya incluye los nuevos créditos.
  const handleCreditsPurchased = useCallback(() => {
    getAiAssistQuota()
      .then(setQuota)
      .catch(() => {});
  }, []);

  // Con el cupo cargado se decide el modo inicial: si el asistente está
  // activo, siempre entra primero por ahí — aunque el cupo gratis esté
  // agotado, la propia pantalla del asistente es quien debe avisar de eso y
  // ofrecer comprar créditos (si se salta aquí a mano, esa pantalla nunca
  // llega a verse). Un borrador local a medias se ofrece continuar o
  // descartar dentro de esa misma pantalla, no se salta el asistente.
  useEffect(() => {
    if (mode !== 'loading' || !quota) return;
    setMode(quota.enabled ? 'ai-intake' : 'wizard');
  }, [mode, quota]);

  const handleAiDraft = useCallback(
    async ({ response, productPhoto }: IntakeResult) => {
      let categories: Awaited<ReturnType<typeof fetchCategoriesTree>> = [];
      try {
        categories = await fetchCategoriesTree();
      } catch {
        /* sin nombres de categoría: se aplica el id y el productor puede reelegir */
      }
      const patches = draftToPatches(response, categories, defaultNutritionalInfo);
      for (const patch of patches) {
        if (patch.kind === 'field') handleInputChange(patch.field, patch.value);
        else handleNestedChange(patch.section, patch.field, patch.value);
      }
      const photo: ProductImage = {
        id: `temp-${Date.now()}-0-${Math.random().toString(36).substring(2, 7)}`,
        url: URL.createObjectURL(productPhoto),
        file: productPhoto,
        isMain: true,
        sortOrder: 0,
        uploading: false,
        progress: 0,
        size: productPhoto.size,
        type: productPhoto.type,
      };
      handleImagesChange([photo]);
      markAiAssistUsed();
      setQuota((q) => (q ? { ...q, used: response.quota.used, total: response.quota.total } : q));
      setDraft(response);
      // Si a la IA le quedó algo pendiente de esos campos, se pregunta antes
      // de pasar a revisión — así la pantalla de revisión llega ya completa.
      // Se pasa ya a la pantalla de revisión (el producto en creación); las preguntas
      // salen encima. Si se quedara en el intake, el formulario ya relleno se leería
      // como un "borrador sin terminar" cuando es el producto que se está creando.
      setMode('ai-review');
      if (response.followUpQuestions.length > 0) {
        setPendingFollowUps(response.followUpQuestions);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [handleInputChange, handleNestedChange, handleImagesChange, markAiAssistUsed],
  );

  const handleFollowUpComplete = useCallback(
    async (answers: Partial<Record<FollowUpField, string>>) => {
      for (const [field, value] of Object.entries(answers) as [FollowUpField, string][]) {
        // La maduración no tiene campo propio: va dentro del proceso de elaboración (más abajo).
        if (field === 'productionInfo.maturationTime') continue;
        const [section, key] = field.split('.') as ['nutritionalInfo' | 'productionInfo', string];
        const finalValue = BOOLEAN_FOLLOW_UP_FIELDS.has(field) ? value === 'Sí' : value;
        handleNestedChange(section, key, finalValue);
      }
      const maturation = answers['productionInfo.maturationTime']?.trim();
      if (maturation) {
        const process = (answers['productionInfo.artisanProcess'] ?? formData.productionInfo.artisanProcess ?? '').trim();
        handleNestedChange('productionInfo', 'artisanProcess', `${process}<p>Tiempo de maduración: ${maturation.replace(/</g, '&lt;')}</p>`);
      }
      setPendingFollowUps([]);

      // Si se respondió algo, se reescribe la descripción para que quede un texto
      // coherente con esos datos en vez de dejarlos sueltos solo en campos
      // estructurados — mismo asistente ya usado en "Redactar con IA", mismo
      // assistKey (ya consumió su cupo con el borrador inicial, esto no cuenta más).
      const notes = buildFollowUpNotes(answers);
      if (notes && aiAssistKey) {
        setMode('loading');
        try {
          const result = await improveText(aiAssistKey, {
            name: formData.name,
            fullDescription: formData.fullDescription,
            notes,
          });
          handleInputChange('fullDescription', result.proposal.fullDescription);
        } catch {
          // Best-effort: si falla, se sigue con los campos estructurados ya
          // rellenados y la descripción tal cual la dejó el borrador inicial.
        }
      }

      setMode('ai-review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [handleNestedChange, handleInputChange, formData.name, formData.fullDescription, formData.productionInfo.artisanProcess, aiAssistKey],
  );

  useEffect(() => {
    if (error) {
      toast({ title: 'Error al guardar', description: error, variant: 'error' });
    }
  }, [error]);

  // Si el productor ha usado el asistente de IA en un producto que aún no ha
  // guardado y cierra/recarga la pestaña, el navegador pide confirmación (el
  // texto lo pone el navegador; el aviso detallado va en el diálogo de cancelar).
  useEffect(() => {
    if (!aiAssistUsedUnsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [aiAssistUsedUnsaved]);

  const tips = useStepTips(activeTab, formData);

  const [showMobileErrors, setShowMobileErrors] = useState(false);

  const handleTabChange = (tab: FormStepId) => {
    setShowMobileErrors(false);
    setActiveTab(tab);
  };

  // Navegación por pasos para el ActionBar móvil — mismo patrón que
  // products/[id]/edit/page.tsx (CreateProductNavigation ya no reimplementa
  // su propia barra móvil, solo el bloque de escritorio).
  const currentIndex = FORM_STEPS.findIndex(s => s.id === activeTab);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === FORM_STEPS.length - 1;
  const prevStep = !isFirstStep ? FORM_STEPS[currentIndex - 1].id as FormStepId : null;
  const nextStep = !isLastStep ? FORM_STEPS[currentIndex + 1].id as FormStepId : null;
  const canPublish = allStepsCompleted && (!hasCertifications || certificationsApproved);

  const BLOCKING_STEPS: FormStepId[] = ['basic', 'images', 'pricing', 'inventory'];
  const isMobileStepBlocked = BLOCKING_STEPS.includes(activeTab) && currentStepErrors.length > 0;

  const handlePrev = () => {
    setShowMobileErrors(false);
    if (prevStep) { handleTabChange(prevStep); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const handleNext = () => {
    if (isMobileStepBlocked) {
      setShowMobileErrors(true);
      return;
    }
    setShowMobileErrors(false);
    if (nextStep) { handleTabChange(nextStep); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  // Esta página renderiza su propia ActionBar móvil (fixed bottom-0) — oculta
  // el BottomTabBar global para que no se pinte encima de ella.
  useHideBottomTabBar();

  return (
    <div className="w-full">
      {/* Elementos decorativos — solo desktop */}
      <div className="hidden lg:block fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="hidden lg:block fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <PageHeader
        title={mode === 'ai-intake' ? 'Crea tu producto en un minuto' : 'Crear producto'}
        description={
          mode === 'ai-intake'
            ? 'Sube una foto y cuéntanos qué es con tus palabras (origen, elaboración, formato…). Preparamos la ficha completa combinando ambas cosas; tú solo la revisas y decides.'
            : mode === 'ai-review'
              ? 'Revisa la ficha y publícala'
              : 'Completa los pasos para publicar tu producto'
        }
        badgeIcon={mode === 'ai-intake' ? Sparkles : Package}
        badgeText={mode === 'ai-intake' ? 'Asistente de IA' : 'Nuevo producto'}
        tooltip={mode === 'ai-intake' ? 'Asistente de IA' : 'Creación de producto'}
        tooltipDetailed={
          mode === 'ai-intake'
            ? 'La foto le dice a la IA qué aspecto tiene tu producto, pero no puede contarle su origen, cómo lo elaboras o el formato — eso solo lo sabes tú. Escribe unas líneas con esos detalles: cuanta más información le des, mejor saldrá la ficha. Después la revisas tú antes de publicar.'
            : 'Completa todos los pasos para publicar tu producto en el catálogo'
        }
        showBackButton
        onBack={() => setShowCancelDialog(true)}
        actions={
          <div className="flex items-center gap-2">
            {/* Oculto en móvil: PageHeader coloca `actions` en un contenedor
                shrink-0 sin wrap junto al título -- este texto es el ancho
                justo para desbordar/aplastar el título a 375px. El estado de
                guardado ya se ve en el botón "Guardar" del ActionBar móvil. */}
            {lastSaved && (
              <span className="hidden sm:inline text-xs text-text-subtle">
                Último guardado: {lastSaved.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        }
      />

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {mode === 'loading' && (
          <div className="mx-auto max-w-2xl space-y-4" aria-busy="true" aria-label="Cargando">
            <div className="mx-auto h-8 w-2/3 animate-pulse rounded-xl bg-origen-pastel" />
            <div className="h-64 animate-pulse rounded-2xl bg-origen-pastel/70" />
          </div>
        )}

        {mode === 'ai-intake' && (
          <AiProductIntake
            assistKey={aiAssistKey}
            quota={quota && quota.enabled ? { used: quota.used, total: quota.total, free: quota.free, purchased: quota.purchased } : null}
            onDraft={handleAiDraft}
            onManual={() => setMode('wizard')}
            onCreditsPurchased={handleCreditsPurchased}
            pendingDraft={
              formData.name || formData.gallery.length > 0
                ? {
                    name: formData.name,
                    onResume: () => setMode('wizard'),
                    onDiscard: () => {
                      discardLocalProductDraft();
                      window.location.reload();
                    },
                  }
                : undefined
            }
          />
        )}

        {mode === 'ai-review' && draft && (
          <AiProductReview
            formData={formData}
            draft={draft}
            completedTabs={completedTabs}
            onInputChange={handleInputChange}
            onNestedChange={handleNestedChange}
            onImagesChange={handleImagesChange}
            onSave={handleSave}
            isSaving={isSaving}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            publishError={publishError}
            canPublish={allStepsCompleted}
            onOpenWizard={() => setMode('wizard')}
          />
        )}

        {mode === 'wizard' && (
          <>
          {/* Panel de pasos — en escritorio (≥lg) vive en la columna lateral,
              encima de "Consejos útiles" (ver más abajo); aquí solo para
              móvil/tablet, donde ya era correcto. */}
          <div className="lg:hidden">
            <CreateProductProgress
              currentTab={activeTab}
              completedTabs={completedTabs}
              onTabChange={handleTabChange}
            />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-6"
          >
            {/* padding inferior móvil — reserva el alto del ActionBar fijo.
                ActionBar (showOnDesktop=false, por defecto) solo se oculta a
                partir de lg: (1024px) -- no de sm: -- así que el padding y el
                wrapper de CreateProductNavigation de abajo deben cancelarse/
                mostrarse en el MISMO breakpoint (lg:) o queda un hueco de
                640-1023px sin espacio reservado mientras la ActionBar sigue
                fija abajo, tapando el formulario. */}
            <div className={`lg:col-span-2 space-y-6 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 64)} lg:pb-0`}>
              {/* Sin aiAssistKey/onAiAssistUsed aquí (petición del humano,
                  2026-10-08): en el alta manual no se muestran las ayudas
                  puntuales del asistente de IA por campo ("Redactar con IA"
                  en StepBasic, "Leer etiqueta con IA" en StepNutritional) —
                  si quiere usar la IA, el asistente completo (modo
                  "ai-intake") sigue disponible y ahora se promociona desde
                  los propios consejos útiles del alta manual (ver
                  useStepTips). aiAssistKey se sigue usando para el flujo
                  de revisión tras el borrador de IA (más abajo en este
                  fichero), solo se ha dejado de pasar a este wizard manual. */}
              <ProductFormSteps
                activeTab={activeTab}
                formData={formData}
                completedTabs={completedTabs}
                onInputChange={handleInputChange}
                onNestedChange={handleNestedChange}
                onImagesChange={handleImagesChange}
                hasVariants={hasVariants}
                onVariantsChange={onVariantsChange}
              />

              {/* Navegación de pasos — sólo visible en ≥ lg; hasta ahí usa ActionBar */}
              <div className="hidden lg:block">
                <CreateProductNavigation
                  currentTab={activeTab}
                  onTabChange={handleTabChange}
                  completedTabs={completedTabs}
                  currentStepErrors={currentStepErrors}
                  onSave={handleSave}
                  isSaving={isSaving}
                  allStepsCompleted={allStepsCompleted}
                  hasCertifications={hasCertifications}
                  certificationsApproved={certificationsApproved}
                  hasPendingManualCerts={hasPendingManualCerts}
                  onPublish={handlePublish}
                  isPublishing={isPublishing}
                  publishStatus={publishStatus}
                  publishError={publishError}
                />
              </div>
            </div>

            {/* Columna lateral de escritorio: panel de pasos + consejos
                útiles apilados dentro de un único `sticky` (petición del
                humano, 2026-10-08) — dos `sticky` independientes nunca
                alinean bien sus offsets porque el panel de pasos cambia de
                alto al condensarse con el scroll. */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-16 space-y-4">
                <CreateProductProgress
                  currentTab={activeTab}
                  completedTabs={completedTabs}
                  onTabChange={handleTabChange}
                  embedded
                />
                <ProductFormSidebar
                  tips={tips}
                  keyFact={KEY_FACTS_BY_STEP[activeTab]}
                  embedded
                />
              </div>
            </div>
          </motion.div>
          </>
        )}
      </div>

      {/* Panel de errores móvil — aparece sobre el ActionBar */}
      {mode === 'wizard' && showMobileErrors && currentStepErrors.length > 0 && (
        <div className={`sm:hidden fixed ${appShellBottomOffsetClass(NAV_HEIGHT_MOBILE_DASHBOARD, 40)} left-0 right-0 z-50 mx-4`}>
          <Alert
            variant="error"
            className="shadow-lg"
            trailing={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileErrors(false)}
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            }
          >
            <AlertTitle>Completa los campos obligatorios</AlertTitle>
            <AlertDescription>
              <ul className="space-y-1 mt-1">
                {currentStepErrors.map((err, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-feedback-danger shrink-0" aria-hidden="true" />
                    {err}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ActionBar móvil — navegación entre pasos con pulgar */}
      {mode === 'wizard' && (
      <ActionBar
        primaryAction={{
          id: 'primary',
          label: isLastStep ? (!canPublish ? 'Completa todos los pasos' : 'Publicar') : (isMobileStepBlocked ? 'Completa este paso' : 'Siguiente'),
          onClick: isLastStep ? handlePublish : handleNext,
          disabled: isLastStep ? (isPublishing || !canPublish) : false,
          loading: isLastStep ? isPublishing : false,
          loadingText: 'Publicando...',
          rightIcon: !isLastStep ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : undefined,
          leftIcon: isLastStep ? <Send className="w-4 h-4" aria-hidden="true" /> : undefined,
        }}
        secondaryActions={[
          {
            id: 'prev',
            label: 'Anterior',
            onClick: handlePrev,
            disabled: isFirstStep,
            variant: 'secondary',
            leftIcon: <ChevronLeft className="w-4 h-4" aria-hidden="true" />,
          },
          {
            id: 'save',
            label: isSaving ? 'Guardando...' : 'Guardar',
            onClick: handleSave,
            disabled: isSaving,
            loading: isSaving,
            variant: 'secondary',
            leftIcon: isSaving
              ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              : <Save className="w-4 h-4" aria-hidden="true" />,
          },
        ]}
      />
      )}

      <AiFollowUpQuestions
        open={pendingFollowUps.length > 0}
        questions={pendingFollowUps}
        onComplete={handleFollowUpComplete}
      />

      <CreateProductCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancel}
        aiAssistUsed={aiAssistUsedUnsaved}
      />

      <SuccessPublishModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        productName={formData.name || 'Producto'}
      />

    </div>
  );
}
