import { describe, it, expect } from 'vitest';
import { mapBlockerToText } from '@/lib/readiness-blockers';

describe('mapBlockerToText — documentos', () => {
  it('un CIF pendiente de validación se explica como tal', () => {
    expect(mapBlockerToText('DOCUMENT_PENDING:CIF')).toMatch(/pendiente de validación/);
  });
});
