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
  PublicationRequirementsChecklist,
} from '@/app/dashboard/products/components';
import { ProductFormSteps } from '@/app/dashboard/products/components/ProductFormSteps';
import { AiAssistChat } from '@/app/dashboard/products/components/ai-onboarding/AiAssistChat';
import { ProductFormSidebar } from '@/app/dashboard/products/components/ProductFormSidebar';

import { useProductForm } from '@/hooks/useProductForm';
import { useStepTips, KEY_FACTS_BY_STEP } from '@/hooks/useStepTips';
import { useHideBottomTabBar } from '@/hooks/useHideBottomTabBar';
import { FORM_STEPS, type FormStepId } from '@/types/product';
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
import { getAiAssistQuota } from '@/lib/api/ai-assist';
import type { AiAssistQuota } from '@/lib/ai-assist/label-proposal';

// ─── Animaciones ──────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

/**
 * Cómo se crea el producto: con el asistente de IA (máquina de pasos fija
 * "Origen Assist" -- rediseño v2, 2026-10-26 -- que redirige a la ficha real
 * al terminar) o a mano con el wizard de 8 pasos.
 */
type CreateMode = 'loading' | 'ai-chat' | 'wizard';

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
    publicationStatus,
    requiredStepErrors,
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
    onVariantsChange,
    savedVariantsCount,
  } = useProductForm();

  const [mode, setMode] = useState<CreateMode>('loading');
  const [quota, setQuota] = useState<AiAssistQuota | null>(null);

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
    setMode(quota.enabled ? 'ai-chat' : 'wizard');
  }, [mode, quota]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Error al guardar', description: error, variant: 'error' });
    }
  }, [error]);

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

  const BLOCKING_STEPS: FormStepId[] = ['basic', 'images', 'pricing'];
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
        title={mode === 'ai-chat' ? 'Crea tu producto charlando' : 'Crear producto'}
        description={
          mode === 'ai-chat'
            ? 'Sube una foto y cuéntale a Origen Assist qué es tu producto (origen, elaboración, formato…). Te irá preguntando lo que falte; tú solo revisas y decides al final.'
            : 'Completa los pasos para publicar tu producto'
        }
        badgeIcon={mode === 'ai-chat' ? Sparkles : Package}
        badgeText={mode === 'ai-chat' ? 'Asistente de IA' : 'Nuevo producto'}
        tooltip={mode === 'ai-chat' ? 'Asistente de IA' : 'Creación de producto'}
        tooltipDetailed={
          mode === 'ai-chat'
            ? 'La foto le dice a Origen Assist qué aspecto tiene tu producto, pero no puede contarle su origen, cómo lo elaboras o el formato — eso solo lo sabes tú. Cuéntaselo en el chat: cuanta más información le des, mejor saldrá la ficha. Después la revisas tú antes de publicar.'
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

        {mode === 'ai-chat' && (
          <AiAssistChat
            quota={quota && quota.enabled ? { used: quota.used, total: quota.total, free: quota.free, purchased: quota.purchased } : null}
            onManual={() => setMode('wizard')}
            onCreditsPurchased={handleCreditsPurchased}
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
              {/* Las ayudas puntuales del asistente de IA por campo
                  ("Redactar con IA" en StepBasic, "Leer etiqueta con IA" en
                  StepNutritional) se quitaron del todo (petición del humano,
                  2026-10-08 para el alta manual; 2026-10-08 de nuevo para
                  extenderlo también a la edición) — ProductFormSteps ya no
                  acepta aiAssistKey/onAiAssistUsed ni los reenvía a esos
                  pasos. Si quiere usar la IA, el asistente completo (modo
                  "ai-chat", máquina de pasos "Origen Assist") sigue
                  disponible y se promociona desde los propios consejos
                  útiles del alta manual (ver useStepTips). */}
              <ProductFormSteps
                activeTab={activeTab}
                formData={formData}
                completedTabs={completedTabs}
                onInputChange={handleInputChange}
                onNestedChange={handleNestedChange}
                onImagesChange={handleImagesChange}
                onVariantsChange={onVariantsChange}
              />

              {/* Checklist de requisitos de publicación — móvil/tablet. Vive
                  dentro de la columna con scroll normal (que ya reserva
                  `appShellPaddingClass` para el ActionBar fijo) en vez de
                  justo antes del ActionBar a nivel de página: puesto ahí
                  quedaba tapado/cortado por la barra fija al no tener hueco
                  reservado debajo (hallazgo real, petición del humano,
                  2026-10-26, captura de pantalla en móvil). */}
              <div className="lg:hidden">
                <PublicationRequirementsChecklist
                  publicationStatus={publicationStatus}
                  clientMissing={requiredStepErrors}
                  onJumpToStep={handleTabChange}
                />
              </div>

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
                <PublicationRequirementsChecklist
                  publicationStatus={publicationStatus}
                  clientMissing={requiredStepErrors}
                  onJumpToStep={handleTabChange}
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
        primaryAction={
          // "Publicar" visible desde cualquier paso en cuanto se cumplen los
          // requisitos (petición del humano, 2026-10-26), no solo al llegar
          // al último paso del wizard.
          canPublish
            ? {
                id: 'primary',
                label: 'Publicar',
                onClick: handlePublish,
                disabled: isPublishing,
                loading: isPublishing,
                loadingText: 'Publicando...',
                leftIcon: <Send className="w-4 h-4" aria-hidden="true" />,
              }
            : {
                id: 'primary',
                label: isLastStep ? 'Completa todos los requisitos' : (isMobileStepBlocked ? 'Completa este paso' : 'Siguiente'),
                onClick: isLastStep ? handleSave : handleNext,
                disabled: isLastStep,
                rightIcon: !isLastStep ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : undefined,
              }
        }
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

      <CreateProductCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancel}
      />

      <SuccessPublishModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        productName={formData.name || 'Producto'}
      />

    </div>
  );
}
