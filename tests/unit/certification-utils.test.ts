import { describe, expect, it } from 'vitest';
import {
  countDocumentStates,
  hasDocumentReference,
  isExpiringSoon,
  shouldConfirmReplacement,
} from '@/app/dashboard/profile/certifications/certification-utils';

describe('certification-utils', () => {
  it('detecta un reemplazo que requiere confirmacion solo cuando el documento esta verificado', () => {
    expect(shouldConfirmReplacement('VERIFIED')).toBe(true);
    expect(shouldConfirmReplacement('PENDING')).toBe(false);
    expect(shouldConfirmReplacement(null)).toBe(false);
  });

  it('detecta si existe referencia de documento para abrir o descargar', () => {
    expect(hasDocumentReference('doc-1', null)).toBe(true);
    expect(hasDocumentReference(null, 'https://cdn.example.com/doc.pdf')).toBe(true);
    expect(hasDocumentReference(null, null)).toBe(false);
  });

  it('cuenta estados y próximos a caducar de forma agregada', () => {
    const stats = countDocumentStates([
      { status: 'VERIFIED', expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
      { status: 'PENDING', expiresAt: null },
      { status: 'REJECTED', expiresAt: null },
      { status: 'EXPIRED', expiresAt: null },
    ]);

    expect(stats).toEqual({
      verified: 1,
      pending: 1,
      rejected: 1,
      expired: 1,
      expiringSoon: 1,
    });
  });

  it('marca como pronto a caducar solo un certificado verificado dentro de la ventana configurada', () => {
    expect(isExpiringSoon(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString())).toBe(true);
    expect(isExpiringSoon(new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString())).toBe(false);
  });
});