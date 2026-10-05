import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CreateProductCancelDialog } from '@/app/dashboard/products/components/ProductDialogs/CreateProductCancelDialog';

// En el entorno de tests `ConfirmDialog` de la librería se renderiza como un
// elemento que expone sus props como atributos: se comprueba el `body` recibido.
const bodyOf = (container: HTMLElement) =>
  container.querySelector('[body]')?.getAttribute('body') ?? '';

describe('CreateProductCancelDialog', () => {
  it('sin uso del asistente de IA no menciona las plazas de IA', () => {
    const { container } = render(
      <CreateProductCancelDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(bodyOf(container)).toContain('perderás todos los cambios que no hayas guardado');
    expect(bodyOf(container)).not.toContain('plazas de productos con IA');
  });

  it('con el asistente de IA usado y sin guardar avisa de que no queda borrador y el crédito no se recupera', () => {
    const { container } = render(
      <CreateProductCancelDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} aiAssistUsed />,
    );
    expect(bodyOf(container)).toContain('no se guarda como borrador');
    expect(bodyOf(container)).toContain('crédito del asistente de IA');
  });
});
