/**
 * @deprecated Ruta legacy — redirigida a /dashboard/profile/business según ADR-001.
 */
import { redirect } from 'next/navigation';

export default function BusinessPage() {
  redirect('/dashboard/profile/business');
}
