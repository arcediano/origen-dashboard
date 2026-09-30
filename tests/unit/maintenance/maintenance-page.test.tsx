import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactElement } from 'react';
import { MaintenanceScreen } from '@/components/features/maintenance/MaintenanceScreen';

const fetchSiteStatus = vi.fn();
vi.mock('@/lib/maintenance-server', () => ({ fetchSiteStatus: () => fetchSiteStatus() }));

import MantenimientoPage, { metadata } from '@/app/mantenimiento/page';

describe('/mantenimiento', () => {
  beforeEach(() => fetchSiteStatus.mockReset());

  it('pinta MaintenanceScreen con el maintenanceMessage de /site-status', async () => {
    fetchSiteStatus.mockResolvedValue({ maintenanceMode: true, maintenanceMessage: 'Volvemos a las 18:00' });
    const el = (await MantenimientoPage()) as ReactElement<{ message?: string }>;
    expect(el.type).toBe(MaintenanceScreen);
    expect(el.props.message).toBe('Volvemos a las 18:00');
  });

  it('sin estado (null) usa el texto por defecto (message undefined)', async () => {
    fetchSiteStatus.mockResolvedValue(null);
    const el = (await MantenimientoPage()) as ReactElement<{ message?: string }>;
    expect(el.props.message).toBeUndefined();
  });

  it('es noindex', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
