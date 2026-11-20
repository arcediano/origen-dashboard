import { describe, it, expect } from 'vitest';
import { mapBlockerToText } from '@/lib/readiness-blockers';

describe('mapBlockerToText — documentos', () => {
  it('un CIF pendiente de validación se explica como tal', () => {
    expect(mapBlockerToText('DOCUMENT_PENDING:CIF')).toMatch(/pendiente de validación/);
  });
});

describe('mapBlockerToText — estado de pago de Stripe', () => {
  it('sin estado de pago mantiene el texto de conectar la cuenta', () => {
    expect(mapBlockerToText('STRIPE_NOT_CONNECTED')).toMatch(/Conecta tu cuenta de pagos/);
  });

  it('con la cuenta en validación explica que Stripe la está validando (no «pausada»)', () => {
    const text = mapBlockerToText('STRIPE_NOT_CONNECTED', 'PENDING_VERIFICATION');
    expect(text).toMatch(/Stripe está validando/);
    expect(text).not.toMatch(/pausad|Conecta/i);
  });

  it('distingue información pendiente y restricción real', () => {
    expect(mapBlockerToText('STRIPE_NOT_CONNECTED', 'ACTION_REQUIRED')).toMatch(/más información/);
    expect(mapBlockerToText('STRIPE_NOT_CONNECTED', 'RESTRICTED')).toMatch(/restringido/);
  });

  it('el estado de pago no afecta a otros bloqueos', () => {
    expect(mapBlockerToText('MISSING_LOGO', 'PENDING_VERIFICATION')).toBe('Sube el logo de tu negocio');
  });
});
