/**
 * Página de onboarding de 5 pasos: ?step=N, rehidratación y pasos vigentes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { render, screen } from '../../helpers/render';

vi.unmock('@arcediano/ux-library');

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => '/onboarding',
}));

const loadOnboardingData = vi.fn();
const getShippingCoverage = vi.fn();
vi.mock('@/lib/api/onboarding', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/onboarding')>('@/lib/api/onboarding');
  return {
    ...actual,
    loadOnboardingData: (...a: unknown[]) => loadOnboardingData(...a),
    getShippingCoverage: (...a: unknown[]) => getShippingCoverage(...a),
    getMyReadiness: vi.fn().mockResolvedValue({ blockers: [] }),
    completeOnboarding: vi.fn(),
  };
});

import OnboardingPage from '@/app/onboarding/page';

const saved = {
  success: true,
  data: {
    fiscal: { businessName: 'Huerta del Sol', entityType: 'autonomo', taxId: '12345678Z', businessPhone: '600123123', categories: ['agricola'] },
    location: { street: 'Mayor', streetNumber: '1', city: 'Sevilla', province: 'Sevilla', postalCode: '41001' },
    onboarding: { currentStep: 3, completedSteps: [1, 2] },
  },
};

function setUrl(search: string) {
  window.history.replaceState({}, '', `/onboarding${search}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  loadOnboardingData.mockResolvedValue(saved);
  getShippingCoverage.mockResolvedValue({ status: 'COVERED', postalCode: '41001', canDelegate: true, pickupRoute: { id: 'r', name: 'Ruta Sevilla', warehouseName: null }, currentChoice: null });
  setUrl('');
});

describe('OnboardingPage', () => {
  it('abre en el currentStep guardado (3 → Envíos) y consulta la cobertura', async () => {
    render(<OnboardingPage />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Envíos' })).toBeInTheDocument();
    await waitFor(() => expect(getShippingCoverage).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: /delegar en origen/i })).toBeInTheDocument();
    expect(screen.getByText(/Paso 3 de 5/i, { selector: 'p' })).toBeInTheDocument();
  });

  it('?step=1 abre la ubicación y precarga el formulario guardado', async () => {
    setUrl('?step=1');
    render(<OnboardingPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /ubicación e identidad legal/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mayor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345678Z')).toBeInTheDocument();
    expect(screen.getByTestId('onb-business-name')).toHaveTextContent('Huerta del Sol');
    expect(getShippingCoverage).not.toHaveBeenCalled();
  });

  it('?step=5 no salta más allá de lo alcanzable (sólo 2 pasos hechos → paso 3)', async () => {
    setUrl('?step=5');
    render(<OnboardingPage />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Envíos' })).toBeInTheDocument();
  });

  it('?step inválido se ignora', async () => {
    setUrl('?step=99');
    render(<OnboardingPage />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Envíos' })).toBeInTheDocument();
  });

  it('el stepper tiene 5 pasos y no hay Historia ni Productos', async () => {
    render(<OnboardingPage />);
    await screen.findByRole('heading', { level: 1, name: 'Envíos' });
    expect(screen.getAllByRole('button', { name: /^Ir al paso/ })).toHaveLength(5);
    expect(screen.queryByText(/historia/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/define hasta 5 productos/i)).not.toBeInTheDocument();
  });

  it('primer acceso (sin datos): empieza por la ubicación', async () => {
    loadOnboardingData.mockResolvedValue({ success: true, data: undefined });
    render(<OnboardingPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /ubicación e identidad legal/i })).toBeInTheDocument();
  });
});
