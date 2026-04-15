/**
 * @component NotificationsPreferencesPanel
 * @description Panel de configuración de canales (email / push) por tipo de evento.
 *              Layout mobile-first: texto en su propio bloque, toggles en fila separada.
 *              Actualizaciones optimistas — se confirman o revierten con la respuesta del API.
 *
 * US-DASH-2404 — Sprint 24
 * Tokens Origen v3.0.
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { NotificationToggleRow } from './NotificationToggleRow';
import {
  fetchNotificationPreferences,
  updateNotificationPreference,
} from '@/lib/api/notifications';
import type { NotificationPreference } from '@/types/notification';

// ─── GRUPOS DE EVENTOS ────────────────────────────────────────────────────────

interface EventMeta {
  eventType:   string;
  title:       string;
  description: string;
  icon:        React.ElementType;
}

interface EventGroup {
  id:     string;
  label:  string;
  icon:   React.ElementType;
  events: EventMeta[];
}

const EVENT_GROUPS: EventGroup[] = [
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
        description: 'Transiciones de estado: preparando, enviado, entregado.',
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
  {
    id:    'account',
    label: 'Cuenta',
    icon:  UserCheck,
    events: [
      {
        eventType:   'ACCOUNT_VERIFIED',
        title:       'Cuenta verificada',
        description: 'Confirmación cuando la verificación de identidad se completa.',
        icon:        UserCheck,
      },
      {
        eventType:   'CERTIFICATION_PENDING',
        title:       'Certificación pendiente',
        description: 'Recordatorio para completar documentos de certificación.',
        icon:        UserCheck,
      },
    ],
  },
  {
    id:    'system',
    label: 'Sistema',
    icon:  Settings,
    events: [
      {
        eventType:   'SYSTEM_MAINTENANCE',
        title:       'Mantenimiento programado',
        description: 'Aviso previo a interrupciones planificadas del servicio.',
        icon:        Settings,
      },
      {
        eventType:   'SYSTEM_ALERT',
        title:       'Alerta del sistema',
        description: 'Incidencias críticas que pueden afectar tus operaciones.',
        icon:        Settings,
      },
    ],
  },
  {
    id:    'marketing',
    label: 'Marketing',
    icon:  Megaphone,
    events: [
      {
        eventType:   'PROMOTION_CREATED',
        title:       'Nueva promoción disponible',
        description: 'Aviso cuando se publican ofertas o campañas activas para tu tienda.',
        icon:        Megaphone,
      },
    ],
  },
];

// ─── ESTADO LOCAL ─────────────────────────────────────────────────────────────

type ChannelMap = Map<string, { email: boolean; push: boolean }>;

function buildDefaultMap(prefs: NotificationPreference[]): ChannelMap {
  const map: ChannelMap = new Map();
  for (const pref of prefs) {
    map.set(pref.eventType, { email: pref.email, push: pref.push });
  }
  return map;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function NotificationsPreferencesPanel() {
  const [channels, setChannels] = useState<ChannelMap>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      const res = await fetchNotificationPreferences();
      if (cancelled) return;

      if (res.data) {
        setChannels(buildDefaultMap(res.data));
      } else {
        setLoadError('No se pudieron cargar las preferencias. Intenta de nuevo.');
      }
      setIsLoading(false);
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = useCallback(
    async (eventType: string, channel: 'email' | 'push', value: boolean) => {
      const key = `${eventType}:${channel}`;
      setSavingKey(key);

      // Actualización optimista
      setChannels((prev) => {
        const next = new Map(prev);
        const current = next.get(eventType) ?? { email: false, push: false };
        next.set(eventType, { ...current, [channel]: value });
        return next;
      });

      const res = await updateNotificationPreference(eventType, { [channel]: value });

      if (!res.data) {
        // Revertir
        setChannels((prev) => {
          const next = new Map(prev);
          const current = next.get(eventType) ?? { email: false, push: false };
          next.set(eventType, { ...current, [channel]: !value });
          return next;
        });
      }

      setSavingKey(null);
    },
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border border-border-subtle animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-surface-alt rounded w-1/3 mb-4" />
              <div className="space-y-4">
                <div className="h-16 bg-surface-alt rounded" />
                <div className="h-16 bg-surface-alt rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Leyenda de canales */}
      <div className="rounded-[20px] border border-border-subtle bg-surface-alt px-4 py-3">
        <p className="text-xs text-text-subtle leading-snug">
          Elige cómo quieres recibir cada tipo de alerta. Los cambios se aplican en tiempo real.
          Las notificaciones en la campana del dashboard siempre están activas.
        </p>
      </div>

      {EVENT_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        return (
          <Card
            key={group.id}
            className="rounded-2xl border border-border-subtle shadow-sm overflow-hidden"
          >
            <CardHeader className="px-4 py-3 sm:px-6 border-b border-border-subtle bg-surface-alt">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-origen-bosque">
                <GroupIcon className="w-4 h-4 text-origen-pradera" aria-hidden="true" />
                {group.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border-subtle px-4 sm:px-6">
                {group.events.map((event, idx) => {
                  const state = channels.get(event.eventType) ?? { email: false, push: false };
                  const emailKey = `${event.eventType}:email`;
                  const pushKey  = `${event.eventType}:push`;

                  return (
                    <NotificationToggleRow
                      key={event.eventType}
                      icon={event.icon}
                      title={event.title}
                      description={event.description}
                      email={{
                        checked:  state.email,
                        onChange: (v) => void handleToggle(event.eventType, 'email', v),
                        disabled: savingKey === emailKey,
                      }}
                      push={{
                        checked:  state.push,
                        onChange: (v) => void handleToggle(event.eventType, 'push', v),
                        disabled: savingKey === pushKey,
                      }}
                      divider={idx < group.events.length - 1}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Nota de seguridad */}
      <div className="flex items-start gap-2 rounded-[16px] border border-origen-pradera/20 bg-origen-pastel/40 px-4 py-3">
        <Bell className="w-3.5 h-3.5 text-origen-pradera mt-0.5 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-text-subtle">
          Los eventos de seguridad (cambio de contraseña, accesos no reconocidos) siempre se
          envían por email independientemente de esta configuración.
        </p>
      </div>
    </div>
  );
}
