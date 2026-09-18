/**
 * @file notification-groups.test.ts
 * @description Tests para verificar que NOTIFICATION_GROUPS contiene
 * exactamente 31 eventos (incluyendo los 3 nuevos de P4/P5, y tras eliminar
 * ORDER_STATUS_CHANGED/ORDER_DELIVERED y añadir REVIEW_REQUEST,
 * PRODUCT_REVISION_APPROVED/REJECTED, PRODUCT_AUTO_UNPUBLISHED y
 * PRODUCER_DEBT_PENDING),
 * que ninguno de los nuevos tiene alwaysActive: true,
 * y que PROMOTION_CREATED está en el grupo 'marketing'.
 */

import { NOTIFICATION_GROUPS, ALWAYS_ACTIVE_EVENTS } from '@/lib/notifications/preferences-config';

describe('NOTIFICATION_GROUPS — P4/P5 nuevos eventos', () => {
  it('debe contener una entrada para PAYMENT_ACCOUNT_ACTION_REQUIRED', () => {
    const event = NOTIFICATION_GROUPS
      .flatMap(g => g.events)
      .find(e => e.eventType === 'PAYMENT_ACCOUNT_ACTION_REQUIRED');
    expect(event).toBeDefined();
    expect(event?.title).toBe('Tu cuenta de pagos necesita atención');
    expect(event?.alwaysActive).not.toBe(true);
  });

  it('debe contener una entrada para PAYMENT_ACCOUNT_RESTRICTED', () => {
    const event = NOTIFICATION_GROUPS
      .flatMap(g => g.events)
      .find(e => e.eventType === 'PAYMENT_ACCOUNT_RESTRICTED');
    expect(event).toBeDefined();
    expect(event?.title).toBe('Cobros pausados');
    expect(event?.alwaysActive).not.toBe(true);
  });

  it('debe contener una entrada para CERTIFICATION_PENDING', () => {
    const event = NOTIFICATION_GROUPS
      .flatMap(g => g.events)
      .find(e => e.eventType === 'CERTIFICATION_PENDING');
    expect(event).toBeDefined();
    expect(event?.title).toBe('Certificación en revisión');
    expect(event?.alwaysActive).not.toBe(true);
  });

  it('debe tener un grupo "marketing" que contenga PROMOTION_CREATED', () => {
    const marketingGroup = NOTIFICATION_GROUPS.find(g => g.id === 'marketing');
    expect(marketingGroup).toBeDefined();
    expect(marketingGroup?.label).toBe('Marketing');

    const promotionEvent = marketingGroup?.events.find(e => e.eventType === 'PROMOTION_CREATED');
    expect(promotionEvent).toBeDefined();
    expect(promotionEvent?.title).toBe('Tu campaña está activa');
  });

  it('debe contener exactamente 31 eventos en total (7 grupos)', () => {
    const totalEvents = NOTIFICATION_GROUPS.reduce((sum, g) => sum + g.events.length, 0);
    expect(totalEvents).toBe(31);
    expect(NOTIFICATION_GROUPS.length).toBe(7);
  });

  it('no debe contener ORDER_STATUS_CHANGED ni ORDER_DELIVERED (decisión del humano: el productor cambia el estado él mismo)', () => {
    const eventTypes = NOTIFICATION_GROUPS.flatMap(g => g.events).map(e => e.eventType);
    expect(eventTypes).not.toContain('ORDER_STATUS_CHANGED');
    expect(eventTypes).not.toContain('ORDER_DELIVERED');
  });

  it.each([
    'REVIEW_REQUEST',
    'PRODUCT_REVISION_APPROVED',
    'PRODUCT_REVISION_REJECTED',
    'PRODUCT_AUTO_UNPUBLISHED',
    'PRODUCER_DEBT_PENDING',
  ])('debe contener una entrada toggleable para %s', (eventType) => {
    const event = NOTIFICATION_GROUPS
      .flatMap(g => g.events)
      .find(e => e.eventType === eventType);
    expect(event).toBeDefined();
    expect(event?.alwaysActive).not.toBe(true);
  });

  it('PAYMENT_ACCOUNT_ACTION_REQUIRED no debe estar en ALWAYS_ACTIVE_EVENTS', () => {
    expect(ALWAYS_ACTIVE_EVENTS.has('PAYMENT_ACCOUNT_ACTION_REQUIRED')).toBe(false);
  });

  it('PAYMENT_ACCOUNT_RESTRICTED no debe estar en ALWAYS_ACTIVE_EVENTS', () => {
    expect(ALWAYS_ACTIVE_EVENTS.has('PAYMENT_ACCOUNT_RESTRICTED')).toBe(false);
  });

  it('CERTIFICATION_PENDING no debe estar en ALWAYS_ACTIVE_EVENTS', () => {
    expect(ALWAYS_ACTIVE_EVENTS.has('CERTIFICATION_PENDING')).toBe(false);
  });

  it('PROMOTION_CREATED no debe estar en ALWAYS_ACTIVE_EVENTS', () => {
    expect(ALWAYS_ACTIVE_EVENTS.has('PROMOTION_CREATED')).toBe(false);
  });

  it('los 3 nuevos eventos de pago/certificación deben usar iconos correctos', () => {
    const paymentActionEvent = NOTIFICATION_GROUPS
      .flatMap(g => g.events)
      .find(e => e.eventType === 'PAYMENT_ACCOUNT_ACTION_REQUIRED');
    const paymentRestrictedEvent = NOTIFICATION_GROUPS
      .flatMap(g => g.events)
      .find(e => e.eventType === 'PAYMENT_ACCOUNT_RESTRICTED');
    const certEvent = NOTIFICATION_GROUPS
      .flatMap(g => g.events)
      .find(e => e.eventType === 'CERTIFICATION_PENDING');

    expect(paymentActionEvent?.icon).toBeDefined();
    expect(paymentRestrictedEvent?.icon).toBeDefined();
    expect(certEvent?.icon).toBeDefined();
  });
});
