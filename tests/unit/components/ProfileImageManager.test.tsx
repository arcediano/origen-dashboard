import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileImageManager } from '@/app/dashboard/profile/components/ProfileImageManager';
import type { ProfileImageItem } from '@/lib/profile/image-list';

const items: ProfileImageItem[] = [
  { id: 'a', key: 'a', url: 'https://cdn.test/a.jpg' },
  { id: 'b', key: 'b', url: 'https://cdn.test/b.jpg' },
];

describe('ProfileImageManager', () => {
  // Hallazgo real (petición del humano, 2026-11-08, captura de "Mi negocio" móvil):
  // una imagen cuyo `<img>` falla al cargar se quedaba con el icono de imagen rota
  // nativo del navegador, sin ninguna indicación clara para el productor.
  it('muestra un marcador legible en vez del icono de imagen rota cuando la foto falla al cargar', () => {
    render(
      <ProfileImageManager
        id="qa"
        items={items}
        onChange={vi.fn()}
        max={5}
        editable
        altPrefix="Foto"
        emptyLabel="Sin fotos"
      />,
    );

    const img = screen.getAllByRole('img')[0];
    fireEvent.error(img);

    expect(screen.getByText('No se pudo cargar')).toBeInTheDocument();
  });

  // Petición del humano, 2026-11-08: los botones de acción de cada foto deben
  // visualizarse siempre en una sola línea.
  it('los botones de acción de cada foto están en una sola línea (sin flex-wrap)', () => {
    const { container } = render(
      <ProfileImageManager
        id="qa"
        items={items}
        onChange={vi.fn()}
        max={5}
        editable
        altPrefix="Foto"
        emptyLabel="Sin fotos"
      />,
    );

    const actionRow = container.querySelector('.flex.flex-nowrap');
    expect(actionRow).toBeInTheDocument();
    expect(actionRow?.className).not.toContain('flex-wrap');
  });
});
