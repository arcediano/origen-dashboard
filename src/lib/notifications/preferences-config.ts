/**
 * Notification preferences configuration — all 24 event types.
 * Source of truth for groups, labels, and always-active rules.
 * Consumed by NotificationsPreferencesPanel.
 */

import {
  Bell,
  Briefcase,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  Star,
  UserCheck,
} from 'lucide-react';
import type { ElementType } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationEventMeta {
  eventType:    string;
  title:        string;
  description:  string;
  icon:         ElementType;
  /**
   * When true, the event cannot be disabled by the user.
   * Rendered as "Siempre activo" instead of channel toggles.
   */
  alwaysActive?: boolean;
}

export interface NotificationEventGroup {
  id:     string;
  label:  string;
  icon:   ElementType;
  events: NotificationEventMeta[];
}

// ─── Always-active events (security / transactional) ─────────────────────────

/** Event types the user cannot disable — shown as "Siempre activo". */
export const ALWAYS_ACTIVE_EVENTS = new Set([
  'ACCOUNT_SUSPENDED',
  'PASSWORD_CHANGED',
  'WELCOME',
]);

// ─── Groups (6 groups, 24 events total) ───────────────────────────────────────

export const NOTIFICATION_GROUPS: NotificationEventGroup[] = [
  // ── Pedidos (4) ────────────────────────────────────────────────────────────
  {
    id:    'orders',
    label: 'Pedidos',
    icon:  ShoppingCart,
    events: [
      {
        eventType:   'NEW_ORDER',
        title:       'Nuevo pedido recibido',
        description: 'Aviso inmediato cuando un cliente completa un pedido.',
        icon:        ShoppingCart,
      },
      {
        eventType:   'ORDER_STATUS_CHANGED',
        title:       'Cambio de estado de pedido',
        description: 'Transiciones de estado: preparando, enviado, en camino.',
        icon:        ShoppingCart,
      },
      {
        eventType:   'ORDER_DELIVERED',
        title:       'Pedido entregado',
        description: 'Confirmación cuando el pedido llega al destino.',
        icon:        ShoppingCart,
      },
      {
        eventType:   'ORDER_CANCELLED',
        title:       'Pedido cancelado',
        description: 'Alerta cuando un pedido es cancelado por el cliente o el sistema.',
        icon:        ShoppingCart,
      },
    ],
  },

  // ── Reseñas (2) ────────────────────────────────────────────────────────────
  {
    id:    'reviews',
    label: 'Reseñas',
    icon:  Star,
    events: [
      {
        eventType:   'NEW_REVIEW',
        title:       'Nueva reseña recibida',
        description: 'Un comprador ha valorado uno de tus productos.',
        icon:        Star,
      },
      {
        eventType:   'REVIEW_REPLY',
        title:       'Respuesta a tu reseña',
        description: 'El productor ha respondido a una reseña que escribiste.',
        icon:        Star,
      },
    ],
  },

  // ── Productos (3) ──────────────────────────────────────────────────────────
  {
    id:    'products',
    label: 'Productos',
    icon:  Package,
    events: [
      {
        eventType:   'PRODUCT_LOW_STOCK',
        title:       'Stock bajo',
        description: 'Aviso cuando el inventario cae por debajo del umbral configurado.',
        icon:        Package,
      },
      {
        eventType:   'PRODUCT_APPROVED',
        title:       'Producto aprobado',
        description: 'Tu producto ha pasado la revisión y está publicado en el catálogo.',
        icon:        Package,
      },
      {
        eventType:   'PRODUCT_REJECTED',
        title:       'Producto rechazado',
        description: 'Notificación con motivo cuando un producto no supera la revisión.',
        icon:        Package,
      },
    ],
  },

  // ── Cuenta y Productor (11) ────────────────────────────────────────────────
  {
    id:    'account',
    label: 'Cuenta y Productor',
    icon:  UserCheck,
    events: [
      {
        eventType:   'ACCOUNT_VERIFIED',
        title:       'Cuenta verificada',
        description: 'Confirmación cuando la verificación de identidad se completa.',
        icon:        UserCheck,
      },
      {
        eventType:   'ACCOUNT_SUSPENDED',
        title:       'Cuenta suspendida',
        description: 'Aviso de seguridad inmediato sobre el estado de tu cuenta.',
        icon:        UserCheck,
        alwaysActive: true,
      },
      {
        eventType:   'PASSWORD_CHANGED',
        title:       'Contraseña actualizada',
        description: 'Alerta de seguridad cuando tu contraseña es modificada.',
        icon:        UserCheck,
        alwaysActive: true,
      },
      {
        eventType:   'PRODUCER_REQUEST_RECEIVED',
        title:       'Solicitud de alta recibida',
        description: 'Confirmación de que hemos recibido tu solicitud de productor.',
        icon:        Briefcase,
      },
      {
        eventType:   'PRODUCER_REQUEST_APPROVED',
        title:       'Solicitud de productor aprobada',
        description: 'Tu solicitud de alta como productor ha sido aprobada.',
        icon:        Briefcase,
      },
      {
        eventType:   'PRODUCER_REQUEST_REJECTED',
        title:       'Solicitud de productor rechazada',
        description: 'Tu solicitud fue rechazada. Puedes volver a solicitarla en 30 días.',
        icon:        Briefcase,
      },
      {
        eventType:   'ONBOARDING_REMINDER',
        title:       'Recordatorio de onboarding',
        description: 'Aviso para completar los pasos pendientes de configuración.',
        icon:        Briefcase,
      },
      {
        eventType:   'ONBOARDING_COMPLETED',
        title:       'Onboarding completado',
        description: 'Confirmación de que has finalizado el proceso de alta como productor.',
        icon:        Briefcase,
      },
      {
        eventType:   'PROFILE_UNDER_REVIEW',
        title:       'Perfil en revisión',
        description: 'El equipo de Origen está revisando tu perfil de productor.',
        icon:        Briefcase,
      },
      {
        eventType:   'PROFILE_ACTIVATED',
        title:       'Perfil activado',
        description: 'Tu perfil de productor ha sido verificado y ya puedes vender.',
        icon:        Briefcase,
      },
      // CERTIFICATION_PENDING no está disponible en el backend desplegado aún.
      // Habilitar cuando se añada la migración de base de datos correspondiente.
    ],
  },

  // ── Sistema (1 alwaysActive) ──────────────────────────────────────────────
  {
    id:    'system',
    label: 'Sistema',
    icon:  Settings,
    events: [
      // SYSTEM_MAINTENANCE y SYSTEM_ALERT no están disponibles en el backend desplegado aún.
      // Habilitar cuando se añada la migración de base de datos correspondiente.
      {
        eventType:   'WELCOME',
        title:       'Bienvenida',
        description: 'Mensaje de bienvenida al crear tu cuenta en Origen.',
        icon:        Bell,
        alwaysActive: true,
      },
    ],
  },

  // ── Marketing (pendiente despliegue) ──────────────────────────────────────
  // PROMOTION_CREATED no está disponible en el backend desplegado aún.
  // Habilitar cuando se añada la migración de base de datos correspondiente.
];

// ─── Legacy compatibility (Sprint 24 tests) ─────────────────────────────────

export type PreferenceEventType =
  | 'NEW_ORDER'
  | 'NEW_REVIEW'
  | 'REVIEW_REPLY'
  | 'PRODUCT_LOW_STOCK'
  | 'PROMOTION_CREATED';

export type PreferenceKey =
  | 'orders'
  | 'newReview'
  | 'reviewReply'
  | 'stock'
  | 'marketing';

export interface ChannelState {
  orders: boolean;
  newReview: boolean;
  reviewReply: boolean;
  stock: boolean;
  marketing: boolean;
}

export interface NotificationPreferenceDto {
  eventType: PreferenceEventType;
  email?: boolean;
  push?: boolean;
}

export interface NotificationPreferencePayloadItem {
  eventType: PreferenceEventType;
  email: boolean;
  inApp: true;
  push: boolean;
  frequency: 'INSTANT';
}

export const DEFAULT_EMAIL_SETTINGS: ChannelState = {
  orders: true,
  newReview: true,
  reviewReply: true,
  stock: true,
  marketing: false,
};

export const DEFAULT_PUSH_SETTINGS: ChannelState = {
  orders: false,
  newReview: false,
  reviewReply: false,
  stock: false,
  marketing: false,
};

export const EVENT_BY_KEY: Record<PreferenceKey, PreferenceEventType> = {
  orders: 'NEW_ORDER',
  newReview: 'NEW_REVIEW',
  reviewReply: 'REVIEW_REPLY',
  stock: 'PRODUCT_LOW_STOCK',
  marketing: 'PROMOTION_CREATED',
};

function resolveBooleanValue(
  preference: NotificationPreferenceDto | undefined,
  channel: 'email' | 'push',
  fallback: boolean,
): boolean {
  const value = preference?.[channel];
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Backward-compatible mapper used by legacy unit tests.
 */
export function buildChannelStateFromPreferences(
  preferences: NotificationPreferenceDto[],
  channel: 'email' | 'push',
): ChannelState {
  const fallback = channel === 'email' ? DEFAULT_EMAIL_SETTINGS : DEFAULT_PUSH_SETTINGS;

  const byEvent = new Map<PreferenceEventType, NotificationPreferenceDto>();
  for (const preference of preferences) {
    byEvent.set(preference.eventType, preference);
  }

  return {
    orders: resolveBooleanValue(byEvent.get('NEW_ORDER'), channel, fallback.orders),
    newReview: resolveBooleanValue(byEvent.get('NEW_REVIEW'), channel, fallback.newReview),
    reviewReply: resolveBooleanValue(byEvent.get('REVIEW_REPLY'), channel, fallback.reviewReply),
    stock: resolveBooleanValue(byEvent.get('PRODUCT_LOW_STOCK'), channel, fallback.stock),
    marketing: resolveBooleanValue(byEvent.get('PROMOTION_CREATED'), channel, fallback.marketing),
  };
}

/**
 * Backward-compatible payload builder used by legacy unit tests.
 */
export function buildPreferencesPayload(
  emailSettings: ChannelState,
  pushSettings: ChannelState,
): NotificationPreferencePayloadItem[] {
  const payload: NotificationPreferencePayloadItem[] = [];

  for (const key of Object.keys(EVENT_BY_KEY) as PreferenceKey[]) {
    const eventType = EVENT_BY_KEY[key];
    payload.push({
      eventType,
      email: emailSettings[key],
      inApp: true,
      push: pushSettings[key],
      frequency: 'INSTANT',
    });
  }

  return payload;
}
