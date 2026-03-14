/**
 * @component NotificationItem
 * @description Elemento individual de notificación
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  Package, 
  ShoppingBag, 
  Award, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import type { Notification } from '@/types/notification';

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
  // ==========================================================================
  // FUNCIONES AUXILIARES
  // ==========================================================================

  /**
   * Obtiene el icono según el tipo de notificación
   */
  const getIcon = () => {
    switch (notification.type) {
      case 'product':
        return <Package className="w-4 h-4 text-origen-pradera" />;
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'certification':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'system':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  /**
   * Obtiene el color de fondo según el tipo de notificación
   */
  const getBgColor = () => {
    switch (notification.type) {
      case 'product':
        return 'bg-origen-pradera/10';
      case 'order':
        return 'bg-blue-50';
      case 'certification':
        return 'bg-amber-50';
      case 'system':
        return 'bg-purple-50';
      default:
        return 'bg-gray-50';
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
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
    onClose?.();
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Link
      href={notification.actionUrl || '#'}
      className={cn(
        'block px-4 py-3 hover:bg-gray-50 transition-colors relative group',
        !notification.read && 'bg-origen-crema/20'
      )}
      onClick={handleClick}
    >
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
              !notification.read ? 'font-semibold text-origen-bosque' : 'text-gray-700'
            )}>
              {notification.title}
            </p>
            
            {/* Indicador de no leído (visible solo en no leídas) */}
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-origen-menta flex-shrink-0 mt-1.5" />
            )}
          </div>
          
          {/* Descripción */}
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {notification.description}
          </p>
          
          {/* Timestamp */}
          <p className="text-[10px] text-gray-400 mt-1">
            {timeAgo(notification.timestamp)}
          </p>
        </div>

        {/* Efecto hover para indicar que es clickeable */}
        <div className="absolute inset-y-0 right-0 w-1 bg-origen-menta opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Metadata adicional (si existe) - opcional */}
      {notification.metadata && (
        <div className="mt-2 pl-13 text-[10px] text-gray-400 border-l-2 border-gray-200 pl-3">
          {Object.entries(notification.metadata).map(([key, value]) => (
            <span key={key} className="mr-2">
              {key}: {String(value)}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

// Importación necesaria para el icono por defecto
import { Bell } from 'lucide-react';