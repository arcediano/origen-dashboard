import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  activateMaintenance,
  detectMaintenanceResponse,
  getMaintenanceState,
  isMaintenanceResponse,
  parseSiteStatus,
  redirectToMaintenance,
  resetMaintenanceState,
} from '@/lib/maintenance';
import { fetchSiteStatus, maintenanceProxyResponse } from '@/lib/maintenance-server';
import { gatewayClient, GatewayError } from '@/lib/api/client';
import { MaintenanceScreen } from '@/components/features/maintenance/MaintenanceScreen';
import { MaintenanceGate } from '@/components/features/maintenance/MaintenanceGate';

const maintenanceBody = { success: false, code: 'MAINTENANCE', message: 'Volvemos a las 18:00' };
const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let replaceSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetMaintenanceState();
  window.sessionStorage.clear();
  replaceSpy = vi.fn();
  vi.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    pathname: '/dashboard',
    replace: replaceSpy,
  } as unknown as Location);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('detección de 503 MAINTENANCE', () => {
  it('solo 503 + code MAINTENANCE cuenta', () => {
    expect(isMaintenanceResponse(503, maintenanceBody)).toBe(true);
    expect(isMaintenanceResponse(503, { code: 'OTHER' })).toBe(false);
    expect(isMaintenanceResponse(503, null)).toBe(false);
    expect(isMaintenanceResponse(500, maintenanceBody)).toBe(false);
  });

  it('detectMaintenanceResponse activa el estado, navega a /mantenimiento y no consume el cuerpo', async () => {
    const res = json(maintenanceBody, 503);
    expect(await detectMaintenanceResponse(res)).toBe(true);
    expect(replaceSpy).toHaveBeenCalledWith('/mantenimiento');
    expect(getMaintenanceState()).toEqual({ active: true, message: 'Volvemos a las 18:00' });
    expect(await res.json()).toEqual(maintenanceBody);
  });

  it('un 503 normal o no JSON no activa el modo', async () => {
    expect(await detectMaintenanceResponse(json({ message: 'x' }, 503))).toBe(false);
    expect(await detectMaintenanceResponse(new Response('<html>', { status: 503 }))).toBe(false);
    expect(getMaintenanceState().active).toBe(false);
  });

  it('gatewayClient: 503 MAINTENANCE navega a /mantenimiento, no refresca token ni cierra sesión', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(maintenanceBody, 503));
    vi.stubGlobal('fetch', fetchMock);
    const expired = vi.fn();
    window.addEventListener('session:expired', expired);

    const err = await gatewayClient.get('/producers/me').catch((e) => e);
    window.removeEventListener('session:expired', expired);

    expect(err).toBeInstanceOf(GatewayError);
    expect((err as GatewayError).status).toBe(503);
    expect(getMaintenanceState().active).toBe(true);
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/mantenimiento');
    expect(fetchMock).toHaveBeenCalledTimes(1); // sin reintentos
    expect(expired).not.toHaveBeenCalled();
  });

  it('gatewayClient: si el refresh de un 401 recibe MAINTENANCE no dispara session:expired', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(json(maintenanceBody, 503)); // /auth/refresh
    vi.stubGlobal('fetch', fetchMock);
    const expired = vi.fn();
    window.addEventListener('session:expired', expired);

    await gatewayClient.get('/producers/me').catch(() => undefined);
    window.removeEventListener('session:expired', expired);

    expect(getMaintenanceState().active).toBe(true);
    expect(replaceSpy).toHaveBeenCalledWith('/mantenimiento');
    expect(expired).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gatewayClient: un 401 normal sigue cerrando la sesión (sin regresión)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(json({ message: 'no' }, 401)); // refresh falla
    vi.stubGlobal('fetch', fetchMock);
    window.lastSessionExpiredTime = 0;
    const expired = vi.fn();
    window.addEventListener('session:expired', expired);

    await gatewayClient.get('/producers/me').catch(() => undefined);
    window.removeEventListener('session:expired', expired);

    expect(expired).toHaveBeenCalledTimes(1);
    expect(getMaintenanceState().active).toBe(false);
    expect(replaceSpy).not.toHaveBeenCalled();
  });
});

describe('redirectToMaintenance (anti-bucle)', () => {
  it('navega con replace a /mantenimiento', () => {
    redirectToMaintenance();
    expect(replaceSpy).toHaveBeenCalledWith('/mantenimiento');
  });

  it('no navega si ya está en /mantenimiento', () => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      pathname: '/mantenimiento',
      replace: replaceSpy,
    } as unknown as Location);
    redirectToMaintenance();
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('no repite la navegación en menos de 5 s (evita bucle con el servidor)', () => {
    redirectToMaintenance();
    redirectToMaintenance();
    expect(replaceSpy).toHaveBeenCalledTimes(1);
  });
});

describe('fetchSiteStatus (fail-open)', () => {
  const ok = { maintenanceMode: true, maintenanceMessage: 'Hola', marketplaceName: 'Origen', openProducerRegistration: true };

  it('devuelve el estado y pide sin caché a /api/v1/site-status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(ok, 200));
    vi.stubGlobal('fetch', fetchMock);
    const status = await fetchSiteStatus();
    expect(status?.maintenanceMode).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/site-status$/);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: 'no-store' });
  });

  it('acepta el cuerpo envuelto en { data }', () => {
    expect(parseSiteStatus({ data: ok })?.maintenanceMessage).toBe('Hola');
  });

  it.each([
    ['error de red', () => Promise.reject(new TypeError('fetch failed'))],
    ['timeout', () => Promise.reject(new DOMException('t', 'TimeoutError'))],
    ['HTTP 500', () => Promise.resolve(json({}, 500))],
    ['HTTP 503', () => Promise.resolve(json(maintenanceBody, 503))],
    ['cuerpo inválido', () => Promise.resolve(json({ foo: 1 }, 200))],
    ['no JSON', () => Promise.resolve(new Response('<html>', { status: 200 }))],
  ])('%s → null (la app funciona normal)', async (_n, impl) => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(impl));
    await expect(fetchSiteStatus()).resolves.toBeNull();
  });
});

describe('maintenanceProxyResponse (rutas /api de Next)', () => {
  it('propaga el 503 MAINTENANCE', async () => {
    const out = await maintenanceProxyResponse(json(maintenanceBody, 503));
    expect(out?.status).toBe(503);
    expect(await out?.json()).toEqual(maintenanceBody);
  });

  it('ignora otras respuestas', async () => {
    expect(await maintenanceProxyResponse(json({}, 500))).toBeNull();
    expect(await maintenanceProxyResponse(json({ code: 'X' }, 503))).toBeNull();
    expect(await maintenanceProxyResponse(json({}, 200))).toBeNull();
  });
});

describe('renderizado condicional', () => {
  it('MaintenanceScreen muestra el mensaje y es accesible', () => {
    render(<MaintenanceScreen message="Volvemos a las 18:00" />);
    expect(screen.getByRole('main')).toHaveAccessibleName('Volvemos enseguida');
    expect(screen.getByRole('status')).toHaveTextContent('Volvemos a las 18:00');
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('MaintenanceScreen usa el texto por defecto con mensaje vacío', () => {
    render(<MaintenanceScreen message="  " />);
    expect(screen.getByRole('status')).toHaveTextContent(DEFAULT_MAINTENANCE_MESSAGE);
  });

  it('MaintenanceGate renderiza siempre la app (ya no pinta la pantalla en sitio)', () => {
    render(
      <MaintenanceGate>
        <div>app normal</div>
      </MaintenanceGate>,
    );
    act(() => activateMaintenance('En mantenimiento'));
    expect(screen.getByText('app normal')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('MaintenanceGate: window.fetch global detecta el 503 y navega (uploads y fetch crudos)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(maintenanceBody, 503)));
    render(
      <MaintenanceGate>
        <div>app normal</div>
      </MaintenanceGate>,
    );
    await act(async () => {
      await window.fetch('/api/upload');
    });
    expect(replaceSpy).toHaveBeenCalledWith('/mantenimiento');
    expect(getMaintenanceState().message).toBe('Volvemos a las 18:00');
    expect(screen.getByText('app normal')).toBeInTheDocument();
  });
});
