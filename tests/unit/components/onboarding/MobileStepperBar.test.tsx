import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileStepperBar } from '@/components/features/onboarding/components/MobileStepperBar';

// Mock scrollIntoView since happy-dom doesn't implement it natively
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

const MOCK_STEPS = [
  { id: 1, title: 'Información básica' },
  { id: 2, title: 'Datos bancarios' },
  { id: 3, title: 'Documentación' },
  { id: 4, title: 'Verificación' },
  { id: 5, title: 'Confirmación' },
  { id: 6, title: 'Foto de perfil' },
  { id: 7, title: 'Finalización' },
];

describe('MobileStepperBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScrollIntoView.mockClear();
  });

  describe('Rendering', () => {
    it('renderiza 7 puntos con currentStep = 0', () => {
      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={0}
          onStepClick={vi.fn()}
        />
      );

      // Verificar que hay 7 botones/elementos listitem
      const listitems = screen.getAllByRole('listitem');
      expect(listitems).toHaveLength(7);
    });

    it('muestra el contenedor con role="list" y aria-label correcto', () => {
      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={0}
          onStepClick={vi.fn()}
        />
      );

      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Progreso del onboarding');
    });

    it('muestra el texto "Paso X de Y" con el paso activo', () => {
      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={vi.fn()}
        />
      );

      expect(screen.getByText(/Paso 4 de 7/)).toBeInTheDocument();
      expect(screen.getByText('Verificación')).toBeInTheDocument();
    });
  });

  describe('Step States', () => {
    it('marca el primer punto como activo en currentStep = 0', () => {
      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={0}
          onStepClick={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('aria-current', 'step');
    });

    it('marca puntos 0-2 como completados, 3 como activo, 4-6 como pendientes en currentStep = 3', () => {
      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');

      // Puntos 0-2 deberían ser clicables (completados)
      expect(buttons[0]).toBeInTheDocument();
      expect(buttons[1]).toBeInTheDocument();
      expect(buttons[2]).toBeInTheDocument();

      // Punto 3 es el activo
      expect(buttons[3]).toHaveAttribute('aria-current', 'step');

      // Puntos 4-6 no deberían tener <button> (no clicables)
      // Esto se verifica indirectamente por la cantidad de botones
      expect(buttons).toHaveLength(4); // 0-3 son los únicos clicables
    });

    it('marca solo el punto activo con aria-current="step"', () => {
      const { rerender } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={0}
          onStepClick={vi.fn()}
        />
      );

      let buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('aria-current', 'step');
      expect(buttons[1]).not.toHaveAttribute('aria-current');

      // Cambiar al paso 2
      rerender(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={2}
          onStepClick={vi.fn()}
        />
      );

      buttons = screen.getAllByRole('button');
      expect(buttons[2]).toHaveAttribute('aria-current', 'step');
      expect(buttons[0]).not.toHaveAttribute('aria-current');
      expect(buttons[1]).not.toHaveAttribute('aria-current');
    });
  });

  describe('Interactivity', () => {
    it('invoca onStepClick con el índice correcto al hacer clic en un punto completado', async () => {
      const onStepClick = vi.fn();
      const user = userEvent.setup();

      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={onStepClick}
        />
      );

      const buttons = screen.getAllByRole('button');
      await user.click(buttons[1]); // Clic en el punto 1 (completado)

      expect(onStepClick).toHaveBeenCalledWith(1);
      expect(onStepClick).toHaveBeenCalledTimes(1);
    });

    it('no invoca onStepClick cuando no se proporciona', () => {
      const { container } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={0}
        />
      );

      // Sin onStepClick, todos los puntos deberían ser div no-clicables
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('solo permite hacer clic en puntos completados y el activo', async () => {
      const onStepClick = vi.fn();
      const user = userEvent.setup();

      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={2}
          onStepClick={onStepClick}
        />
      );

      const buttons = screen.getAllByRole('button');

      // Puntos 0-2 deberían ser clicables
      expect(buttons).toHaveLength(3);

      await user.click(buttons[0]);
      expect(onStepClick).toHaveBeenCalledWith(0);

      await user.click(buttons[2]);
      expect(onStepClick).toHaveBeenCalledWith(2);
    });
  });

  describe('Accessibility', () => {
    it('proporciona aria-label descriptivo para cada punto clicable', () => {
      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={0}
          onStepClick={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('aria-label', 'Ir al paso 1: Información básica');
      expect(buttons[1]).toHaveAttribute('aria-label', 'Ir al paso 2: Datos bancarios');
    });

    it('expone structure de lista accesible (list > listitem)', () => {
      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={vi.fn()}
        />
      );

      const list = screen.getByRole('list');
      const listitems = screen.getAllByRole('listitem');

      expect(list).toBeInTheDocument();
      expect(listitems).toHaveLength(7);

      // Verificar que cada listitem está dentro del list
      listitems.forEach((item) => {
        expect(list).toContainElement(item);
      });
    });

    it('tiene anillo de foco visible en puntos clicables', () => {
      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={0}
          onStepClick={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');

      // Verificar que los botones tienen las clases de foco
      buttons.forEach((button) => {
        expect(button).toHaveClass('focus-visible:outline-none');
        expect(button).toHaveClass('focus-visible:ring-2');
        expect(button).toHaveClass('focus-visible:ring-origen-bosque');
        expect(button).toHaveClass('focus-visible:ring-offset-2');
        expect(button).toHaveClass('focus-visible:ring-offset-surface-alt');
      });
    });
  });

  describe('Auto-scroll behavior', () => {
    it('invoca scrollIntoView al montar con comportamiento "auto"', () => {
      mockScrollIntoView.mockClear();

      render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={vi.fn()}
        />
      );

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        inline: 'center',
        block: 'nearest',
      });
    });

    it('invoca scrollIntoView cuando currentStep cambia con comportamiento "smooth"', () => {
      mockScrollIntoView.mockClear();

      const { rerender } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={0}
          onStepClick={vi.fn()}
        />
      );

      // Primera invocación (mount) con 'auto'
      expect(mockScrollIntoView).toHaveBeenNthCalledWith(1, {
        behavior: 'auto',
        inline: 'center',
        block: 'nearest',
      });

      mockScrollIntoView.mockClear();

      // Cambiar a paso 3
      rerender(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={vi.fn()}
        />
      );

      // Segunda invocación (cambio) con 'smooth'
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });

    it('invoca scrollIntoView con el nodo correcto del paso activo', () => {
      mockScrollIntoView.mockClear();

      const { rerender } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={0}
          onStepClick={vi.fn()}
        />
      );

      mockScrollIntoView.mockClear();

      // Cambiar a paso 5
      rerender(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={5}
          onStepClick={vi.fn()}
        />
      );

      // scrollIntoView debe haber sido llamado
      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });

  describe('Visual sizes and classes', () => {
    it('aplica w-11 h-11 (44×44px) al punto completado', () => {
      const { container } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={2}
          onStepClick={vi.fn()}
        />
      );

      // Los puntos completados (0-1) deben tener w-11 h-11 en su div interior
      const w11Divs = container.querySelectorAll('div.w-11.h-11');
      // Esperamos al menos 2 puntos completados (índices 0 y 1) cuando currentStep=2
      expect(w11Divs.length).toBeGreaterThanOrEqual(2);
      // Verificar que contiene las clases específicas
      expect(container.innerHTML).toContain('w-11');
      expect(container.innerHTML).toContain('h-11 bg-origen-hoja');
    });

    it('aplica w-11 h-11 con ring y offset al punto activo', () => {
      const { container } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={2}
          onStepClick={vi.fn()}
        />
      );

      // El punto activo debe tener w-11 h-11 + ring decorativo
      expect(container.innerHTML).toContain('w-11 h-11 bg-origen-pradera');
      expect(container.innerHTML).toContain('ring-2 ring-origen-pradera/30');
      expect(container.innerHTML).toContain('ring-offset-2 ring-offset-surface-alt');
    });

    it('aplica w-2.5 h-2.5 (10px) al punto pendiente', () => {
      const { container } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={1}
          onStepClick={vi.fn()}
        />
      );

      // Los puntos pendientes (2-6) deben tener w-2.5 h-2.5
      expect(container.innerHTML).toContain('w-2.5 h-2.5 bg-border');
      // Verificar que existen divs con esas clases
      const w2_5Divs = container.querySelectorAll('div.w-2\\.5.h-2\\.5');
      // Cuando currentStep=1, puntos 2-6 son pendientes = 5 puntos
      expect(w2_5Divs.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Connector styling', () => {
    it('aplica min-w-6 max-w-16 al conector', () => {
      const { container } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={vi.fn()}
        />
      );

      // Los conectores (divs entre puntos) deben tener estas clases
      // Esto es un test indirecto del DOM generado
      expect(container.innerHTML).toContain('min-w-6');
      expect(container.innerHTML).toContain('max-w-16');
    });
  });

  describe('Container styling', () => {
    it('aplica overflow-x-auto y scrollbar-hide al contenedor', () => {
      const { container } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={vi.fn()}
        />
      );

      const list = screen.getByRole('list');
      expect(list).toHaveClass('overflow-x-auto');
      expect(list).toHaveClass('scrollbar-hide');
    });

    it('aplica flex-nowrap al contenedor', () => {
      const { container } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={vi.fn()}
        />
      );

      const list = screen.getByRole('list');
      expect(list).toHaveClass('flex-nowrap');
    });

    it('aplica -mx-4 px-4 al contenedor para scroll horizonal edge-to-edge', () => {
      const { container } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={3}
          onStepClick={vi.fn()}
        />
      );

      const list = screen.getByRole('list');
      expect(list).toHaveClass('-mx-4');
      expect(list).toHaveClass('px-4');
    });
  });

  describe('Margin adjustment', () => {
    it('aplica mt-2 al párrafo de etiqueta de paso', () => {
      const { container } = render(
        <MobileStepperBar
          steps={MOCK_STEPS}
          currentStep={2}
          onStepClick={vi.fn()}
        />
      );

      const paragraph = container.querySelector('p.text-xs.text-muted-foreground');
      expect(paragraph).toHaveClass('mt-2');
    });
  });
});
