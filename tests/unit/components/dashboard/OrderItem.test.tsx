/**
 * @file OrderItem.test.tsx
 * @description Tests unitarios para el componente OrderItem (widget "Pedidos
 * recientes" de la portada del dashboard).
 *
 * Verifica que cada estado, incluido 'returned', renderiza su propia
 * etiqueta — evita la regresión donde 'returned' se mostraba como "Cancelado".
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderItem } from '@/components/features/dashboard/components/recent/order-item';

const baseProps = {
  id: 'ord-1',
  orderNumber: 'ORG-2024-00001',
  customer: 'Ana García',
  items: 2,
  total: 45.9,
  date: '30 ago',
};

describe('OrderItem', () => {
  it('muestra "Devolución solicitada" para el estado returned, no "Cancelado"', () => {
    render(<OrderItem {...baseProps} status="returned" />);

    expect(screen.getByText('Devolución solicitada')).toBeDefined();
    expect(screen.queryByText('Cancelado')).toBeNull();
  });

  it('sigue mostrando "Cancelado" para el estado cancelled (sin regresión)', () => {
    render(<OrderItem {...baseProps} status="cancelled" />);

    expect(screen.getByText('Cancelado')).toBeDefined();
  });

  it.each([
    ['pending', 'Pendiente'],
    ['processing', 'Procesando'],
    ['shipped', 'Enviado'],
    ['delivered', 'Entregado'],
  ] as const)('muestra la etiqueta correcta para el estado %s', (status, label) => {
    render(<OrderItem {...baseProps} status={status} />);
    expect(screen.getByText(label)).toBeDefined();
  });
});
