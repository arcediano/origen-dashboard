import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { startMock, postMock, pricingMock, getConversationMock, pushMock } = vi.hoisted(() => ({
  startMock: vi.fn(),
  postMock: vi.fn(),
  pricingMock: vi.fn(),
  getConversationMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/ai-assist')>();
  return {
    ...actual,
    startConversation: startMock,
    postConversationMessage: postMock,
    getAiCreditsPricing: pricingMock,
    getConversation: getConversationMock,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/ai-assist/resize-label-image', () => ({
  resizeLabelImage: vi.fn().mockResolvedValue({ mediaType: 'image/jpeg', data: 'QUJD' }),
}));

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue({}) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: () => null,
  PaymentElement: () => null,
  useStripe: () => null,
  useElements: () => null,
}));

import { AiAssistChat } from '@/app/dashboard/products/components/ai-onboarding/AiAssistChat';

const onManual = vi.fn();

const STORAGE_KEY = 'origen-ai-assist-conversation-id';

describe('AiAssistChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    pricingMock.mockResolvedValue({ purchasedCredits: 0, presets: [] });
    getConversationMock.mockRejectedValue(new Error('no conversation'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el saludo inicial de Origen Assist y el paso de foto de producto', () => {
    render(<AiAssistChat quota={null} onManual={onManual} />);
    expect(screen.getByText(/Hola, soy Origen Assist/)).toBeTruthy();
    expect(screen.getByText(/Sube una foto del producto/)).toBeTruthy();
  });

  it('envía el primer turno a startConversation y muestra el siguiente paso con su progreso', async () => {
    const user = userEvent.setup();
    startMock.mockResolvedValue({
      kind: 'step',
      conversationId: 'conv-1',
      text: '📸 Ahora la etiqueta frontal (marca y nombre). ¿La subes?',
      stepIndex: 2,
      totalSteps: 7,
      imageDropzoneLabel: 'Arrastra la foto de la etiqueta frontal aquí',
      chips: ['No tengo foto'],
      done: false,
    });
    const { container } = render(<AiAssistChat quota={{ used: 0, total: 3 }} onManual={onManual} />);

    await user.type(screen.getByPlaceholderText('Escribe aquí…'), 'Es un queso de oveja');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(startMock).toHaveBeenCalledWith({ text: 'Es un queso de oveja' });
    expect(await screen.findByText(/Ahora la etiqueta frontal/)).toBeTruthy();
    const progress = container.querySelector('progress');
    expect(progress?.getAttribute('value')).toBe('2');
    expect(progress?.getAttribute('max')).toBe('7');
    expect(screen.getByRole('button', { name: 'No tengo foto' })).toBeTruthy();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('conv-1');
  });

  it('al pulsar un chip, llama a postConversationMessage con choice', async () => {
    const user = userEvent.setup();
    startMock.mockResolvedValue({
      kind: 'step',
      conversationId: 'conv-1',
      text: '¿Este producto es local o importado?',
      stepIndex: 5,
      totalSteps: 7,
      chips: ['Local', 'Importado', 'No sé'],
      done: false,
    });
    postMock.mockResolvedValue({
      kind: 'step',
      conversationId: 'conv-1',
      text: '¿Tiene algún certificado?',
      stepIndex: 6,
      totalSteps: 7,
      chips: ['Orgánico', 'Vegano', 'Sin gluten', 'Ninguno'],
      done: false,
    });
    render(<AiAssistChat quota={{ used: 0, total: 3 }} onManual={onManual} />);

    await user.type(screen.getByPlaceholderText('Escribe aquí…'), 'hola');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('button', { name: 'Local' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Local' }));

    expect(postMock).toHaveBeenCalledWith('conv-1', { choice: 'Local' });
    expect(await screen.findByText('¿Tiene algún certificado?')).toBeTruthy();
  });

  it('un chip de candidato USDA muestra solo la descripción pero envía el valor completo', async () => {
    const user = userEvent.setup();
    startMock.mockResolvedValue({
      kind: 'step',
      conversationId: 'conv-1',
      text: 'He encontrado estas coincidencias, ¿alguna es la tuya?',
      stepIndex: 3,
      totalSteps: 7,
      chips: ['usda:0:Apples, raw, golden delicious', 'usda:1:Apples, raw, fuji', 'Ninguna'],
      done: false,
    });
    postMock.mockResolvedValue({
      kind: 'step',
      conversationId: 'conv-1',
      text: 'Perfecto, sigamos.',
      stepIndex: 4,
      totalSteps: 7,
      done: false,
    });
    render(<AiAssistChat quota={{ used: 0, total: 3 }} onManual={onManual} />);

    await user.type(screen.getByPlaceholderText('Escribe aquí…'), 'hola');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    const chip = await screen.findByRole('button', { name: 'Apples, raw, golden delicious' });
    await user.click(chip);

    expect(postMock).toHaveBeenCalledWith('conv-1', { choice: 'usda:0:Apples, raw, golden delicious' });
  });

  it('cuando el asistente entrega el producto creado, muestra el spinner y redirige a su ficha', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    startMock.mockResolvedValue({
      kind: 'draft_ready',
      conversationId: 'conv-1',
      text: 'Preparando tu ficha…',
      productId: 'prod-1',
      done: true,
    });
    render(<AiAssistChat quota={{ used: 0, total: 3 }} onManual={onManual} />);

    await user.type(screen.getByPlaceholderText('Escribe aquí…'), 'listo');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Preparando tu ficha…')).toBeTruthy();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();

    await vi.advanceTimersByTimeAsync(1200);

    expect(pushMock).toHaveBeenCalledWith('/dashboard/products/prod-1?fromAssistant=1');
  });

  it('al recargar con una conversación activa guardada, ofrece reanudar en el paso correspondiente', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'conv-1');
    getConversationMock.mockResolvedValue({
      id: 'conv-1',
      status: 'ACTIVE',
      productId: null,
      currentStep: 'ORIGIN',
    });
    const user = userEvent.setup();
    const { container } = render(<AiAssistChat quota={{ used: 0, total: 3 }} onManual={onManual} />);

    expect(await screen.findByText(/Retomamos donde lo dejaste/)).toBeTruthy();
    expect(screen.getByText(/paso 5 de 7/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByText('¿Este producto es local o importado?')).toBeTruthy();
    const progress = container.querySelector('progress');
    expect(progress?.getAttribute('value')).toBe('5');
    expect(progress?.getAttribute('max')).toBe('7');
  });

  it('"Empezar de nuevo" en la reanudación limpia la conversación guardada', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'conv-1');
    getConversationMock.mockResolvedValue({
      id: 'conv-1',
      status: 'ACTIVE',
      productId: null,
      currentStep: 'FORMAT',
    });
    const user = userEvent.setup();
    render(<AiAssistChat quota={{ used: 0, total: 3 }} onManual={onManual} />);

    expect(await screen.findByText(/Retomamos donde lo dejaste/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Empezar de nuevo' }));

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByText(/Hola, soy Origen Assist/)).toBeTruthy();
  });
});
