/**
 * ⚠️ COMPONENTE TEMPORAL — SOLO PARA DESARROLLO
 *
 * Mantiene vivos los servicios de Render free tier haciendo ping cada 30s.
 * Los servicios free se duermen tras 15 min de inactividad.
 *
 * TODO: Eliminar cuando se pase a un plan de pago en Render o se configure
 *       UptimeRobot / Cron externo para hacer el ping.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

const SERVICE_NAMES = ['Auth', 'Producers', 'Products', 'Notifications'];

const INTERVAL_MS = 30_000;

type ServiceStatus = 'ok' | 'error' | 'pending';

interface PingState {
  name: string;
  status: ServiceStatus;
  lastPing: Date | null;
}

export function DevKeepAlive() {
  const [services, setServices] = useState<PingState[]>(
    SERVICE_NAMES.map(name => ({ name, status: 'pending', lastPing: null }))
  );
  const [minimized, setMinimized] = useState(false);
  const isAutomatedBrowser = typeof navigator !== 'undefined' && navigator.webdriver;

  const pingAll = useCallback(async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 12_000);

    try {
      const res = await fetch('/api/keepalive', { signal: controller.signal });
      if (!res.ok) throw new Error();
      const data: { services: { name: string; status: 'ok' | 'error' }[] } = await res.json();

      setServices(prev =>
        prev.map(s => {
          const found = data.services.find(d => d.name === s.name);
          return { ...s, status: found?.status ?? 'error', lastPing: new Date() };
        })
      );
    } catch {
      setServices(prev =>
        prev.map(s => ({ ...s, status: 'error', lastPing: new Date() }))
      );
    }
  }, []);

  useEffect(() => {
    pingAll();
    const interval = setInterval(pingAll, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pingAll]);

  const allOk = services.every(s => s.status === 'ok');
  const anyError = services.some(s => s.status === 'error');

  if (isAutomatedBrowser) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9000] font-mono text-xs select-none">
      {/* Botón compacto */}
      <button
        onClick={() => setMinimized(m => !m)}
        title="Dev KeepAlive — temporal"
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-lg border transition-colors
          ${anyError
            ? 'bg-red-900/90 border-red-700 text-red-200'
            : allOk
            ? 'bg-gray-900/90 border-green-700 text-green-300'
            : 'bg-gray-900/90 border-yellow-600 text-yellow-300'
          }
        `}
      >
        <span className={`w-2 h-2 rounded-full ${anyError ? 'bg-red-400' : allOk ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`} />
        <span>⚠️ DEV</span>
        <span className="opacity-50">{minimized ? '▲' : '▼'}</span>
      </button>

      {/* Panel expandido */}
      {!minimized && (
        <div className="mt-1.5 bg-gray-900/95 border border-gray-700 rounded-lg shadow-xl p-3 w-52">
          <p className="text-gray-400 mb-2 text-[10px] uppercase tracking-wider">
            Keep-Alive (cada 30s)
          </p>
          <div className="space-y-1.5">
            {services.map(s => (
              <div key={s.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    s.status === 'ok' ? 'bg-green-400' :
                    s.status === 'error' ? 'bg-red-400' :
                    'bg-yellow-400 animate-pulse'
                  }`} />
                  <span className="text-gray-300">{s.name}</span>
                </div>
                <span className="text-gray-600 text-[10px]">
                  {s.lastPing
                    ? s.lastPing.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '—'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-700 text-[10px] text-gray-600">
            Eliminar antes de producción
          </div>
        </div>
      )}
    </div>
  );
}
