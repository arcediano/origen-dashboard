import { redirect } from 'next/navigation';

/**
 * Redirect: /dashboard/configuracion/pagos → /dashboard/account/payments
 *
 * Esta página redirecciona server-side a la nueva ubicación del panel de cobros.
 * Se utiliza el patrón de redirect de Next.js para mantener compatibilidad con
 * enlaces antiguos y flujos internos.
 */
export default function LegacyPagosPage() {
  redirect('/dashboard/account/payments');
}
