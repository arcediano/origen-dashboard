import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactElement } from 'react';
import { Providers } from '@/components/providers/Providers';

vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ variable: 'f1' }),
  Cormorant_Garamond: () => ({ variable: 'f2' }),
}));
vi.mock('@/app/globals.css', () => ({}));
const fetchSiteStatus = vi.fn();
vi.mock('@/lib/maintenance-server', () => ({ fetchSiteStatus: () => fetchSiteStatus() }));

let pathname = '/dashboard';
vi.mock('next/headers', () => ({
  headers: async () => new Headers(pathname ? { 'x-pathname': pathname } : {}),
}));
// redirect() de Next lanza; lo simulamos con un error identificable
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import RootLayout from '@/app/layout';

const status = (maintenanceMode: boolean) => ({ maintenanceMode, maintenanceMessage: 'Vuelvo pronto' });

/** Hijo directo de <body> del árbol devuelto por el layout. */
async function bodyChild(): Promise<ReactElement> {
  const html = (await RootLayout({ children: <div>app</div> })) as ReactElement<{ children: ReactElement }>;
  const body = html.props.children as ReactElement<{ children: ReactElement }>;
  return body.props.children;
}

describe('RootLayout — modo mantenimiento (redirección)', () => {
  beforeEach(() => {
    fetchSiteStatus.mockReset();
    pathname = '/dashboard';
  });

  it.each(['/dashboard', '/auth/login', '/', '/onboarding'])(
    'modo activo en %s → redirect a /mantenimiento',
    async (p) => {
      pathname = p;
      fetchSiteStatus.mockResolvedValue(status(true));
      await expect(bodyChild()).rejects.toThrow('REDIRECT:/mantenimiento');
    },
  );

  it('modo activo en /mantenimiento → NO redirige (sin bucle) y sin Providers', async () => {
    pathname = '/mantenimiento';
    fetchSiteStatus.mockResolvedValue(status(true));
    const child = await bodyChild();
    expect(child.type).not.toBe(Providers);
    expect((child.props as { children?: unknown }).children ?? child).toBeTruthy();
  });

  it('/mantenimiento con el modo desactivado → redirect a /', async () => {
    pathname = '/mantenimiento';
    fetchSiteStatus.mockResolvedValue(status(false));
    await expect(bodyChild()).rejects.toThrow('REDIRECT:/');
  });

  it('/mantenimiento con /site-status caído (fail-open) → redirect a /', async () => {
    pathname = '/mantenimiento';
    fetchSiteStatus.mockResolvedValue(null);
    await expect(bodyChild()).rejects.toThrow('REDIRECT:/');
  });

  it('maintenanceMode=false → app normal', async () => {
    fetchSiteStatus.mockResolvedValue(status(false));
    expect((await bodyChild()).type).toBe(Providers);
  });

  it('fail-open: /site-status caído (null) → app normal', async () => {
    fetchSiteStatus.mockResolvedValue(null);
    expect((await bodyChild()).type).toBe(Providers);
  });
});
