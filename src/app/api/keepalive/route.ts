/**
 * ⚠️ RUTA TEMPORAL — SOLO PARA DESARROLLO
 *
 * Hace ping a los health endpoints de los servicios de Render server-side,
 * evitando problemas de CORS al llamarlos directamente desde el navegador.
 *
 * TODO: Eliminar cuando se pase a un plan de pago en Render o se configure
 *       UptimeRobot / Cron externo para hacer el ping.
 */

import { NextResponse } from 'next/server';

const SERVICES = [
  { name: 'Auth',          url: 'https://origen-auth-dev.onrender.com/health' },
  { name: 'Producers',     url: 'https://origen-producers-dev.onrender.com/health' },
  { name: 'Products',      url: 'https://origen-products-dev.onrender.com/health' },
  { name: 'Media',         url: 'https://origen-media-dev.onrender.com/health' },
  { name: 'Notifications', url: 'https://origen-notifications.onrender.com/health' },
];

export async function GET() {
  const results = await Promise.allSettled(
    SERVICES.map(s =>
      fetch(s.url, { signal: AbortSignal.timeout(10_000) })
        .then(r => ({ name: s.name, status: r.ok ? 'ok' : 'error' as const }))
        .catch(() => ({ name: s.name, status: 'error' as const }))
    )
  );

  const statuses = results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { name: SERVICES[i].name, status: 'error' as const }
  );

  return NextResponse.json({ services: statuses });
}
