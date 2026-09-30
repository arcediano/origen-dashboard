/**
 * Pantalla final del onboarding: "qué falta para publicar".
 * Traduce los bloqueos de readiness (`GET producers/me/readiness`) a acciones
 * concretas con enlace directo a la pantalla que las resuelve.
 */

import { mapBlockerToText } from '@/lib/readiness-blockers';

export interface ChecklistItem {
  code: string;
  text: string;
  href: string;
  cta: string;
}

const ROUTES = {
  shipping: '/dashboard/configuracion/envios',
  payments: '/dashboard/account/payments',
  business: '/dashboard/profile/business',
  certifications: '/dashboard/profile/certifications',
} as const;

function actionFor(code: string): Pick<ChecklistItem, 'href' | 'cta'> {
  if (code === 'MISSING_DELIVERY_OPTION') return { href: ROUTES.shipping, cta: 'Configurar envíos' };
  if (code === 'STRIPE_NOT_CONNECTED') return { href: ROUTES.payments, cta: 'Conectar Stripe' };
  if (code.startsWith('DOCUMENT_')) return { href: ROUTES.certifications, cta: 'Revisar documentos' };
  if (code === 'MISSING_BUSINESS_NAME') return { href: ROUTES.business, cta: 'Añadir nombre' };
  return { href: ROUTES.business, cta: 'Completar en Mi negocio' };
}

/**
 * Bloqueos accionables por el productor. `STATUS_NOT_ACTIVE:*` no entra: es la
 * revisión manual del equipo de Origen, no algo que el productor pueda rellenar.
 */
export function buildPublishChecklist(blockers: string[]): ChecklistItem[] {
  return blockers
    .filter((b) => !b.startsWith('STATUS_NOT_ACTIVE:'))
    .map((code) => ({ code, text: mapBlockerToText(code), ...actionFor(code) }));
}

/** El equipo de Origen está revisando el perfil (estado pendiente de verificación). */
export function isPendingReview(blockers: string[]): boolean {
  return blockers.some((b) => b === 'STATUS_NOT_ACTIVE:PENDING_VERIFICATION');
}
