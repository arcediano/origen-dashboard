import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { quotaMock, readMock, resizeMock } = vi.hoisted(() => ({
  quotaMock: vi.fn(),
  readMock: vi.fn(),
  resizeMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/ai-assist')>();
  return { ...actual, getAiAssistQuota: quotaMock, readLabel: readMock };
});
vi.mock('@/lib/ai-assist/resize-label-image', () => ({ resizeLabelImage: resizeMock }));

import { AiAssistError } from '@/lib/api/ai-assist';
import { LabelReaderCard } from '@/app/dashboard/products/components/steps/LabelReaderCard';

const current = { servingSizeValue: 100, servingSizeUnit: 'g' as const };
const proposal = {
  ingredients: ['harina'],
  allergens: ['Gluten'],
  mayContain: null,
  servingSizeValue: 30,
  servingSizeUnit: 'g',
  calories: 120,
  protein: null,
  totalFat: null,
  saturatedFat: null,
  carbohydrates: null,
  sugars: null,
  dietaryFiber: null,
  sodium: null,
};

async function pickPhoto(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, new File(['x'], 'etiqueta.jpg', { type: 'image/jpeg' }));
  // La foto elegida debe verse como chip (regresión: la FileList en vivo se vaciaba).
  expect(await screen.findByText('etiqueta.jpg')).toBeInTheDocument();
}

describe('LabelReaderCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resizeMock.mockResolvedValue({ mediaType: 'image/jpeg', data: 'QUJD' });
  });

  it('no se muestra si el asistente está apagado', async () => {
    quotaMock.mockResolvedValue({ enabled: false, used: 0, total: 5 });
    const { container } = render(
      <LabelReaderCard assistKey="clave-12345" nutritionalInfo={current} onApply={vi.fn()} />,
    );
    await waitFor(() => expect(quotaMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('no se muestra si la consulta de cupo falla (p. ej. sin permiso)', async () => {
    quotaMock.mockRejectedValue(new AiAssistError('403', null, 403));
    const { container } = render(
      <LabelReaderCard assistKey="clave-12345" nutritionalInfo={current} onApply={vi.fn()} />,
    );
    await waitFor(() => expect(quotaMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('lee la etiqueta, aplica los campos, avisa del uso y pide revisar alérgenos', async () => {
    quotaMock.mockResolvedValue({ enabled: true, used: 1, total: 5 });
    readMock.mockResolvedValue({
      legible: true,
      proposal,
      unreadableFields: ['sodium'],
      notes: 'Sal convertida a sodio',
      quota: { used: 2, total: 5 },
    });
    const onApply = vi.fn();
    const onUsed = vi.fn();
    const { container } = render(
      <LabelReaderCard
        assistKey="clave-12345"
        nutritionalInfo={current}
        onApply={onApply}
        onUsed={onUsed}
      />,
    );

    await screen.findByText(/Leer etiqueta con IA/);
    expect(screen.getByText(/1 de 5 productos/)).toBeInTheDocument();

    await pickPhoto(container);
    await userEvent.click(screen.getByRole('button', { name: /^Leer etiqueta$/ }));

    await screen.findByText(/Revisa los datos antes de continuar/);
    expect(readMock).toHaveBeenCalledWith('clave-12345', [{ mediaType: 'image/jpeg', data: 'QUJD' }]);
    const fields = onApply.mock.calls[0][0].map((p: { field: string }) => p.field);
    expect(fields).toEqual(
      expect.arrayContaining(['ingredients', 'allergens', 'servingSize', 'calories']),
    );
    expect(fields).not.toContain('protein'); // no leído → no se toca
    expect(onUsed).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/alérgenos/i, { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/No hemos podido leer: sodio/)).toBeInTheDocument();
    expect(screen.getByText(/2 de 5 productos/)).toBeInTheDocument();
  });

  it('muestra el error del backend y no rellena nada', async () => {
    quotaMock.mockResolvedValue({ enabled: true, used: 5, total: 5 });
    readMock.mockRejectedValue(
      new AiAssistError('Ya has usado todos los productos con asistente de IA', 'AI_PRODUCER_QUOTA_EXCEEDED', 403),
    );
    const onApply = vi.fn();
    const onUsed = vi.fn();
    const { container } = render(
      <LabelReaderCard assistKey="clave-12345" nutritionalInfo={current} onApply={onApply} onUsed={onUsed} />,
    );
    await screen.findByText(/Leer etiqueta con IA/);
    await pickPhoto(container);
    await userEvent.click(screen.getByRole('button', { name: /^Leer etiqueta$/ }));

    await screen.findByText(/Ya has usado todos los productos/);
    expect(onApply).not.toHaveBeenCalled();
    expect(onUsed).not.toHaveBeenCalled(); // cupo agotado: no se gastó nada
  });

  it('una etiqueta ilegible consume cupo (la llamada se cobró) aunque no rellene nada', async () => {
    quotaMock.mockResolvedValue({ enabled: true, used: 0, total: 5 });
    readMock.mockRejectedValue(new AiAssistError('No hemos podido leer la etiqueta', 'AI_LABEL_UNREADABLE', 422));
    const onUsed = vi.fn();
    const { container } = render(
      <LabelReaderCard assistKey="clave-12345" nutritionalInfo={current} onApply={vi.fn()} onUsed={onUsed} />,
    );
    await screen.findByText(/Leer etiqueta con IA/);
    await pickPhoto(container);
    await userEvent.click(screen.getByRole('button', { name: /^Leer etiqueta$/ }));
    await screen.findByText(/No hemos podido leer la etiqueta/);
    expect(onUsed).toHaveBeenCalledTimes(1);
  });
});
