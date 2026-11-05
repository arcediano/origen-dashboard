/**
 * Tipos compartidos del asistente de IA "Origen Assist".
 *
 * El resto de este fichero (lógica del antiguo F1 "lectura de etiqueta") se
 * retiró (petición del humano, 2026-11-03): código muerto, el wizard F1 fue
 * sustituido por la máquina de pasos fija desde el rediseño v2 del backend
 * (2026-10-26) -- confirmado sin referencias vivas en el resto del repo.
 */

export interface AiAssistQuota {
  enabled: boolean;
  used: number;
  total: number;
  /** Productos con asistente incluidos gratis. */
  free?: number;
  /** Créditos comprados por el productor. */
  purchased?: number;
}
