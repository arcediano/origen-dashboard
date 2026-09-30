import { describe, it, expect } from 'vitest';
import { buildPublishChecklist, isPendingReview } from '@/lib/onboarding/publish-checklist';

describe('qué falta para publicar', () => {
  it('traduce bloqueos a acciones con enlace y omite el gate de revisión', () => {
    const list = buildPublishChecklist(['STATUS_NOT_ACTIVE:PENDING_VERIFICATION', 'MISSING_DELIVERY_OPTION', 'STRIPE_NOT_CONNECTED', 'MISSING_BUSINESS_NAME', 'DOCUMENT_MISSING:CIF']);
    expect(list.map((i) => i.href)).toEqual([
      '/dashboard/configuracion/envios', '/dashboard/account/payments', '/dashboard/profile/business', '/dashboard/profile/certifications',
    ]);
    expect(list[2].text).toMatch(/nombre del negocio/i);
  });
  it('ya no hay bloqueos de descripción/nombre de marca', () => {
    expect(buildPublishChecklist([]).length).toBe(0);
    expect(isPendingReview(['STATUS_NOT_ACTIVE:PENDING_VERIFICATION'])).toBe(true);
    expect(isPendingReview(['MISSING_LOGO'])).toBe(false);
  });
});
