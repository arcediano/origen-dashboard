import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Decisión de Negocio (comentario del humano sobre el informe funcional,
 * 2026-10-27): el modo manual es SIEMPRE el que se ve por defecto al entrar
 * a /dashboard/products/create -- ya no depende de si el asistente está
 * activo. Un enlace/CTA "Probar IA" persistente ofrece el acceso al
 * asistente, y los créditos + el botón de recarga se ven siempre, en ambos
 * modos. Estos tests cubren exactamente ese comportamiento nuevo; el resto
 * de la página (pasos del wizard, guardado, publicación) ya tiene su propia
 * cobertura en useProductForm.test.ts y no se repite aquí.
 */

const { getAiAssistQuotaMock, pushMock } = vi.hoisted(() => ({
  getAiAssistQuotaMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', () => ({ getAiAssistQuota: getAiAssistQuotaMock }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/app/dashboard/products/components/ai-onboarding/AiAssistChat', () => ({
  AiAssistChat: ({ onManual }: { onManual: () => void }) => (
    <div data-testid="ai-assist-chat">
      <button type="button" onClick={onManual}>
        (chat) Crear manualmente
      </button>
    </div>
  ),
}));

vi.mock('@/app/dashboard/products/components/ai-onboarding/AddCreditsModal', () => ({
  AddCreditsModal: () => null,
}));

vi.mock('@/app/dashboard/products/components', () => ({
  CreateProductProgress: () => null,
  CreateProductNavigation: () => null,
  CreateProductCancelDialog: () => null,
  SuccessPublishModal: () => null,
  PublicationRequirementsChecklist: () => null,
}));
vi.mock('@/app/dashboard/products/components/ProductFormSteps', () => ({ ProductFormSteps: () => <div data-testid="wizard-steps" /> }));
vi.mock('@/app/dashboard/products/components/ProductFormSidebar', () => ({ ProductFormSidebar: () => null }));
vi.mock('@/hooks/useStepTips', () => ({ useStepTips: () => [], KEY_FACTS_BY_STEP: {} }));
vi.mock('@/hooks/useHideBottomTabBar', () => ({ useHideBottomTabBar: () => {} }));

vi.mock('@/hooks/useProductForm', () => ({
  useProductForm: () => ({
    formData: { name: '', certifications: [] },
    activeTab: 'basic',
    setActiveTab: vi.fn(),
    completedTabs: [],
    error: null,
    isSaving: false,
    isAutoSaving: false,
    lastSaved: null,
    isPublishing: false,
    publishStatus: null,
    publishError: null,
    showCancelDialog: false,
    setShowCancelDialog: vi.fn(),
    showSuccessModal: false,
    setShowSuccessModal: vi.fn(),
    allStepsCompleted: false,
    publicationStatus: null,
    requiredStepErrors: [],
    hasCertifications: false,
    certificationsApproved: false,
    hasPendingManualCerts: false,
    currentStepErrors: [],
    handleInputChange: vi.fn(),
    handleNestedChange: vi.fn(),
    handleImagesChange: vi.fn(),
    handleSave: vi.fn(),
    handlePublish: vi.fn(),
    handleCancel: vi.fn(),
    onVariantsChange: vi.fn(),
    savedVariantsCount: 0,
  }),
}));

import CreateProductPage from '@/app/dashboard/products/create/page';

describe('/dashboard/products/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('entra siempre en modo manual por defecto, aunque el asistente esté activo', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: true, used: 1, total: 3 });
    render(<CreateProductPage />);

    expect(screen.getByTestId('wizard-steps')).toBeTruthy();
    expect(screen.queryByTestId('ai-assist-chat')).toBeNull();
  });

  it('muestra "Probar IA" + los créditos en el modo manual, y cambia a modo IA al pulsarlo', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: true, used: 1, total: 3 });
    const user = userEvent.setup();
    render(<CreateProductPage />);

    const tryAi = await screen.findByRole('button', { name: /Probar IA/ });
    expect(tryAi).not.toBeDisabled();
    expect(screen.getByTestId('ai-credits-panel')).toBeTruthy();
    expect(screen.getByTestId('ai-credits-remaining').textContent).toBe('2');

    await user.click(tryAi);

    expect(await screen.findByTestId('ai-assist-chat')).toBeTruthy();
    expect(screen.queryByTestId('wizard-steps')).toBeNull();
    // los créditos siguen visibles también en modo IA (petición del humano)
    expect(screen.getByTestId('ai-credits-panel')).toBeTruthy();
  });

  it('con el cupo agotado, "Probar IA" se muestra pero deshabilitado (nunca se oculta)', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: true, used: 3, total: 3 });
    render(<CreateProductPage />);

    const tryAi = await screen.findByRole('button', { name: /Probar IA/ });
    expect(tryAi).toBeDisabled();
    expect(screen.getByTestId('ai-credits-panel').getAttribute('data-state')).toBe('exhausted');
  });

  it('con el asistente desactivado, no se ve ni "Probar IA" ni el panel de créditos', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: false, used: 0, total: 0 });
    render(<CreateProductPage />);

    await waitFor(() => expect(getAiAssistQuotaMock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Probar IA/ })).toBeNull();
    expect(screen.queryByTestId('ai-credits-panel')).toBeNull();
  });

  it('volver desde el chat al wizard (botón "Crear manualmente" del propio chat) restaura el modo manual', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: true, used: 0, total: 3 });
    const user = userEvent.setup();
    render(<CreateProductPage />);

    await user.click(await screen.findByRole('button', { name: /Probar IA/ }));
    expect(await screen.findByTestId('ai-assist-chat')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '(chat) Crear manualmente' }));

    expect(await screen.findByTestId('wizard-steps')).toBeTruthy();
    expect(screen.queryByTestId('ai-assist-chat')).toBeNull();
  });
});
