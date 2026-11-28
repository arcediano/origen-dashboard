import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const getProducerProfile = vi.fn();
const getAiAssistQuota = vi.fn();
vi.mock('@/lib/api/producers', () => ({ getProducerProfile: () => getProducerProfile() }));
vi.mock('@/lib/api/ai-assist', () => ({ getAiAssistQuota: () => getAiAssistQuota() }));

import { CommercialProfileCard, aiUsesText } from '@/components/features/dashboard/components/CommercialProfileCard';

const profile = (over: Record<string, unknown> = {}) => ({
  data: {
    story: { tagline: 'Miel de la sierra, hecha a mano', description: 'x'.repeat(200), productionPhilosophy: '', values: [] },
    visual: { logoUrl: 'l', bannerUrl: null, teamPhotos: [], locationImages: [], galleryImages: [] },
    ...over,
  },
});

describe('CommercialProfileCard', () => {
  beforeEach(() => {
    getProducerProfile.mockReset();
    getAiAssistQuota.mockReset();
    getAiAssistQuota.mockResolvedValue({ enabled: true, used: 1, total: 3 });
  });

  it('muestra el porcentaje, lo que más falta y un acceso a «Mejorar con IA» con los usos que quedan', async () => {
    getProducerProfile.mockResolvedValue(profile());
    render(<CommercialProfileCard />);
    expect(await screen.findByTestId('commercial-percent')).toHaveTextContent('40'); // logo 10 + eslogan 10 + historia 20
    const missing = screen.getByTestId('commercial-missing');
    expect(missing.textContent).toMatch(/fotos de tu proceso o producto.*\+15 %/);
    const cta = screen.getByRole('link', { name: /Mejorar con IA/ });
    expect(cta).toHaveAttribute('href', '/dashboard/profile/business');
    expect(await screen.findByTestId('ai-uses')).toHaveTextContent('quedan 2 usos');
  });

  it('con el perfil completo no se muestra', async () => {
    getProducerProfile.mockResolvedValue(
      profile({
        story: { tagline: 'Miel de la sierra, hecha a mano', description: 'x'.repeat(200), productionPhilosophy: 'y'.repeat(100), values: ['a'] },
        visual: { logoUrl: 'l', bannerUrl: 'b', teamPhotos: [{}], locationImages: [{}], galleryImages: [{}, {}, {}] },
      }),
    );
    const { container } = render(<CommercialProfileCard />);
    await Promise.resolve();
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
  });

  it('desactivado (onboarding sin terminar) no pide nada ni se muestra', () => {
    const { container } = render(<CommercialProfileCard enabled={false} />);
    expect(getProducerProfile).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  it('si solo faltan logo, portada o valores no promete ayuda de la IA: «Completar mi perfil»', async () => {
    getProducerProfile.mockResolvedValue(
      profile({
        story: { tagline: 'Miel de la sierra, hecha a mano', description: 'x'.repeat(200), productionPhilosophy: 'y'.repeat(100), values: [] },
        visual: { logoUrl: null, bannerUrl: null, teamPhotos: [{}], locationImages: [{}], galleryImages: [{}, {}, {}] },
      }),
    );
    render(<CommercialProfileCard />);
    expect(await screen.findByRole('link', { name: /Completar mi perfil/ })).toBeInTheDocument();
    expect(screen.queryByTestId('ai-uses')).toBeNull();
  });
});

describe('aiUsesText', () => {
  it('describe los usos restantes, uno, ninguno o sin datos', () => {
    expect(aiUsesText({ enabled: true, used: 1, total: 3 })).toMatch(/quedan 2 usos/);
    expect(aiUsesText({ enabled: true, used: 2, total: 3 })).toMatch(/queda 1 uso/);
    expect(aiUsesText({ enabled: true, used: 3, total: 3 })).toMatch(/No te quedan usos/);
    expect(aiUsesText({ enabled: false, used: 0, total: 3 })).toBeNull();
    expect(aiUsesText(null)).toBeNull();
  });
});
