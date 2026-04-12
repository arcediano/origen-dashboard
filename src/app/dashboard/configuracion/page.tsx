/**
 * @page ConfiguracionPage
 * @description Configuraciones de comunicacion (solo preferencias)
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Megaphone, MessageCircle, Package, Save, ShoppingBag, Star } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, Button, Toggle } from '@arcediano/ux-library';
import { gatewayClient } from '@/lib/api/client';
import {
  buildChannelStateFromPreferences,
  buildPreferencesPayload,
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_PUSH_SETTINGS,
  NotificationPreferenceDto,
  PreferenceKey,
} from '@/lib/notifications/preferences-config';

interface GetPreferencesResponse {
  data?: NotificationPreferenceDto[];
}

const LABELS: Record<PreferenceKey, { title: string; description: string; icon: React.ElementType }> = {
  orders: {
    title: 'Nuevos pedidos',
    description: 'Aviso cuando llega un nuevo pedido',
    icon: ShoppingBag,
  },
  newReview: {
    title: 'Nuevas resenas',
    description: 'Aviso cuando recibes una nueva resena',
    icon: Star,
  },
  reviewReply: {
    title: 'Respuesta a resena',
    description: 'Aviso cuando recibes respuesta en una resena',
    icon: MessageCircle,
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
  const [emailSettings, setEmailSettings] = useState(DEFAULT_EMAIL_SETTINGS);
  const [pushSettings, setPushSettings] = useState(DEFAULT_PUSH_SETTINGS);
  const [activeChannel, setActiveChannel] = useState<'email' | 'push'>('email');

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isRefreshingByChannel, setIsRefreshingByChannel] = useState(false);

  const rows = useMemo(() => (Object.keys(LABELS) as PreferenceKey[]), []);

  const loadPreferences = useCallback(
    async (mode: 'initial' | 'channel-switch' | 'post-save' = 'initial') => {
      if (mode === 'initial') {
        setIsLoadingPreferences(true);
      } else {
        setIsRefreshingByChannel(true);
      }

      try {
        const response = await gatewayClient.get<GetPreferencesResponse>('/notifications/preferences');
        const preferences = Array.isArray(response?.data) ? response.data : [];
        setEmailSettings(buildChannelStateFromPreferences(preferences, 'email'));
        setPushSettings(buildChannelStateFromPreferences(preferences, 'push'));
      } catch (error) {
        console.error('[configuracion] Error cargando preferencias:', error);
      } finally {
        setIsLoadingPreferences(false);
        setIsRefreshingByChannel(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadPreferences('initial');
  }, [loadPreferences]);

  const handleSave = async () => {
    if (isSaving || isLoadingPreferences) return;
    setIsSaving(true);
    let saveOk = false;

    try {
      await gatewayClient.put('/notifications/preferences', {
        preferences: buildPreferencesPayload(emailSettings, pushSettings),
      });
      saveOk = true;
      await loadPreferences('post-save');
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
                {isRefreshingByChannel && (
                  <p className="mt-1 text-[11px] text-text-subtle">Actualizando preferencias del canal seleccionado...</p>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:w-[260px]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChannel('email');
                      void loadPreferences('channel-switch');
                    }}
                    className={
                      activeChannel === 'email'
                        ? 'rounded-xl border border-origen-pradera bg-origen-pastel px-3 py-2 text-center'
                        : 'rounded-xl border border-border-subtle bg-surface px-3 py-2 text-center'
                    }
                    aria-pressed={activeChannel === 'email'}
                  >
                    <p className="text-[11px] font-semibold text-origen-bosque uppercase tracking-wide">Email</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChannel('push');
                      void loadPreferences('channel-switch');
                    }}
                    className={
                      activeChannel === 'push'
                        ? 'rounded-xl border border-origen-pradera bg-origen-pastel px-3 py-2 text-center'
                        : 'rounded-xl border border-border-subtle bg-surface px-3 py-2 text-center'
                    }
                    aria-pressed={activeChannel === 'push'}
                  >
                    <p className="text-[11px] font-semibold text-origen-bosque uppercase tracking-wide">Push</p>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-border-subtle">
                {rows.map((key) => {
                  const config = LABELS[key];
                  const Icon = config.icon;

                  return (
                    <div key={key} className="px-4 py-4 sm:px-6">
                      <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto] items-center gap-3 sm:gap-4">
                        <div className="min-w-0 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-origen-pastel flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="w-4 h-4 text-origen-pino" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-origen-bosque">{config.title}</p>
                            <p className="text-xs text-text-subtle mt-0.5">{config.description}</p>
                          </div>
                        </div>

                        <div className="hidden sm:flex flex-col items-center gap-1 min-w-[94px]">
                          <span className="text-[10px] uppercase tracking-wide text-text-subtle">Email</span>
                          <Toggle
                            checked={emailSettings[key]}
                            onCheckedChange={(checked) => setEmailSettings((current) => ({ ...current, [key]: checked }))}
                            variant="leaf"
                            toggleSize="sm"
                            aria-label={`Activar ${config.title} por email`}
                          />
                        </div>

                        <div className="hidden sm:flex flex-col items-center gap-1 min-w-[94px]">
                          <span className="text-[10px] uppercase tracking-wide text-text-subtle">Push</span>
                          <Toggle
                            checked={pushSettings[key]}
                            onCheckedChange={(checked) => setPushSettings((current) => ({ ...current, [key]: checked }))}
                            variant="seed"
                            toggleSize="sm"
                            aria-label={`Activar ${config.title} por push`}
                          />
                        </div>

                        <div className="sm:hidden flex flex-col items-center gap-1 min-w-[94px]">
                          <span className="text-[10px] uppercase tracking-wide text-text-subtle">
                            {activeChannel === 'email' ? 'Email' : 'Push'}
                          </span>
                          <Toggle
                            checked={activeChannel === 'email' ? emailSettings[key] : pushSettings[key]}
                            onCheckedChange={(checked) => {
                              if (activeChannel === 'email') {
                                setEmailSettings((current) => ({ ...current, [key]: checked }));
                              } else {
                                setPushSettings((current) => ({ ...current, [key]: checked }));
                              }
                            }}
                            variant={activeChannel === 'email' ? 'leaf' : 'seed'}
                            toggleSize="sm"
                            aria-label={`Activar ${config.title} por ${activeChannel === 'email' ? 'email' : 'push'}`}
                          />
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
