/**
 * @deprecated Ruta legacy -- redirigida a rutas canonicas segun ADR-001.
 * Seguridad: /dashboard/security
 * Notificaciones: /dashboard/notifications
 * Cuenta: /dashboard/account
 */
import { redirect } from 'next/navigation';

export default function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams?.tab;
  if (tab === 'security' || tab === 'password' || tab === '2fa') {
    redirect('/dashboard/security');
  }
  if (tab === 'notifications') {
    redirect('/dashboard/notifications');
  }
  redirect('/dashboard/account');
}
