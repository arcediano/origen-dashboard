import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { startMock, postMock, pricingMock } = vi.hoisted(() => ({
  startMock: vi.fn(),
  postMock: vi.fn(),
  pricingMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/ai-assist')>();
  return {
    ...actual,
    startConversation: startMock,
    postConversationMessage: postMock,
    getAiCreditsPricing: pricingMock,
  };
});

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

const onDraftReady = vi.fn();
const onManual = vi.fn();

describe('AiAssistChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pricingMock.mockResolvedValue({ purchasedCredits: 0, presets: [] });
  });

  it('muestra el saludo inicial de Origen Assist', () => {
    render(<AiAssistChat quota={null} onDraftReady={onDraftReady} onManual={onManual} />);
    expect(screen.getByText(/Hola, soy Origen Assist/)).toBeTruthy();
  });

  it('envía el primer turno a startConversation y muestra la respuesta del asistente', async () => {
    const user = userEvent.setup();
    startMock.mockResolvedValue({
      kind: 'message',
      conversationId: 'conv-1',
      text: 'Cuéntame más sobre tu queso.',
      done: false,
    });
    render(<AiAssistChat quota={{ used: 0, total: 3 }} onDraftReady={onDraftReady} onManual={onManual} />);

    await user.type(screen.getByPlaceholderText('Escribe aquí...'), 'Es un queso de oveja');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(startMock).toHaveBeenCalledWith({ text: 'Es un queso de oveja' });
    expect(await screen.findByText('Cuéntame más sobre tu queso.')).toBeTruthy();
  });

  it('en una pregunta de cierre, responder llama a postConversationMessage con followUpAnswer', async () => {
    const user = userEvent.setup();
    startMock.mockResolvedValue({
      kind: 'question',
      conversationId: 'conv-1',
      text: 'Antes de seguir...',
      question: {
        field: 'productionInfo.origin',
        question: '¿De qué región es tu queso?',
        type: 'text',
        options: null,
      },
      done: false,
    });
    postMock.mockResolvedValue({
      kind: 'message',
      conversationId: 'conv-1',
      text: 'Gracias, sigo con el resto.',
      done: false,
    });
    render(<AiAssistChat quota={{ used: 0, total: 3 }} onDraftReady={onDraftReady} onManual={onManual} />);

    await user.type(screen.getByPlaceholderText('Escribe aquí...'), 'Es un queso de oveja');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('¿De qué región es tu queso?')).toBeTruthy();

    await user.type(screen.getByPlaceholderText('Escribe tu respuesta...'), 'Cantabria');
    await user.click(screen.getByRole('button', { name: 'Responder' }));

    expect(postMock).toHaveBeenCalledWith('conv-1', { followUpAnswer: 'Cantabria' });
    expect(await screen.findByText('Gracias, sigo con el resto.')).toBeTruthy();
  });

  it('cuando el asistente entrega el borrador final, llama a onDraftReady con la respuesta', async () => {
    const user = userEvent.setup();
    const draftResponse = {
      kind: 'draft_ready' as const,
      conversationId: 'conv-1',
      text: 'Tu borrador ya está listo.',
      productId: 'prod-1',
      done: true as const,
      proposal: {
        name: 'Queso curado',
        fullDescription: 'Un queso artesano.',
        categoryId: 'cat-1',
        subcategoryId: null,
        nutritionalInfo: {
          ingredients: null,
          allergens: null,
          mayContain: null,
          servingSizeValue: null,
          servingSizeUnit: null,
          calories: null,
          protein: null,
          totalFat: null,
          saturatedFat: null,
          carbohydrates: null,
          sugars: null,
          dietaryFiber: null,
          sodium: null,
          isGlutenFree: null,
          isVegan: null,
          isVegetarian: null,
        },
        productionInfo: { origin: null, productionMethod: null },
      },
      labelLegible: null,
      unreadableFields: [],
      producerMustComplete: ['Precio', 'Stock'],
      notes: null,
      followUpQuestions: [],
      nutritionSource: null,
      allergenSource: null,
      externalSourceNote: null,
      externalSourceUrls: [],
      quota: { used: 1, total: 3 },
      mainImage: { key: 'k1', url: 'https://cdn/x.jpg' },
    };
    startMock.mockResolvedValue(draftResponse);
    render(<AiAssistChat quota={{ used: 0, total: 3 }} onDraftReady={onDraftReady} onManual={onManual} />);

    await user.type(screen.getByPlaceholderText('Escribe aquí...'), 'Es un queso de oveja');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(onDraftReady).toHaveBeenCalledTimes(1));
    expect(onDraftReady).toHaveBeenCalledWith({ response: draftResponse, productPhoto: null });
  });
});
