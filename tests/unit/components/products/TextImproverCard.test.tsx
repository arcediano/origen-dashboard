import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { quotaMock, improveMock } = vi.hoisted(() => ({
  quotaMock: vi.fn(),
  improveMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/ai-assist')>();
  return { ...actual, getAiAssistQuota: quotaMock, improveText: improveMock };
});

import { AiAssistError } from '@/lib/api/ai-assist';
import { TextImproverCard } from '@/app/dashboard/products/components/steps/TextImproverCard';

const proposal = {
  name: 'Queso Manchego Curado 12 meses',
  shortDescription: 'Queso manchego curado de leche de oveja.',
  fullDescription: 'Elaborado de forma artesanal.',
};

describe('TextImproverCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMock.mockResolvedValue({ enabled: true, used: 1, total: 5 });
  });

  it('no se muestra si el asistente está apagado', async () => {
    quotaMock.mockResolvedValue({ enabled: false, used: 0, total: 5 });
    const { container } = render(
      <TextImproverCard assistKey="clave-12345" current={{ name: 'Queso' }} onApply={vi.fn()} />,
    );
    await waitFor(() => expect(quotaMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('no permite proponer sin nombre ni notas', async () => {
    render(<TextImproverCard assistKey="clave-12345" current={{ categoryName: 'Quesos' }} onApply={vi.fn()} />);
    const button = await screen.findByRole('button', { name: /Proponer textos/ });
    expect(button).toBeDisabled();
    expect(improveMock).not.toHaveBeenCalled();
  });

  it('propone, muestra la propuesta sin aplicarla y solo la aplica al confirmar', async () => {
    improveMock.mockResolvedValue({ proposal, notes: 'Falta el origen', quota: { used: 2, total: 5 } });
    const onApply = vi.fn();
    const onUsed = vi.fn();
    render(
      <TextImproverCard
        assistKey="clave-12345"
        current={{ name: 'queso manchego', fullDescription: 'viejo' }}
        onApply={onApply}
        onUsed={onUsed}
      />,
    );
    await userEvent.click(await screen.findByRole('button', { name: /Proponer textos/ }));

    expect(await screen.findByText(proposal.name)).toBeInTheDocument();
    expect(improveMock).toHaveBeenCalledWith('clave-12345', { name: 'queso manchego', fullDescription: 'viejo' });
    expect(screen.getByText('Falta el origen')).toBeInTheDocument();
    expect(screen.getByText(/se sustituirá tu nombre, descripción detallada actual/)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
    expect(onUsed).toHaveBeenCalled();
    expect(screen.getByText(/2 de 5 productos/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Aplicar propuesta' }));
    expect(onApply).toHaveBeenCalledWith(proposal);
    expect(screen.queryByText(proposal.name)).not.toBeInTheDocument();
  });

  it('descartar cierra la propuesta sin tocar el formulario', async () => {
    improveMock.mockResolvedValue({ proposal, notes: null, quota: { used: 2, total: 5 } });
    const onApply = vi.fn();
    render(<TextImproverCard assistKey="clave-12345" current={{ name: 'Queso' }} onApply={onApply} />);
    await userEvent.click(await screen.findByRole('button', { name: /Proponer textos/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Descartar' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.queryByText(proposal.name)).not.toBeInTheDocument();
  });

  it('muestra el mensaje de error del backend', async () => {
    improveMock.mockRejectedValue(new AiAssistError('Límite mensual alcanzado', 'AI_MONTHLY_CAP_REACHED', 503));
    render(<TextImproverCard assistKey="clave-12345" current={{ name: 'Queso' }} onApply={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: /Proponer textos/ }));
    expect(await screen.findByText('Límite mensual alcanzado')).toBeInTheDocument();
  });

  it('en edición avisa de que no hay límite de cupo', async () => {
    quotaMock.mockResolvedValue({ enabled: true, used: 5, total: 5 });
    render(<TextImproverCard assistKey="prod-abc12345" current={{ name: 'Queso' }} onApply={vi.fn()} unlimited />);
    await screen.findByText(/Redactar con IA/);
    expect(screen.getByText(/no hay límite de uso del asistente/)).toBeInTheDocument();
  });
});
