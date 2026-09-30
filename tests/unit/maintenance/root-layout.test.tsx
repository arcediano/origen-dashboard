import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactElement } from 'react';
import { MaintenanceScreen } from '@/components/features/maintenance/MaintenanceScreen';
import { Providers } from '@/components/providers/Providers';

vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ variable: 'f1' }),
  Cormorant_Garamond: () => ({ variable: 'f2' }),
}));
vi.mock('@/app/globals.css', () => ({}));
const fetchSiteStatus = vi.fn();
vi.mock('@/lib/maintenance-server', () => ({ fetchSiteStatus: () => fetchSiteStatus() }));

import RootLayout from '@/app/layout';

/** Hijo directo de <body> del árbol devuelto por el layout. */
async function bodyChild(): Promise<ReactElement> {
  const html = (await RootLayout({ children: <div>app</div> })) as ReactElement<{ children: ReactElement }>;
  const body = html.props.children as ReactElement<{ children: ReactElement }>;
  return body.props.children;
}

describe('RootLayout — modo mantenimiento', () => {
  beforeEach(() => fetchSiteStatus.mockReset());

  it('maintenanceMode=true → SOLO la pantalla (sin Providers ni children)', async () => {
    fetchSiteStatus.mockResolvedValue({ maintenanceMode: true, maintenanceMessage: 'Vuelvo pronto' });
    const child = await bodyChild();
    expect(child.type).toBe(MaintenanceScreen);
    expect((child.props as { message: string }).message).toBe('Vuelvo pronto');
  });

  it('maintenanceMode=false → app normal', async () => {
    fetchSiteStatus.mockResolvedValue({ maintenanceMode: false, maintenanceMessage: '' });
    expect((await bodyChild()).type).toBe(Providers);
  });

  it('fail-open: /site-status caído (null) → app normal', async () => {
    fetchSiteStatus.mockResolvedValue(null);
    expect((await bodyChild()).type).toBe(Providers);
  });
});
