/**
 * Modo mantenimiento — utilidades compartidas (cliente y servidor)
 *
 * Contrato con el gateway (activado desde origen-admin):
 *   - GET /api/v1/site-status (público) → { maintenanceMode, maintenanceMessage, ... }
 *   - Con el modo activo, el resto de rutas (salvo /auth/*, /health, /site-status y
 *     administradores) responden HTTP 503 con { success:false, code:'MAINTENANCE', message }.
 *
 * Este módulo NO importa nada de next/* para poder usarse en el browser y en tests.
 */

export const MAINTENANCE_CODE = 'MAINTENANCE';

export const DEFAULT_MAINTENANCE_MESSAGE =
  'Estamos realizando tareas de mantenimiento. Volveremos en breve.';

export interface SiteStatus {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  marketplaceName?: string;
  openProducerRegistration?: boolean;
}

/** ¿Es este status + cuerpo la respuesta de mantenimiento del gateway? */
export function isMaintenanceResponse(status: number, data: unknown): boolean {
  return (
    status === 503 &&
    typeof data === 'object' &&
    data !== null &&
    (data as { code?: unknown }).code === MAINTENANCE_CODE
  );
}

/** Extrae el mensaje del cuerpo 503 (o el texto por defecto). */
export function getMaintenanceMessage(data: unknown): string {
  const message = (data as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message.trim() ? message : DEFAULT_MAINTENANCE_MESSAGE;
}

/** Normaliza el cuerpo de /site-status; devuelve null si no tiene la forma esperada (fail-open). */
export function parseSiteStatus(body: unknown): SiteStatus | null {
  if (typeof body !== 'object' || body === null) return null;
  // El gateway puede envolver la respuesta en { data: {...} }
  const raw = ('data' in body && typeof (body as { data: unknown }).data === 'object' && (body as { data: unknown }).data !== null
    ? (body as { data: Record<string, unknown> }).data
    : body) as Record<string, unknown>;
  if (typeof raw.maintenanceMode !== 'boolean') return null;
  return {
    maintenanceMode: raw.maintenanceMode,
    maintenanceMessage:
      typeof raw.maintenanceMessage === 'string' ? raw.maintenanceMessage : '',
    marketplaceName: typeof raw.marketplaceName === 'string' ? raw.marketplaceName : undefined,
    openProducerRegistration:
      typeof raw.openProducerRegistration === 'boolean' ? raw.openProducerRegistration : undefined,
  };
}

// ─── Estado en cliente (store mínimo para useSyncExternalStore) ──────────────

export interface MaintenanceState {
  active: boolean;
  message: string;
}

const INACTIVE: MaintenanceState = { active: false, message: '' };
let state: MaintenanceState = INACTIVE;
const listeners = new Set<() => void>();

export function getMaintenanceState(): MaintenanceState {
  return state;
}

export function getServerMaintenanceState(): MaintenanceState {
  return INACTIVE;
}

export function subscribeMaintenance(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Marca el modo mantenimiento como activo en el cliente. Idempotente. */
export function activateMaintenance(message?: string): void {
  const next = message?.trim() || DEFAULT_MAINTENANCE_MESSAGE;
  if (state.active && state.message === next) return;
  state = { active: true, message: next };
  listeners.forEach((l) => l());
}

/** Solo para tests. */
export function resetMaintenanceState(): void {
  state = INACTIVE;
  listeners.forEach((l) => l());
}

/**
 * Si la respuesta es el 503 MAINTENANCE del gateway, activa la pantalla.
 * Usa clone() para no consumir el cuerpo que leerá el llamante.
 * @returns true si era una respuesta de mantenimiento.
 */
export async function detectMaintenanceResponse(response: Response): Promise<boolean> {
  if (response.status !== 503) return false;
  try {
    const data: unknown = await response.clone().json();
    if (isMaintenanceResponse(response.status, data)) {
      activateMaintenance(getMaintenanceMessage(data));
      return true;
    }
  } catch {
    // cuerpo no JSON → es un 503 normal, no mantenimiento
  }
  return false;
}

const GUARD_MARK = '__maintenanceGuard';

/**
 * Red de seguridad global: envuelve window.fetch para que CUALQUIER petición del
 * cliente (gatewayClient, subidas, rutas /api de Next, …) que reciba el 503
 * MAINTENANCE muestre la pantalla. No altera la respuesta ni reintenta.
 * Idempotente y tolerante: si window.fetch no es reasignable, no hace nada
 * (gatewayClient sigue detectando el 503 por sí mismo).
 */
export function installMaintenanceFetchGuard(): void {
  if (typeof window === 'undefined') return;
  const current = window.fetch as typeof fetch & { [GUARD_MARK]?: boolean };
  if (typeof current !== 'function' || current[GUARD_MARK]) return;
  const originalFetch = current.bind(window);
  const guarded = (async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);
    if (response.status === 503) {
      await detectMaintenanceResponse(response);
    }
    return response;
  }) as typeof fetch & { [GUARD_MARK]?: boolean };
  guarded[GUARD_MARK] = true;
  try {
    window.fetch = guarded;
  } catch {
    // fetch no reasignable en este entorno
  }
}
