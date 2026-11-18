import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiFeedbackNotice, aiFieldLabel, aiFieldStep, photoReason, unrelatedReason } from '@/app/dashboard/products/components/AiFeedbackNotice';
import type { AiFeedback } from '@/lib/api/products';

const aiApi = vi.hoisted(() => ({
  getAiAssistQuota: vi.fn(),
  regenerateProductPhoto: vi.fn(),
}));
vi.mock('@/lib/api/ai-assist', () => {
  class AiAssistError extends Error {
    constructor(message: string, public code: string | null = null, public status = 0) {
      super(message);
    }
  }
  return { ...aiApi, AiAssistError };
});
vi.mock('@/app/dashboard/products/components/ai-onboarding/AddCreditsModal', () => ({
  AddCreditsModal: ({ open }: { open: boolean }) => (open ? <div data-testid="add-credits-modal" /> : null),
}));

const feedback = (over: Partial<AiFeedback> = {}): AiFeedback => ({
  kind: 'NEEDS_CORRECTION',
  problems: [
    { field: 'fullDescription', message: 'Quita la promesa de salud' },
    { field: '', message: 'Falta la imagen principal' },
  ],
  attempt: 1,
  createdAt: '2026-11-17T10:00:00Z',
  ...over,
});

describe('AiFeedbackNotice', () => {
  it('lista los problemas con el nombre del campo en castellano, nunca la key', () => {
    render(<AiFeedbackNotice feedback={feedback()} productId="p1" />);
    expect(screen.getByText('Hay datos que debes corregir')).toBeInTheDocument();
    expect(screen.getByText('Descripción:')).toBeInTheDocument();
    expect(screen.queryByText(/fullDescription/)).toBeNull();
    expect(screen.getByText(/Falta la imagen principal/)).toBeInTheDocument();
  });

  it('explica que al reenviar se revisa de nuevo en segundos e indica el nº de revisión', () => {
    render(<AiFeedbackNotice feedback={feedback({ attempt: 2 })} productId="p1" />);
    expect(screen.getByText(/revisión nº 2/)).toBeInTheDocument();
    expect(screen.getByText(/lo revisaremos de nuevo en unos segundos/)).toBeInTheDocument();
  });

  it('en el detalle enlaza a la edición; en la edición salta al paso del campo', () => {
    const { unmount } = render(<AiFeedbackNotice feedback={feedback()} productId="p1" />);
    expect(screen.getByRole('link', { name: /Corregir ahora/ })).toHaveAttribute('href', '/dashboard/products/p1/edit');
    unmount();

    const onJump = vi.fn();
    render(<AiFeedbackNotice feedback={feedback()} productId="p1" onJumpToStep={onJump} />);
    fireEvent.click(screen.getByRole('button', { name: /Ir a «Básico»/ }));
    expect(onJump).toHaveBeenCalledWith('basic');
    expect(screen.queryByRole('link', { name: /Corregir ahora/ })).toBeNull();
  });

  it('una reversión del admin lo dice claramente', () => {
    render(
      <AiFeedbackNotice
        feedback={feedback({ kind: 'REVERTED', problems: [{ field: '', message: 'La foto no corresponde' }] })}
        productId="p1"
      />,
    );
    expect(screen.getByText('Un administrador ha revertido la publicación')).toBeInTheDocument();
    expect(screen.getByText(/La foto no corresponde/)).toBeInTheDocument();
  });

  it('mapea campos a etiqueta y paso', () => {
    expect(aiFieldLabel('productionInfo.story')).toBe('Historia del producto');
    expect(aiFieldStep('productionInfo.story')).toBe('production');
    expect(aiFieldLabel('algo_raro')).toBeNull();
  });

  describe('foto principal bloqueada', () => {
    const photoFeedback = () =>
      feedback({
        problems: [
          {
            field: 'mainImage',
            message: 'La foto principal no cumple el estándar de catálogo (fondo de cocina).',
            imageUrl: 'https://cdn/rechazada.jpg',
          },
        ],
      });

    beforeEach(() => {
      vi.clearAllMocks();
      aiApi.getAiAssistQuota.mockResolvedValue({ enabled: true, used: 1, total: 3 });
    });

    it('muestra la foto rechazada y propone generar una con IA gastando 1 crédito', async () => {
      render(
        <AiFeedbackNotice feedback={photoFeedback()} productId="p1" onJumpToStep={vi.fn()} onPhotoRegenerated={vi.fn()} />,
      );
      expect(screen.getByText('La foto principal no cumple el estándar de catálogo')).toBeInTheDocument();
      expect(screen.getByText(/fondo de cocina/)).toBeInTheDocument();
      expect(screen.getByAltText('Foto principal actual')).toHaveAttribute('src', 'https://cdn/rechazada.jpg');
      expect(screen.getByRole('button', { name: /Subir otra foto/ })).toBeInTheDocument();
      expect(await screen.findByText(/te quedan 2/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generar con IA · 1 crédito/ })).toBeEnabled();
    });

    it('al generar entrega la foto nueva para ponerla como principal y avisa de volver a publicar', async () => {
      const onPhoto = vi.fn();
      aiApi.regenerateProductPhoto.mockResolvedValue({ key: 'k/new.jpg', url: 'https://cdn/new.jpg' });
      render(<AiFeedbackNotice feedback={photoFeedback()} productId="p1" onJumpToStep={vi.fn()} onPhotoRegenerated={onPhoto} />);
      fireEvent.click(await screen.findByRole('button', { name: /Generar con IA/ }));
      await waitFor(() => expect(onPhoto).toHaveBeenCalledWith({ key: 'k/new.jpg', url: 'https://cdn/new.jpg' }));
      expect(aiApi.regenerateProductPhoto).toHaveBeenCalledWith('p1');
      expect(await screen.findByTestId('ai-photo-done')).toHaveTextContent(/vuelve a publicar/);
    });

    it('sin créditos ofrece conseguirlos en vez de generar', async () => {
      aiApi.getAiAssistQuota.mockResolvedValue({ enabled: true, used: 3, total: 3 });
      render(<AiFeedbackNotice feedback={photoFeedback()} productId="p1" onJumpToStep={vi.fn()} onPhotoRegenerated={vi.fn()} />);
      fireEvent.click(await screen.findByRole('button', { name: /Conseguir créditos/ }));
      expect(screen.getByTestId('add-credits-modal')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Generar con IA/ })).toBeNull();
    });

    it('si falla la generación muestra el error y no da la foto por buena', async () => {
      const onPhoto = vi.fn();
      aiApi.regenerateProductPhoto.mockRejectedValue(new Error('No se ha podido generar una foto válida'));
      render(<AiFeedbackNotice feedback={photoFeedback()} productId="p1" onJumpToStep={vi.fn()} onPhotoRegenerated={onPhoto} />);
      fireEvent.click(await screen.findByRole('button', { name: /Generar con IA/ }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/No se ha podido generar/);
      expect(onPhoto).not.toHaveBeenCalled();
    });

    it('en el detalle la opción de la IA se ve desde el primer momento, sin pulsar «Corregir ahora»', async () => {
      render(<AiFeedbackNotice feedback={photoFeedback()} productId="p1" onPhotoRegenerated={vi.fn()} />);
      expect(screen.getByTestId('ai-photo-block')).toBeInTheDocument();
      expect(screen.getByText('Que lo haga la IA')).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: /Generar con IA · 1 crédito/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Subir otra foto/ })).toHaveAttribute(
        'href',
        '/dashboard/products/p1/edit',
      );
    });

    it('en el detalle, tras generar guarda la foto y ofrece «Volver a publicar» en un clic', async () => {
      const onPhoto = vi.fn().mockResolvedValue(undefined);
      const onResubmit = vi.fn().mockResolvedValue(undefined);
      aiApi.regenerateProductPhoto.mockResolvedValue({ key: 'k/new.jpg', url: 'https://cdn/new.jpg' });
      render(
        <AiFeedbackNotice feedback={photoFeedback()} productId="p1" onPhotoRegenerated={onPhoto} onResubmit={onResubmit} />,
      );
      fireEvent.click(await screen.findByRole('button', { name: /Generar con IA/ }));
      fireEvent.click(await screen.findByTestId('ai-photo-resubmit'));
      await waitFor(() => expect(onResubmit).toHaveBeenCalled());
      expect(onPhoto).toHaveBeenCalledWith({ key: 'k/new.jpg', url: 'https://cdn/new.jpg' });
    });

    it('si guardar la foto falla, muestra el error y no ofrece volver a publicar', async () => {
      aiApi.regenerateProductPhoto.mockResolvedValue({ key: 'k/new.jpg', url: 'https://cdn/new.jpg' });
      render(
        <AiFeedbackNotice
          feedback={photoFeedback()}
          productId="p1"
          onPhotoRegenerated={vi.fn().mockRejectedValue(new Error('No se pudo guardar'))}
          onResubmit={vi.fn()}
        />,
      );
      fireEvent.click(await screen.findByRole('button', { name: /Generar con IA/ }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo guardar/);
      expect(screen.queryByTestId('ai-photo-resubmit')).toBeNull();
    });

    it('photoReason deja solo el motivo, sin la invitación final', () => {
      expect(
        photoReason(
          'La foto principal no cumple el estándar de catálogo (proporción no válida; fondo no blanco). Sube otra foto o deja que la IA genere una nueva a partir de esta (usa 1 crédito).',
        ),
      ).toBe('proporción no válida; fondo no blanco');
    });
  });

  describe('recomendación de alérgenos (la IA nunca los modifica)', () => {
    const allergenFeedback = (): AiFeedback =>
      feedback({
        problems: [
          {
            field: 'nutritionalInfo.allergens',
            message: 'Declara el alérgeno Lácteos.',
            suggestedValues: ['Lácteos'],
          },
        ],
      });

    it('muestra la recomendación con el campo en castellano y deja decidir al productor', () => {
      const onApply = vi.fn();
      const onJump = vi.fn();
      render(
        <AiFeedbackNotice
          feedback={allergenFeedback()}
          productId="p1"
          onJumpToStep={onJump}
          onApplyAllergens={onApply}
        />,
      );
      expect(screen.getByTestId('ai-allergen-suggestion')).toBeInTheDocument();
      expect(screen.getByText(/La IA no modifica los alérgenos/)).toBeInTheDocument();
      expect(onApply).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: /Revisar yo mismo/ }));
      expect(onJump).toHaveBeenCalledWith('nutritional');
    });

    it('«Añadir» aplica solo lo que falta y lo confirma', () => {
      const onApply = vi.fn();
      render(
        <AiFeedbackNotice
          feedback={allergenFeedback()}
          productId="p1"
          onJumpToStep={vi.fn()}
          currentAllergens={['Gluten']}
          onApplyAllergens={onApply}
        />,
      );
      fireEvent.click(screen.getByTestId('ai-allergen-apply'));
      expect(onApply).toHaveBeenCalledWith(['Lácteos']);
      expect(screen.getByRole('status')).toHaveTextContent(/Añadidos a tu ficha/);
    });

    it('los campos nutritionalInfo.* tienen etiqueta y paso', () => {
      expect(aiFieldLabel('nutritionalInfo.ingredients')).toBe('Ingredientes');
      expect(aiFieldStep('nutritionalInfo.allergens')).toBe('nutritional');
    });
  });

  describe('aprobación parcial', () => {
    it('explica que lo bueno ya está publicado y qué queda por rehacer', () => {
      render(
        <AiFeedbackNotice
          feedback={feedback({
            kind: 'PARTIAL',
            problems: [{ field: 'fullDescription', message: 'Quita la promesa de salud' }],
          })}
          productId="p1"
        />,
      );
      expect(screen.getByText('Hemos publicado parte de tus cambios')).toBeInTheDocument();
      expect(screen.getByTestId('ai-partial-note')).toHaveTextContent(/sigue a la venta/);
      expect(screen.getByTestId('ai-partial-note')).toHaveTextContent(/queda 1 campo/);
      expect(screen.getByText('Descripción:')).toBeInTheDocument();
    });
  });

  describe('foto sin relación con el producto', () => {
    const unrelatedFeedback = (): AiFeedback =>
      feedback({
        problems: [
          {
            field: 'mainImage',
            message:
              'La foto principal no parece corresponder a «Miel de romero» (se ve: un paisaje de montaña). El asistente de IA no puede generar una foto de producto a partir de una imagen que no tiene relación con él. Sube una foto real del producto.',
            imageUrl: 'https://cdn/x.jpg',
            unrelated: true,
          },
        ],
      });

    beforeEach(() => {
      vi.clearAllMocks();
      aiApi.getAiAssistQuota.mockResolvedValue({ enabled: true, used: 0, total: 3 });
    });

    it('avisa de que no hay relación, de que no se gasta crédito y NO ofrece generar con IA', () => {
      render(<AiFeedbackNotice feedback={unrelatedFeedback()} productId="p1" onPhotoRegenerated={vi.fn()} />);
      expect(screen.getByTestId('ai-photo-unrelated')).toBeInTheDocument();
      expect(screen.getByText('La foto no tiene relación con el producto')).toBeInTheDocument();
      expect(screen.getByTestId('ai-photo-unrelated-note')).toHaveTextContent(/En la foto se ve un paisaje de montaña\./);
      expect(screen.getByTestId('ai-photo-unrelated-note')).toHaveTextContent(/ningún crédito/);
      expect(screen.queryByRole('button', { name: /Generar con IA/ })).toBeNull();
      expect(screen.getByRole('link', { name: /Subir una foto real del producto/ })).toBeInTheDocument();
    });

    it('en el formulario el botón lleva al paso de imágenes', () => {
      const onJump = vi.fn();
      render(
        <AiFeedbackNotice feedback={unrelatedFeedback()} productId="p1" onJumpToStep={onJump} onPhotoRegenerated={vi.fn()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: /Subir una foto real del producto/ }));
      expect(onJump).toHaveBeenCalledWith('images');
    });

    it('unrelatedReason extrae qué se ve', () => {
      expect(unrelatedReason('x (se ve: una persona) y')).toBe('En la foto se ve una persona.');
      expect(unrelatedReason('sin detalle')).toBe('');
    });
  });
});
