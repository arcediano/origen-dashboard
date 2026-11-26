import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SmallBasketNoticeView } from '@/components/shared/SmallBasketNotice';

describe('SmallBasketNoticeView', () => {
  it('muestra importe mínimo, penalización y comisión tal como vienen de la configuración', () => {
    render(<SmallBasketNoticeView terms={{ commissionRate: 0.12, smallBasketThreshold: 5, smallBasketFee: 0.5 }} />);
    const t = screen.getByTestId('small-basket-notice').textContent ?? '';
    expect(t).toMatch(/5,00\s*€/);
    expect(t).toMatch(/0,50\s*€/);
    expect(t).toContain('12 %');
    expect(t).toContain('Tu cliente no paga nada extra');
  });
  it('usa los valores configurados (no cifras fijas)', () => {
    render(<SmallBasketNoticeView terms={{ commissionRate: 0.1, smallBasketThreshold: 8, smallBasketFee: 1 }} />);
    const t = screen.getByTestId('small-basket-notice').textContent ?? '';
    expect(t).toMatch(/8,00\s*€/);
    expect(t).toMatch(/1,00\s*€/);
    expect(t).toContain('10 %');
  });
  it('no se muestra si el admin desactiva la penalización', () => {
    const { container } = render(<SmallBasketNoticeView terms={{ commissionRate: 0.12, smallBasketThreshold: 0, smallBasketFee: 0.5 }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
