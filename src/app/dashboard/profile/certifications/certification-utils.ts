export type DocStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED';

export const EXPIRING_SOON_DAYS = 30;

/** Acepta claves S3 del media-service: producers/{id}/documents/... o documents/... */
const S3_KEY_RE = /^(producers\/[\w-]+\/)?documents\/[\w\-.\/]+$/;

/**
 * Devuelve true si el valor es una URL absoluta válida o una clave S3 del media-service.
 * Rechaza identificadores legacy, de seed o cualquier string arbitrario.
 */
export function isValidDocumentRef(value: string | null | undefined): boolean {
  if (!value) return false;
  if (/^https?:\/\//i.test(value)) return true;
  return S3_KEY_RE.test(value);
}

export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(expiresAt: string | null): boolean {
  const days = daysUntilExpiry(expiresAt);
  return days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS;
}

export function shouldConfirmReplacement(status: DocStatus | null): boolean {
  return status === 'VERIFIED';
}

export function hasDocumentReference(documentRef: string | null, documentUrl: string | null): boolean {
  return isValidDocumentRef(documentUrl) || isValidDocumentRef(documentRef);
}

export function countDocumentStates(items: Array<{ status: DocStatus | null; expiresAt: string | null }>) {
  return {
    verified: items.filter((item) => item.status === 'VERIFIED').length,
    pending: items.filter((item) => item.status === 'PENDING').length,
    rejected: items.filter((item) => item.status === 'REJECTED').length,
    expired: items.filter((item) => item.status === 'EXPIRED').length,
    expiringSoon: items.filter((item) => item.status === 'VERIFIED' && isExpiringSoon(item.expiresAt)).length,
  };
}