/**
 * @component NotificationItem
 * @description Elemento individual de notificación — wrapper que usa NotificationCard
 */

'use client';

import { useRouter } from 'next/navigation';
import { NotificationCard } from '@arcediano/ux-library';
import type { Notification } from '@/types/notification';

/**
 * Valida que la URL de acción sea segura (solo rutas internas).
 * Bloquea URLs externas (http/https), protocolos peligrosos (javascript:)
 * y rutas de red (//dominio.com).
 */
function getSafeActionUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // Solo aceptar rutas relativas que comiencen con / pero no con //
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  return undefined;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: NotificationItemProps) {
  const router = useRouter();
  const safeUrl = getSafeActionUrl(notification.action?.url ?? notification.actionUrl);

  /**
   * Maneja el clic en la tarjeta de notificación
   */
  const handleClick = () => {
    // Marcar como leída si no está leída
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }

    // Navegar si hay URL segura
    if (safeUrl) {
      router.push(safeUrl);
    }

    // Cerrar el dropdown si aplica
    onClose?.();
  };

  /**
   * Delega el render visual a NotificationCard
   * Pasa los handlers como props para que el componente pueda invocarlos sin "use client"
   */
  return (
    <div
      role="button"
      tabIndex={0}
      className="cursor-pointer transition-colors"
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      <NotificationCard
        notification={notification}
        onMarkAsRead={!safeUrl ? onMarkAsRead : undefined}
        onClose={onClose}
      />
    </div>
  );
}