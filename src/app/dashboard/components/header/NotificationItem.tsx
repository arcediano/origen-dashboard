/**
 * @component NotificationItem
 * @description Elemento individual de notificación
 */

'use client';

import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Package,
  ShoppingBag,
  Award,
  AlertCircle,
} from 'lucide-react';
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
  onClose 
}: NotificationItemProps) {
  const router = useRouter();
  const safeUrl = getSafeActionUrl(notification.action?.url ?? notification.actionUrl);

  // ==========================================================================
  // FUNCIONES AUXILIARES
  // ==========================================================================

  /**
   * Obtiene el icono según el tipo de notificación
   */
  const getIcon = () => {
    switch (notification.type) {
      case 'product':
        return <Package className="w-4 h-4 text-origen-hoja" />;
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-origen-bosque" />;
      case 'certification':
        return <Award className="w-4 h-4 text-origen-menta" />;
      case 'system':
        return <AlertCircle className="w-4 h-4 text-origen-pino" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  /**
   * Obtiene el color de fondo según el tipo de notificación
   */
  const getBgColor = () => {
    switch (notification.type) {
      case 'product':
        return 'bg-origen-hoja/10';
      case 'order':
        return 'bg-origen-pradera/10';
      case 'certification':
        return 'bg-origen-menta/15';
      case 'system':
        return 'bg-origen-pino/10';
      default:
        return 'bg-surface';
    }
  };

  /**
   * Formatea la fecha a "hace X tiempo"
   */
  const timeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'ahora mismo';
    if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    
    // Si es más de una semana, mostrar fecha formateada
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  /**
   * Maneja el clic en la notificación
   */
  const markAsReadOnly = () => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
  };

  const handleClick = () => {
    markAsReadOnly();

    if (safeUrl) {
      router.push(safeUrl);
    }

    onClose?.();
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const containerClass = cn(
    'block px-4 py-3 hover:bg-surface transition-colors relative group',
    !notification.read && 'bg-origen-crema/20'
  );

  const content = (
    <>
      <div className="flex gap-3">
        {/* Icono de tipo con fondo */}
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          getBgColor()
        )}>
          {getIcon()}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Título y estado */}
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm truncate',
              !notification.read ? 'font-semibold text-origen-bosque' : 'text-foreground'
            )}>
              {notification.title}
            </p>

            {/* Indicador de no leído (visible solo en no leídas) */}
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-origen-menta flex-shrink-0 mt-1.5" />
            )}
          </div>

          {/* Descripción */}
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {notification.description}
          </p>

          {/* Timestamp */}
          <p className="text-[10px] text-text-subtle mt-1">
            {timeAgo(notification.timestamp)}
          </p>
        </div>

        {/* Efecto hover para indicar que es clickeable */}
        <div className="absolute inset-y-0 right-0 w-1 bg-origen-menta opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {!safeUrl && !notification.read && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              markAsReadOnly();
            }}
            aria-label="Marcar como leida"
            className="rounded-lg border border-origen-pradera/30 bg-origen-pradera/10 px-2.5 py-1 text-[11px] font-medium text-origen-bosque transition-colors hover:bg-origen-pradera/15"
          >
            Marcar como leida
          </button>
        </div>
      )}
    </>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(containerClass, 'w-full text-left cursor-pointer')}
      aria-label={notification.title}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      {content}
    </div>
  );
}