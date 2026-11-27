import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { createMock, statusMock, pushMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  statusMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('@/lib/api/ai-assist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/ai-assist')>();
  return { ...actual, createAssistedProduct: createMock, getAssistedProductStatus: statusMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/ai-assist/resize-label-image', () => ({
  resizeLabelImage: vi.fn().mockResolvedValue({ mediaType: 'image/jpeg', data: 'QUJD' }),
}));

import { AiAssistError } from '@/lib/api/ai-assist';
import { AiProductWizard } from '@/app/dashboard/products/components/ai-onboarding/AiProductWizard';
import { DRAFT_STORAGE_KEY } from '@/app/dashboard/products/components/ai-onboarding/useAssistedProductForm';

const onManual = vi.fn();
const onRecharge = vi.fn();

const photo = () => new File(['fake-image-bytes'], 'queso.jpg', { type: 'image/jpeg' });

async function uploadTo(testId: string, file = photo()) {
  const user = userEvent.setup();
  const field = screen.getByTestId(testId);
  const input = field.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);
}

async function goToProductStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Empezar' }));
  await uploadTo('photo-product');
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
}

describe('AiProductWizard (formulario guiado de Origen Assist)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statusMock.mockReset();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('abre con una introducción que explica qué hará la IA, el coste y que no inventa datos', () => {
    render(<AiProductWizard quota={{ used: 1, total: 3 }} onManual={onManual} />);

    expect(screen.getByText(/Crea tu producto con ayuda de la IA/)).toBeTruthy();
    expect(screen.getByText(/1 crédito = 1 producto/)).toBeTruthy();
    expect(screen.getByText(/Ahora te quedan 2/)).toBeTruthy();
    expect(screen.getByText(/La IA solo usa lo que tú le cuentas/)).toBeTruthy();
    // No es un chat: no hay campo de texto libre ni botón de enviar
    expect(screen.queryByRole('button', { name: 'Enviar mensaje' })).toBeNull();
  });

  it('no deja avanzar del paso de fotos sin la del producto, y muestra el progreso al avanzar', async () => {
    const user = userEvent.setup();
    render(<AiProductWizard quota={null} onManual={onManual} />);

    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Sube una foto del producto/);

    await uploadTo('photo-product');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Describe tu producto')).toBeTruthy();
    expect(screen.getByText(/Paso 2 de 6/)).toBeTruthy();
  });

  it('la pantalla de fotos muestra una sección clara e independiente por cada imagen', async () => {
    const user = userEvent.setup();
    render(<AiProductWizard quota={null} onManual={onManual} />);
    await user.click(screen.getByRole('button', { name: 'Empezar' }));

    expect(screen.getByText('Foto del producto')).toBeTruthy();
    expect(screen.getByText('Tabla nutricional')).toBeTruthy();
    expect(screen.getByText('Ingredientes y alérgenos')).toBeTruthy();
    expect(screen.getByText('Conservación')).toBeTruthy();
    // No es un chat: nada de esto depende de un mensaje de texto libre
    expect(screen.queryByRole('button', { name: 'Enviar mensaje' })).toBeNull();

    await uploadTo('photo-nutrition');
    const nutritionPanel = within(screen.getByTestId('photo-nutrition'));
    expect(nutritionPanel.getByText('Foto añadida')).toBeTruthy();
    // El resto de secciones siguen intactas, sin foto
    expect(within(screen.getByTestId('photo-ingredients')).getByText('Subir o hacer una foto')).toBeTruthy();
  });

  it('exige una descripción del producto antes de seguir', async () => {
    const user = userEvent.setup();
    render(<AiProductWizard quota={null} onManual={onManual} />);
    await goToProductStep(user);

    await user.type(screen.getByLabelText('Describe tu producto'), 'corto');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/qué es tu producto/);
  });

  it('recorre todos los pasos y envía todo de una vez; al terminar redirige a la ficha', async () => {
    const user = userEvent.setup();
    createMock.mockResolvedValue({ productId: 'prod-9', charged: true, nutritionSource: 'label' });
    render(<AiProductWizard quota={{ used: 0, total: 3 }} onManual={onManual} />);

    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    await uploadTo('photo-product');
    await uploadTo('photo-nutrition');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await user.type(screen.getByLabelText('Describe tu producto'), 'Queso curado de oveja, intenso');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await user.type(await screen.findByLabelText('Origen e historia'), 'Sierra de Gredos, tres generaciones');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await user.type(await screen.findByLabelText('Proceso de elaboración'), 'Leche cruda y maduración lenta');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await user.click(await screen.findByRole('button', { name: 'Orgánico' }));
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    // Resumen: lo introducido y el aviso del crédito
    expect(await screen.findByText(/Revisa lo que le vas a dar a la IA/)).toBeTruthy();
    expect(screen.getByText(/Queso curado de oveja, intenso/)).toBeTruthy();
    expect(screen.getByText(/tabla nutricional/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Crear mi producto con IA' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard/products/prod-9?fromAssistant=1&nutrition=label'));
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      clientRequestId: expect.any(String),
      images: {
        product: { mediaType: 'image/jpeg', data: 'QUJD' },
        nutrition: { mediaType: 'image/jpeg', data: 'QUJD' },
        ingredients: undefined,
        conservation: undefined,
      },
      name: undefined,
      productDescription: 'Queso curado de oveja, intenso',
      originStory: 'Sierra de Gredos, tres generaciones',
      productionProcess: 'Leche cruda y maduración lenta',
      extraInfo: undefined,
      certifications: ['Orgánico'],
      netContent: undefined,
    });
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('sin foto de tabla nutricional avisa de que se usarán valores orientativos de USDA y lo propaga a la ficha', async () => {
    const user = userEvent.setup();
    createMock.mockResolvedValue({ productId: 'prod-7', charged: true, nutritionSource: 'usda' });
    render(<AiProductWizard quota={{ used: 0, total: 3 }} onManual={onManual} />);

    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    await uploadTo('photo-product');

    // En la propia pantalla de fotos, sin foto nutricional
    expect(await screen.findByText(/Sin foto de la tabla nutricional/)).toBeTruthy();
    expect(screen.getByText(/orientativos por 100 g/)).toBeTruthy();
    await uploadTo('photo-nutrition');
    expect(screen.queryByText(/Sin foto de la tabla nutricional/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(await screen.findByText(/Sin foto de la tabla nutricional/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.type(screen.getByLabelText('Describe tu producto'), 'Queso curado de oveja, intenso');
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText(/valores orientativos de USDA/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Crear mi producto con IA' }));

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/dashboard/products/prod-7?fromAssistant=1&nutrition=usda'),
    );
  });

  it('desde el resumen se puede volver a editar un paso', async () => {
    const user = userEvent.setup();
    render(<AiProductWizard quota={null} onManual={onManual} />);
    await goToProductStep(user);
    await user.type(screen.getByLabelText('Describe tu producto'), 'Queso curado de oveja, intenso');
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await user.click(await screen.findByRole('button', { name: 'Editar tu producto' }));

    expect(await screen.findByLabelText('Describe tu producto')).toBeTruthy();
  });

  it('un error al crear conserva lo escrito y permite reintentar; sin créditos ofrece recargar', async () => {
    const user = userEvent.setup();
    createMock.mockRejectedValueOnce(new AiAssistError('cupo', 'AI_PRODUCER_QUOTA_EXCEEDED', 403));
    render(<AiProductWizard quota={{ used: 0, total: 3 }} onManual={onManual} onRecharge={onRecharge} />);
    await goToProductStep(user);
    await user.type(screen.getByLabelText('Describe tu producto'), 'Queso curado de oveja, intenso');
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(await screen.findByRole('button', { name: 'Crear mi producto con IA' }));

    const alert = await screen.findByText('Sin créditos del asistente');
    expect(alert).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Recargar créditos' }));
    expect(onRecharge).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    // sigue en el resumen, con todo intacto
    expect(screen.getByText(/Queso curado de oveja, intenso/)).toBeTruthy();
  });

  const submitFromReview = async (user: ReturnType<typeof userEvent.setup>) => {
    render(<AiProductWizard quota={{ used: 0, total: 3 }} onManual={onManual} onRecharge={onRecharge} />);
    await goToProductStep(user);
    await user.type(screen.getByLabelText('Describe tu producto'), 'Queso curado de oveja, intenso');
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(await screen.findByRole('button', { name: 'Crear mi producto con IA' }));
  };

  it('si la respuesta se pierde, consulta el estado del intento y sigue adelante cuando el producto ya existe', async () => {
    const realSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms?: number) =>
      realSetTimeout(fn, ms === 5000 ? 0 : ms)) as unknown as typeof setTimeout);
    const user = userEvent.setup();
    createMock.mockRejectedValueOnce(new AiAssistError('Failed to fetch', null, 0));
    statusMock
      .mockResolvedValueOnce({ status: 'in_progress' })
      .mockResolvedValueOnce({ status: 'completed', productId: 'prod-rec', nutritionSource: 'usda' });

    await submitFromReview(user);

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/dashboard/products/prod-rec?fromAssistant=1&nutrition=usda'),
    );
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(statusMock).toHaveBeenCalledWith(createMock.mock.calls[0][0].clientRequestId);
    vi.restoreAllMocks();
  });

  it('si no se puede confirmar, avisa y el reintento reutiliza el mismo identificador (no duplica ni cobra dos veces)', async () => {
    const realSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms?: number) =>
      realSetTimeout(fn, ms === 5000 ? 0 : ms)) as unknown as typeof setTimeout);
    const user = userEvent.setup();
    createMock
      .mockRejectedValueOnce(new AiAssistError('Failed to fetch', null, 0))
      .mockResolvedValueOnce({ productId: 'prod-2', charged: true, nutritionSource: null });
    statusMock.mockResolvedValue({ status: 'unknown' });

    await submitFromReview(user);
    expect(await screen.findByText(/No hemos podido confirmar que tu producto se creara/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Crear mi producto con IA' }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(2));
    expect(createMock.mock.calls[1][0].clientRequestId).toBe(createMock.mock.calls[0][0].clientRequestId);
    vi.restoreAllMocks();
  });

  it('"Prefiero hacerlo a mano" sale del asistente en cualquier paso', async () => {
    const user = userEvent.setup();
    render(<AiProductWizard quota={null} onManual={onManual} />);

    await user.click(screen.getByRole('button', { name: 'Prefiero hacerlo a mano' }));

    expect(onManual).toHaveBeenCalled();
  });

  it('recupera las respuestas tras recargar y avisa de que hay que volver a subir las fotos', async () => {
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        step: 'origin',
        text: { name: '', productDescription: 'Queso curado de oveja', originStory: 'Gredos', certifications: [] },
      }),
    );
    render(<AiProductWizard quota={null} onManual={onManual} />);

    expect(await screen.findByText(/Hemos recuperado tus respuestas anteriores/)).toBeTruthy();
    const panel = within(screen.getByTestId('photo-product'));
    expect(panel.getByText('Subir o hacer una foto')).toBeTruthy();
  });
});
