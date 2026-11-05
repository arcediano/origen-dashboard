import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Decisión de Negocio (comentario del humano sobre el informe funcional,
 * 2026-10-27): el modo manual es SIEMPRE el que se ve por defecto al entrar
 * a /dashboard/products/create. Desde 2026-11-05 el asistente de IA se ofrece
 * con un aviso destacado (`AiAssistBanner`) que explica que se puede crear el
 * producto con ayuda de la IA en unos sencillos pasos, en lugar del botón
 * suelto "Probar IA". El resto de la página (pasos del wizard, guardado,
 * publicación) ya tiene su propia cobertura en useProductForm.test.ts.
 */

const { getAiAssistQuotaMock, pushMock } = vi.hoisted(() => ({
  getAiAssistQuotaMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', () => ({ getAiAssistQuota: getAiAssistQuotaMock }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/app/dashboard/products/components/ai-onboarding/AiProductWizard', () => ({
  AiProductWizard: ({ onManual }: { onManual: () => void }) => (
    <div data-testid="ai-assist-wizard">
      <button type="button" onClick={onManual}>
        (asistente) Prefiero hacerlo a mano
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
    expect(screen.queryByTestId('ai-assist-wizard')).toBeNull();
  });

  it('muestra un aviso destacado que explica cómo crear el producto con IA, con los créditos', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: true, used: 1, total: 3 });
    render(<CreateProductPage />);

    const banner = await screen.findByTestId('ai-assist-banner');
    expect(banner.textContent).toMatch(/Crea tu producto con ayuda de la IA en unos sencillos pasos/);
    expect(screen.getByTestId('ai-assist-banner-credits').textContent).toMatch(/2.*créditos/);
    expect(screen.queryByRole('button', { name: /Probar IA/ })).toBeNull();
  });

  it('"Empezar con el asistente" cambia al asistente por pasos', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: true, used: 1, total: 3 });
    const user = userEvent.setup();
    render(<CreateProductPage />);

    await user.click(await screen.findByRole('button', { name: /Empezar con el asistente/ }));

    expect(await screen.findByTestId('ai-assist-wizard')).toBeTruthy();
    expect(screen.queryByTestId('wizard-steps')).toBeNull();
    expect(screen.queryByTestId('ai-assist-banner')).toBeNull();
  });

  it('"Prefiero rellenarlo a mano" pliega el aviso pero deja siempre a mano "Crear con IA"', async () => {
    localStorage.clear();
    getAiAssistQuotaMock.mockResolvedValue({ enabled: true, used: 0, total: 3 });
    const user = userEvent.setup();
    render(<CreateProductPage />);

    await user.click(await screen.findByRole('button', { name: /Prefiero rellenarlo a mano/ }));

    expect(screen.getByTestId('ai-assist-banner-compact')).toBeTruthy();
    expect(screen.queryByTestId('ai-assist-banner')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Crear con IA/ }));
    expect(await screen.findByTestId('ai-assist-wizard')).toBeTruthy();
    localStorage.clear();
  });

  it('con el cupo agotado, avisa de que no quedan créditos y no ofrece empezar (nunca se oculta)', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: true, used: 3, total: 3 });
    render(<CreateProductPage />);

    const panel = await screen.findByTestId('ai-credits-panel');
    expect(panel.getAttribute('data-state')).toBe('exhausted');
    expect(screen.queryByRole('button', { name: /Empezar con el asistente/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Recargar créditos/ })).toBeTruthy();
  });

  it('con el asistente desactivado, no se ve ni el aviso ni el panel de créditos', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: false, used: 0, total: 0 });
    render(<CreateProductPage />);

    await waitFor(() => expect(getAiAssistQuotaMock).toHaveBeenCalled());
    expect(screen.queryByTestId('ai-assist-banner')).toBeNull();
    expect(screen.queryByTestId('ai-credits-panel')).toBeNull();
  });

  it('volver desde el asistente al manual ("Prefiero hacerlo a mano") restaura el modo manual', async () => {
    getAiAssistQuotaMock.mockResolvedValue({ enabled: true, used: 0, total: 3 });
    const user = userEvent.setup();
    render(<CreateProductPage />);

    await user.click(await screen.findByRole('button', { name: /Empezar con el asistente/ }));
    expect(await screen.findByTestId('ai-assist-wizard')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '(asistente) Prefiero hacerlo a mano' }));

    expect(await screen.findByTestId('wizard-steps')).toBeTruthy();
    expect(screen.queryByTestId('ai-assist-wizard')).toBeNull();
  });
});
