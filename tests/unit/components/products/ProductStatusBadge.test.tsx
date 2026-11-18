import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProductStatusBadge } from '@/app/dashboard/products/components/ProductStatusBadge';

describe('ProductStatusBadge', () => {
  it('muestra «Corregir datos» en un borrador devuelto por la IA', () => {
    render(<ProductStatusBadge product={{ status: 'draft', aiCorrectionPending: true }} />);
    expect(screen.getByText('Corregir datos')).toBeTruthy();
  });

  it('un borrador normal sigue mostrando su estado habitual', () => {
    render(<ProductStatusBadge product={{ status: 'draft' }} />);
    expect(screen.queryByText('Corregir datos')).toBeNull();
  });

  it('el aviso solo aplica a borradores', () => {
    render(<ProductStatusBadge product={{ status: 'active', aiCorrectionPending: true }} />);
    expect(screen.queryByText('Corregir datos')).toBeNull();
  });
});
