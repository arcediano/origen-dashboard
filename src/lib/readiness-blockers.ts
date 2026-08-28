/**
 * Traduce los códigos de bloqueo que devuelve ProducerReadinessService
 * (origen-master-microservices/readiness.service.ts) a texto legible en
 * es-ES. Deben mantenerse en sincronía con los códigos reales del backend
 * -- ver blockers[] en buildReport().
 *
 * Compartido entre el checklist de /dashboard/profile/business y el resumen
 * de visibilidad del header (UserMenu) para que ambos muestren el mismo
 * motivo legible en vez de duplicar (y potencialmente desincronizar) la
 * traducción en cada sitio.
 */

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  CIF: 'CIF/NIF',
  SEGURO_RC: 'seguro de responsabilidad civil',
  MANIPULADOR_ALIMENTOS: 'manipulador de alimentos',
};

const PRODUCER_STATUS_LABEL: Record<string, string> = {
  PENDING_VERIFICATION: 'Tu perfil está pendiente de revisión por nuestro equipo (24-48h)',
  SUSPENDED: 'Tu cuenta está suspendida — contacta con soporte',
  REJECTED: 'Tu perfil fue rechazado en la revisión — contacta con soporte',
};

const BLOCKER_TEXT_MAP: Record<string, string> = {
  MISSING_TAX_ID: 'CIF/NIF requerido',
  MISSING_BUSINESS_NAME: 'Nombre fiscal del negocio requerido',
  MISSING_ENTITY_TYPE: 'Tipo de entidad requerido',
  MISSING_CATEGORIES: 'Selecciona al menos una categoría de productos',
  MISSING_LOCATION: 'Completa ciudad, provincia y código postal',
  MISSING_BRAND_NAME: 'El nombre comercial debe tener al menos 3 caracteres',
  MISSING_DESCRIPTION: 'La descripción debe tener al menos 50 caracteres',
  MISSING_LOGO: 'Sube el logo de tu negocio',
  MISSING_DELIVERY_OPTION: 'Añade al menos un método de envío activo',
  STRIPE_NOT_CONNECTED: 'Conecta tu cuenta de pagos (Stripe)',
};

/** Mapea un código de blocker de readiness a texto legible para mostrar en UI. */
export function mapBlockerToText(blocker: string): string {
  if (BLOCKER_TEXT_MAP[blocker]) return BLOCKER_TEXT_MAP[blocker];

  if (blocker.startsWith('STATUS_NOT_ACTIVE:')) {
    const status = blocker.split(':')[1];
    return PRODUCER_STATUS_LABEL[status] ?? 'Tu perfil aún no está activo';
  }

  const [docPrefix, docType] = blocker.split(':');
  const docLabel = docType ? (DOCUMENT_TYPE_LABEL[docType] ?? docType) : '';
  if (docPrefix === 'DOCUMENT_MISSING') return `Sube el documento de ${docLabel}`;
  if (docPrefix === 'DOCUMENT_EXPIRED') return `El documento de ${docLabel} ha caducado — súbelo de nuevo`;
  if (docPrefix === 'DOCUMENT_REJECTED') return `El documento de ${docLabel} fue rechazado — súbelo de nuevo`;

  return blocker;
}

/**
 * Separa el blocker de estado del productor (STATUS_NOT_ACTIVE:*, gate de
 * revisión manual del equipo, no un campo que el productor pueda rellenar)
 * del resto de blockers de campos de perfil.
 */
export function splitStatusBlocker(blockers: string[]): {
  statusBlocker: string | undefined;
  fieldBlockers: string[];
} {
  return {
    statusBlocker: blockers.find((b) => b.startsWith('STATUS_NOT_ACTIVE:')),
    fieldBlockers: blockers.filter((b) => !b.startsWith('STATUS_NOT_ACTIVE:')),
  };
}
