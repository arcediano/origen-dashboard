/**
 * @deprecated Ruta legacy — redirigida a /dashboard/profile según ADR-001
 */
import { redirect } from 'next/navigation';

export default function ConfiguracionPerfilPage() {
  redirect('/dashboard/profile');
}
