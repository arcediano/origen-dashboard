/**
 * @page ConfiguracionPage
 * @description Configuraciones de comunicacion (solo preferencias)
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Megaphone, Package, Save, ShoppingBag, Star } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, Button, Toggle } from '@arcediano/ux-library';
import { gatewayClient } from '@/lib/api/client';

type PreferenceKey = 'orders' | 'reviews' | 'stock' | 'marketing';

interface ChannelState {
  orders: boolean;
  reviews: boolean;
  stock: boolean;
  marketing: boolean;
}

type PreferenceEventType =
  | 'NEW_ORDER'
  | 'NEW_REVIEW'
  | 'REVIEW_REPLY'
  | 'PRODUCT_LOW_STOCK'
  | 'PROMOTION_CREATED';

interface NotificationPreferenceDto {
  eventType: PreferenceEventType;
  email?: boolean;
  push?: boolean;
}

interface GetPreferencesResponse {
  data?: NotificationPreferenceDto[];
}

const DEFAULT_CHANNEL_SETTINGS: ChannelState = {
  orders: true,
  reviews: true,
  marketing: false,
  stock: true,
};

const PREFERENCE_GROUPS: Record<PreferenceKey, PreferenceEventType[]> = {
  orders: ['NEW_ORDER'],
  reviews: ['NEW_REVIEW', 'REVIEW_REPLY'],
  stock: ['PRODUCT_LOW_STOCK'],
  marketing: ['PROMOTION_CREATED'],
};

const LABELS: Record<PreferenceKey, { title: string; description: string; icon: React.ElementType }> = {
  orders: {
    title: 'Nuevos pedidos',
    description: 'Aviso cuando llega un nuevo pedido',
    icon: ShoppingBag,
  },
  reviews: {
    title: 'Nuevas resenas',
    description: 'Aviso cuando recibes una nueva resena',
    icon: Star,
  },
  stock: {
    title: 'Stock bajo',
    description: 'Aviso cuando un producto entra en stock critico',
    icon: Package,
  },
  marketing: {
    title: 'Marketing y promociones',
    description: 'Novedades y resultados de campanas',
    icon: Megaphone,
  },
};

export default function ConfiguracionPage() {
  const [emailSettings, setEmailSettings] = useState<ChannelState>(DEFAULT_CHANNEL_SETTINGS);

  const [pushSettings, setPushSettings] = useState<ChannelState>(DEFAULT_CHANNEL_SETTINGS);

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  const rows = useMemo(() => (Object.keys(LABELS) as PreferenceKey[]), []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const resolveChannel = (
      preferencesByEvent: Map<PreferenceEventType, NotificationPreferenceDto>,
      eventTypes: PreferenceEventType[],
      channel: 'email' | 'push',
      fallback: boolean,
    ): boolean => {
      const matched = eventTypes
        .map((eventType) => preferencesByEvent.get(eventType))
        .filter((value): value is NotificationPreferenceDto => !!value);

      if (matched.length === 0) {
        return fallback;
      }

      return matched.every((item) => item[channel] !== false);
    };

    const loadPreferences = async () => {
      try {
        const response = await gatewayClient.get<GetPreferencesResponse>('/notifications/preferences', {
          fetchOptions: { signal: controller.signal },
        });
        const preferences = Array.isArray(response?.data) ? response.data : [];
        const preferencesByEvent = new Map<PreferenceEventType, NotificationPreferenceDto>(
          preferences.map((item) => [item.eventType, item]),
        );

        const nextEmail: ChannelState = {
          orders: resolveChannel(preferencesByEvent, PREFERENCE_GROUPS.orders, 'email', DEFAULT_CHANNEL_SETTINGS.orders),
          reviews: resolveChannel(preferencesByEvent, PREFERENCE_GROUPS.reviews, 'email', DEFAULT_CHANNEL_SETTINGS.reviews),
          stock: resolveChannel(preferencesByEvent, PREFERENCE_GROUPS.stock, 'email', DEFAULT_CHANNEL_SETTINGS.stock),
          marketing: resolveChannel(preferencesByEvent, PREFERENCE_GROUPS.marketing, 'email', DEFAULT_CHANNEL_SETTINGS.marketing),
        };

        const nextPush: ChannelState = {
          orders: resolveChannel(preferencesByEvent, PREFERENCE_GROUPS.orders, 'push', DEFAULT_CHANNEL_SETTINGS.orders),
          reviews: resolveChannel(preferencesByEvent, PREFERENCE_GROUPS.reviews, 'push', DEFAULT_CHANNEL_SETTINGS.reviews),
          stock: resolveChannel(preferencesByEvent, PREFERENCE_GROUPS.stock, 'push', DEFAULT_CHANNEL_SETTINGS.stock),
          marketing: resolveChannel(preferencesByEvent, PREFERENCE_GROUPS.marketing, 'push', DEFAULT_CHANNEL_SETTINGS.marketing),
        };

        if (!cancelled) {
          setEmailSettings(nextEmail);
          setPushSettings(nextPush);
        }
      } catch (error) {
        console.error('[configuracion] Error cargando preferencias:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingPreferences(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const handleSave = async () => {
    if (isSaving || isLoadingPreferences) return;
    setIsSaving(true);
    let saveOk = false;

    try {
      await gatewayClient.put('/notifications/preferences', {
        preferences: [
          {
            eventType: 'NEW_ORDER',
            email: emailSettings.orders,
            inApp: true,
            push: pushSettings.orders,
            frequency: 'INSTANT',
          },
          {
            eventType: 'NEW_REVIEW',
            email: emailSettings.reviews,
            inApp: true,
            push: pushSettings.reviews,
            frequency: 'INSTANT',
          },
          {
            eventType: 'REVIEW_REPLY',
            email: emailSettings.reviews,
            inApp: true,
            push: pushSettings.reviews,
            frequency: 'INSTANT',
          },
          {
            eventType: 'PRODUCT_LOW_STOCK',
            email: emailSettings.stock,
            inApp: true,
            push: pushSettings.stock,
            frequency: 'INSTANT',
          },
          {
            eventType: 'PROMOTION_CREATED',
            email: emailSettings.marketing,
            inApp: true,
            push: pushSettings.marketing,
            frequency: 'INSTANT',
          },
        ],
      });
      saveOk = true;
    } catch (error) {
      console.error('[configuracion] Error guardando preferencias:', error);
    } finally {
      setIsSaving(false);
    }

    if (saveOk) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
        <PageHeader
          title="Configuraciones"
          description="Define como quieres recibir tus avisos por canal"
          badgeIcon={Bell}
          badgeText="Comunicacion"
          tooltip="Configuraciones"
          tooltipDetailed="Configura por cada tipo de aviso si quieres recibirlo por email o por push."
        />

        <div className="container mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 pb-[calc(188px+env(safe-area-inset-bottom))] sm:pb-10">
          <Card variant="elevated" className="rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-border-subtle px-4 py-4 sm:px-6 bg-surface-alt/70">
                <p className="text-sm font-semibold text-origen-bosque">Canales de comunicacion</p>
                <p className="mt-1 text-xs text-muted-foreground">Para cada aviso elige si quieres recibirlo por Email y/o Push.</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:w-[260px]">
                  <div className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold text-origen-bosque uppercase tracking-wide">Email</p>
                  </div>
                  <div className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold text-origen-bosque uppercase tracking-wide">Push</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border-subtle">
                {rows.map((key) => {
                  const config = LABELS[key];
                  const Icon = config.icon;

                  return (
                    <div key={key} className="px-4 py-4 sm:px-6">
                      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 sm:gap-4">
                        <div className="min-w-0 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-origen-pastel flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="w-4 h-4 text-origen-pino" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-origen-bosque">{config.title}</p>
                            <p className="text-xs text-text-subtle mt-0.5">{config.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 min-w-[94px]">
                          <span className="text-[10px] uppercase tracking-wide text-text-subtle">Email</span>
                          <Toggle
                            checked={emailSettings[key]}
                            onCheckedChange={(checked) => setEmailSettings((current) => ({ ...current, [key]: checked }))}
                            variant="leaf"
                            toggleSize="sm"
                            aria-label={`Activar ${config.title} por email`}
                          >
                            {emailSettings[key] ? 'Activo' : 'Desactivado'}
                          </Toggle>
                        </div>

                        <div className="flex flex-col items-center gap-1 min-w-[94px]">
                          <span className="text-[10px] uppercase tracking-wide text-text-subtle">Push</span>
                          <Toggle
                            checked={pushSettings[key]}
                            onCheckedChange={(checked) => setPushSettings((current) => ({ ...current, [key]: checked }))}
                            variant="seed"
                            toggleSize="sm"
                            aria-label={`Activar ${config.title} por push`}
                          >
                            {pushSettings[key] ? 'Activo' : 'Desactivado'}
                          </Toggle>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="hidden lg:flex lg:justify-end">
            <Button onClick={handleSave} disabled={isSaving || isLoadingPreferences}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>{saved ? 'Preferencias guardadas' : isLoadingPreferences ? 'Cargando...' : isSaving ? 'Guardando...' : 'Guardar preferencias'}</span>
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed left-0 right-0 bottom-[calc(88px+env(safe-area-inset-bottom))] lg:hidden z-30 px-4 sm:px-6">
        <div className="mx-auto max-w-[680px] rounded-2xl border border-border-subtle bg-surface-alt/95 backdrop-blur-md p-3 shadow-lg">
          <button
            onClick={handleSave}
            disabled={isSaving || isLoadingPreferences}
            className={
              saved
                ? 'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors bg-origen-pradera text-white'
                : 'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors bg-origen-bosque text-white active:bg-origen-pino disabled:opacity-60'
            }
          >
            <Save className="w-4 h-4" />
            {saved ? 'Guardado' : isLoadingPreferences ? 'Cargando...' : isSaving ? 'Guardando...' : 'Guardar preferencias'}
          </button>
        </div>
      </div>
    </>
  );
}
