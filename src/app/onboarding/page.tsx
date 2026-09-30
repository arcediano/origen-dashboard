// 📁 /src/app/onboarding/page.tsx
/**
 * @page Onboarding de productores (ADR-020, 5 pasos)
 *
 * 1 Ubicación e identidad legal · 2 Perfil visual · 3 Envíos ·
 * 4 Documentación y certificaciones · 5 Pagos.
 *
 * - `?step=N` abre el wizard en ese paso (los emails de recordatorio lo usan).
 * - Cada paso se guarda al continuar y se rehidrata entero desde
 *   `GET onboarding/data`, así que recargar no pierde nada.
 * - Al terminar se muestra una pantalla con lo que falta para publicar.
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, ConfirmDialog } from '@arcediano/ux-library';
import { useAuth } from '@/contexts/AuthContext';
import { GatewayError } from '@/lib/api/client';
import {
  completeOnboarding as apiCompleteOnboarding,
  getMyReadiness,
  getShippingCoverage,
  loadOnboardingData,
  type ProducerReadinessReport,
} from '@/lib/api/onboarding';
import { hydrateOnboardingForm } from '@/lib/onboarding/hydrate';
import { saveOnboardingStep } from '@/lib/onboarding/save-step';
import {
  ONBOARDING_STEPS,
  ONBOARDING_TOTAL_STEPS,
  getMaxReachableIndex,
  normalizeCompletedSteps,
  parseStepParam,
  resolveInitialStepIndex,
} from '@/lib/onboarding/steps';
import { INITIAL_FORM_DATA, type OnboardingFormData, type ShippingCoverage } from '@/lib/onboarding/types';
import { issuesToFieldErrors, validateStep } from '@/lib/onboarding/validation';
import { WizardProgress } from '@/components/shared/wizard-progress';
import { MobileNavBar } from '@/components/features/onboarding/components/MobileNavBar';
import { OnboardingDone } from '@/components/features/onboarding/components/OnboardingDone';
import { StepValidationPanel } from '@/components/features/onboarding/components/StepValidationPanel';
import { EnhancedStep1Location } from '@/components/features/onboarding/components/steps/step-location';
import { EnhancedStep2Visual } from '@/components/features/onboarding/components/steps/step-visual';
import { EnhancedStep3Shipping } from '@/components/features/onboarding/components/steps/step-shipping';
import { EnhancedStep4Documents } from '@/components/features/onboarding/components/steps/step-documents';
import { EnhancedStep5Payments } from '@/components/features/onboarding/components/steps/step-stripe';
import { Camera, Clock, CreditCard, FileText, MapPin, Truck } from 'lucide-react';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const STEP_ICONS = [MapPin, Camera, Truck, FileText, CreditCard];

const WIZARD_STEPS = ONBOARDING_STEPS.map((step, i) => {
  const Icon = STEP_ICONS[i];
  return { id: String(step.id), label: step.label, icon: <Icon className="h-4 w-4" /> };
});

function getUserFriendlyError(error: unknown, fallback = 'Error inesperado. Inténtalo de nuevo.'): string {
  if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
    return 'No se pudo conectar al servidor. Comprueba tu conexión a internet e inténtalo de nuevo.';
  }
  if (error instanceof GatewayError) {
    switch (error.status) {
      case 400:
      case 422:
        return error.message || 'Algunos campos no son válidos. Revísalos e inténtalo de nuevo.';
      case 401:
        return 'Tu sesión ha expirado. Recarga la página e inicia sesión de nuevo.';
      case 403:
        return 'No tienes permiso para realizar esta acción.';
      case 413:
        return 'El archivo supera el tamaño máximo permitido. Prueba con un archivo más pequeño.';
      case 429:
        return 'Demasiadas peticiones. Espera unos segundos e inténtalo de nuevo.';
      case 500:
      case 502:
      case 503:
        return 'Error temporal del servidor. Inténtalo de nuevo en unos momentos.';
      default:
        return error.message || fallback;
    }
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

const COVERAGE_STEP_INDEX = 2;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const redirectToLoginOnExpiredSession = useCallback(() => {
    const message = encodeURIComponent('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
    router.replace(`/auth/login?reason=expired&message=${message}`);
  }, [router]);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData>(INITIAL_FORM_DATA);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [backendCurrentStep, setBackendCurrentStep] = useState<number | null>(null);
  /** Pasos en los que el productor ya intentó continuar (a partir de ahí se muestran los errores). */
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [readiness, setReadiness] = useState<ProducerReadinessReport | null | undefined>(undefined);

  // Cobertura de Origen (paso 3)
  const [coverage, setCoverage] = useState<ShippingCoverage | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [coverageError, setCoverageError] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);

  // ── Navegación y URL ──────────────────────────────────────────────────────

  const syncUrl = useCallback((index: number) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(index + 1));
    window.history.replaceState(window.history.state, '', url.toString());
  }, []);

  const goToStep = useCallback(
    (index: number, dir?: number) => {
      const bounded = Math.max(0, Math.min(index, ONBOARDING_TOTAL_STEPS - 1));
      setDirection(dir ?? (bounded >= currentStep ? 1 : -1));
      setCurrentStep(bounded);
      setSaveError(null);
      syncUrl(bounded);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentStep, syncUrl],
  );

  // ── Carga inicial (rehidratación completa) ────────────────────────────────

  useEffect(() => {
    const urlStep = typeof window !== 'undefined'
      ? parseStepParam(new URLSearchParams(window.location.search).get('step'))
      : null;

    loadOnboardingData()
      .then((res) => {
        const d = res?.data;
        const completed = normalizeCompletedSteps(d?.onboarding?.completedSteps);
        if (d) {
          setFormData((prev) => hydrateOnboardingForm(d, prev));
          setCompletedSteps(completed);
          setBackendCurrentStep(d.onboarding?.currentStep ?? null);
        }
        const index = resolveInitialStepIndex({
          urlStep,
          currentStep: d?.onboarding?.currentStep,
          completedSteps: completed,
        });
        setCurrentStep(index);
        syncUrl(index);
      })
      .catch((error: unknown) => {
        if (error instanceof GatewayError && error.status === 401) {
          redirectToLoginOnExpiredSession();
          return;
        }
        // Primer acceso — sin datos guardados: se empieza por el paso indicado o el 1.
        if (urlStep) setCurrentStep(0);
      })
      .finally(() => setIsLoading(false));
  }, [redirectToLoginOnExpiredSession, syncUrl]);

  // ── Cobertura de Origen: se consulta cada vez que se entra en el paso 3 ──

  const loadCoverage = useCallback(async () => {
    setCoverage(null);
    setCoverageLoading(true);
    setCoverageError(false);
    try {
      setCoverage(await getShippingCoverage());
    } catch (error) {
      if (error instanceof GatewayError && error.status === 401) {
        redirectToLoginOnExpiredSession();
        return;
      }
      setCoverageError(true);
    } finally {
      setCoverageLoading(false);
    }
  }, [redirectToLoginOnExpiredSession]);

  useEffect(() => {
    if (!isLoading && !done && currentStep === COVERAGE_STEP_INDEX) void loadCoverage();
  }, [currentStep, isLoading, done, loadCoverage]);

  // Aviso "Paso guardado": desaparece solo
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // El foco pasa al título al cambiar de paso (lectores de pantalla y teclado)
  useEffect(() => {
    if (!isLoading && !done) titleRef.current?.focus({ preventScroll: true });
  }, [currentStep, isLoading, done]);

  /**
   * Refresco acotado al estado de Stripe del paso 5. No reutiliza el cargador
   * completo: ese restaura el paso y reescribe todo el formulario, pisando
   * ediciones sin guardar. Solo toca `stripeConnected`/`stripeAccountId` (datos
   * que manda el servidor; el webhook de Stripe es su única fuente de verdad);
   * `acceptTerms` es una casilla local que no debe revertirse.
   */
  const refreshStripeState = useCallback(async () => {
    try {
      const res = await loadOnboardingData();
      const payment = res?.data?.payment;
      if (!payment) return;
      setFormData((prev) => ({
        ...prev,
        step5: {
          ...prev.step5,
          stripeConnected: payment.stripeConnected ?? prev.step5.stripeConnected,
          stripeAccountId: payment.stripeAccountId ?? prev.step5.stripeAccountId,
        },
      }));
    } catch {
      // Refresco en segundo plano: un fallo puntual no debe interrumpir al productor.
    }
  }, []);

  // ── Validación del paso actual ────────────────────────────────────────────

  const issues = useMemo(() => validateStep(currentStep, formData, { coverage }), [currentStep, formData, coverage]);
  const isStepValid = issues.length === 0;
  const showErrors = Boolean(attempted[currentStep]);
  const fieldErrors = useMemo(() => (showErrors ? issuesToFieldErrors(issues) : {}), [showErrors, issues]);

  const focusField = useCallback((fieldId?: string) => {
    if (typeof document === 'undefined') return;
    const root = document.querySelector('[data-onboarding-step-content]');
    const target =
      (fieldId ? document.getElementById(fieldId) : null) ??
      root?.querySelector<HTMLElement>('[aria-invalid="true"], input:not([readonly]), textarea, button[role="combobox"]') ??
      null;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.focus({ preventScroll: true });
  }, []);

  // ── Guardado ──────────────────────────────────────────────────────────────

  const persistStep = useCallback(
    async (stepIndex: number) => {
      const patch = await saveOnboardingStep(stepIndex, formData);
      setFormData((prev) => ({ ...prev, ...patch }));
      setCompletedSteps((prev) => normalizeCompletedSteps([...prev, stepIndex + 1]));
      setBackendCurrentStep((prev) => Math.min(ONBOARDING_TOTAL_STEPS, Math.max(prev ?? 1, stepIndex + 2)));
    },
    [formData],
  );

  const handleError = useCallback(
    (error: unknown, fallback: string) => {
      console.error('[Onboarding]', error);
      if (error instanceof GatewayError && error.status === 401) {
        redirectToLoginOnExpiredSession();
        return;
      }
      setSaveError(getUserFriendlyError(error, fallback));
    },
    [redirectToLoginOnExpiredSession],
  );

  const handleNext = async () => {
    if (currentStep >= ONBOARDING_TOTAL_STEPS - 1) return;
    if (!isStepValid) {
      // El botón no está deshabilitado (en móvil, en una barra fija, no daría feedback):
      // se muestran los errores junto a cada campo y se lleva al primero pendiente.
      setAttempted((prev) => ({ ...prev, [currentStep]: true }));
      focusField(issues[0]?.fieldId);
      return;
    }
    setIsSubmitting(true);
    setSaveError(null);
    try {
      await persistStep(currentStep);
      setNotice(`Paso ${currentStep + 1} guardado`);
      goToStep(currentStep + 1, 1);
    } catch (error) {
      handleError(error, 'Error al guardar. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) goToStep(currentStep - 1, -1);
  };

  const maxReachable = getMaxReachableIndex(completedSteps, backendCurrentStep);

  const handleStepClick = (id: string) => {
    const index = Number(id) - 1;
    if (index === currentStep || index > maxReachable) return;
    goToStep(index);
  };

  const handleComplete = async () => {
    if (!isStepValid) {
      setAttempted((prev) => ({ ...prev, [currentStep]: true }));
      focusField(issues[0]?.fieldId);
      return;
    }
    setIsSubmitting(true);
    setSaveError(null);
    try {
      await persistStep(currentStep);
      await apiCompleteOnboarding();
      if (user) setUser({ ...user, onboardingCompleted: true });
      setDone(true);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
      getMyReadiness().then(setReadiness).catch(() => setReadiness(null));
    } catch (error) {
      handleError(error, 'Error al completar el onboarding. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** "Guardar y continuar más tarde": guarda el paso si está completo; si no, pide confirmación. */
  const handleSaveAndExit = async () => {
    if (!isStepValid) {
      setExitDialogOpen(true);
      return;
    }
    setIsSubmitting(true);
    setSaveError(null);
    try {
      await persistStep(currentStep);
      router.push('/dashboard');
    } catch (error) {
      handleError(error, 'Error al guardar. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Cambios por paso ──────────────────────────────────────────────────────

  const setStep = <K extends 'step1' | 'step2' | 'step3' | 'step4' | 'step5'>(key: K) =>
    (data: OnboardingFormData[K]) => setFormData((prev) => ({ ...prev, [key]: data }));

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <EnhancedStep1Location
            data={formData.step1}
            onChange={setStep('step1')}
            businessName={formData.meta.businessName}
            errors={fieldErrors}
          />
        );
      case 1:
        return <EnhancedStep2Visual data={formData.step2} onChange={setStep('step2')} errors={fieldErrors} />;
      case 2:
        return (
          <EnhancedStep3Shipping
            data={formData.step3}
            onChange={setStep('step3')}
            coverage={coverage}
            coverageLoading={coverageLoading}
            coverageError={coverageError}
            onRetryCoverage={loadCoverage}
            onGoToStep={(id) => goToStep(id - 1, -1)}
            homeProvince={formData.step1.province}
            errors={fieldErrors}
          />
        );
      case 3:
        return <EnhancedStep4Documents data={formData.step4} onChange={setStep('step4')} errors={fieldErrors} />;
      case 4:
        return (
          <EnhancedStep5Payments
            data={formData.step5}
            onChange={setStep('step5')}
            userEmail={user?.email}
            firstName={user?.firstName}
            lastName={user?.lastName}
            businessName={formData.meta.businessName}
            website={formData.meta.website}
            onRequestRefresh={refreshStripeState}
            errors={fieldErrors}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Cargando tu configuración">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-origen-pradera border-t-transparent" />
      </div>
    );
  }

  const isLastStep = currentStep === ONBOARDING_TOTAL_STEPS - 1;
  const step = ONBOARDING_STEPS[currentStep];
  const completedMap = Object.fromEntries(completedSteps.map((id) => [String(id), true]));
  const progress = (completedSteps.length / ONBOARDING_TOTAL_STEPS) * 100;

  // ── Pantalla final ────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="min-h-screen bg-origen-crema">
        <header className="w-full border-b border-border-subtle bg-surface-alt/80">
          <div className="mx-auto flex max-w-3xl items-center px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center" aria-label="Origen">
              <img src="/origen-icon.svg" alt="" width={36} height={36} className="h-9 w-9" />
            </Link>
          </div>
        </header>
        <main className="px-4 py-6 pb-10 sm:px-6 lg:py-10">
          <OnboardingDone readiness={readiness} businessName={formData.meta.businessName} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-origen-crema">
      <header className="w-full border-b border-border-subtle bg-surface-alt/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="Origen">
            <img src="/origen-icon.svg" alt="" width={36} height={36} className="h-9 w-9" />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSaveAndExit}
            disabled={isSubmitting}
            className="min-h-11 w-auto text-xs text-text-subtle sm:text-sm"
          >
            Guardar y continuar más tarde
          </Button>
        </div>
      </header>

      {/* Espacio bajo el ActionBar fijo de móvil: 1 fila (botón principal) en el paso 1 y 2 filas
          (principal + "Anterior") en el resto. Clases literales completas para el JIT de Tailwind. */}
      <main
        className={`mx-auto max-w-3xl px-4 sm:px-6 lg:pb-10 ${
          currentStep === 0
            ? 'pb-[calc(96px+env(safe-area-inset-bottom,0px))]'
            : 'pb-[calc(148px+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        <WizardProgress
          steps={WIZARD_STEPS}
          currentId={String(step.id)}
          completed={completedMap}
          onStepChange={handleStepClick}
          maxReachableIndex={maxReachable}
          progress={progress}
          idPrefix="onboarding"
          stickyClassName="top-0"
          stickyOffsetPx={0}
        />

        <div className="mb-5 mt-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle">
            Paso {step.id} de {ONBOARDING_TOTAL_STEPS}
            <span aria-hidden="true">·</span>
            <Clock className="h-3 w-3" aria-hidden="true" />
            {step.time}
          </p>
          <h1 ref={titleRef} tabIndex={-1} className="mt-1 text-h2 font-bold text-origen-bosque focus:outline-hidden">
            {step.title}
          </h1>
          <p className="mt-1 text-sm text-text-subtle sm:text-base">{step.purpose}</p>
        </div>

        {notice && (
          <Alert variant="success" dismissible onDismiss={() => setNotice(null)} className="mb-4" role="status">
            {notice}
          </Alert>
        )}

        {showErrors && issues.length > 0 && (
          <div className="mb-4">
            <StepValidationPanel issues={issues} onFocusField={focusField} stepKey={currentStep} />
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            data-onboarding-step-content
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {isLastStep && formData.step5.acceptTerms && !formData.step5.stripeConnected && (
          <Alert variant="warning" className="mt-4">
            Puedes finalizar sin Stripe ahora, pero no podrás publicar productos hasta conectarlo desde tu panel.
          </Alert>
        )}

        {saveError && (
          <Alert variant="error" dismissible onDismiss={() => setSaveError(null)} className="mt-6">
            {saveError}
          </Alert>
        )}

        {/* Navegación — solo escritorio (en móvil, MobileNavBar) */}
        <div className="mt-8 hidden items-center justify-between border-t border-border pt-6 lg:flex">
          <div>
            {currentStep > 0 && (
              <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>
                Anterior
              </Button>
            )}
          </div>
          <Button
            onClick={isLastStep ? handleComplete : handleNext}
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText={isLastStep ? 'Finalizando...' : 'Guardando...'}
            aria-disabled={!isStepValid}
            aria-describedby={!isStepValid && showErrors ? 'onboarding-step-validation' : undefined}
            className={!isStepValid && !isSubmitting ? 'opacity-60' : undefined}
          >
            {isLastStep ? 'Finalizar' : 'Guardar y continuar'}
          </Button>
        </div>
      </main>

      <MobileNavBar
        currentStep={currentStep}
        onBack={handleBack}
        onNext={isLastStep ? handleComplete : handleNext}
        canContinue={isStepValid}
        isSubmitting={isSubmitting}
        isLastStep={isLastStep}
      />

      <ConfirmDialog
        open={exitDialogOpen}
        onOpenChange={setExitDialogOpen}
        title="Este paso está incompleto"
        description="Si sales ahora, no se guardará lo que has cambiado en este paso. Conservas todo lo guardado en los pasos anteriores y puedes retomarlo cuando quieras."
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir aquí"
        confirmVariant="primary"
        onConfirm={() => router.push('/dashboard')}
      />
    </div>
  );
}
