/**
 * @file image-list.test.ts
 * @description Lógica de las galerías de imágenes del perfil comercial: añadir, ordenar,
 * sustituir, eliminar con deshacer, detección de cambios y subida de las nuevas.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
  PROFILE_IMAGE_COLLECTIONS,
  activeItems,
  appendFiles,
  hasImageChanges,
  itemsFromApi,
  moveItem,
  releasePendingUrls,
  removeItem,
  replaceWithFile,
  restoreItem,
  toKeys,
  uploadPendingItems,
  validateImageFileBasics,
  type ProfileImageItem,
} from '@/lib/profile/image-list';

const file = (name: string, size = 1000, type = 'image/jpeg', lastModified = 1) =>
  new File([new Uint8Array(size)], name, { type, lastModified });

const saved = (key: string): ProfileImageItem => ({ id: key, key, url: `https://cdn/${key}` });
const createUrl = (f: File) => `blob:${f.name}`;
const revoke = vi.fn();

beforeEach(() => {
  revoke.mockClear();
});

describe('límites por colección', () => {
  it('equipo y entorno respetan los límites del backend; cada una escribe su campo del payload', () => {
    expect(PROFILE_IMAGE_COLLECTIONS.teamPhotos).toMatchObject({ payloadKey: 'teamPhotoKeys', max: 3 });
    expect(PROFILE_IMAGE_COLLECTIONS.locationImages).toMatchObject({ payloadKey: 'locationImageKeys', max: 10 });
    expect(PROFILE_IMAGE_COLLECTIONS.galleryImages).toMatchObject({ payloadKey: 'galleryImageKeys', max: 10 });
  });

  it('las subidas usan el prefijo visual/ que admite el backend para productores', () => {
    Object.values(PROFILE_IMAGE_COLLECTIONS).forEach((config) => {
      expect(config.uploadCategory.startsWith('visual/')).toBe(true);
    });
  });
});

describe('itemsFromApi', () => {
  it('conserva el orden y usa la clave como id', () => {
    const items = itemsFromApi([
      { key: 'b', url: 'https://cdn/b' },
      { key: 'a', url: null },
    ]);
    expect(items).toEqual([
      { id: 'b', key: 'b', url: 'https://cdn/b' },
      { id: 'a', key: 'a', url: '' },
    ]);
  });

  it('tolera listas ausentes (backend anterior)', () => {
    expect(itemsFromApi(undefined)).toEqual([]);
    expect(itemsFromApi(null)).toEqual([]);
  });
});

describe('validateImageFileBasics', () => {
  it('acepta JPG, PNG y WebP dentro del peso', () => {
    expect(validateImageFileBasics(file('a.jpg'))).toBeNull();
    expect(validateImageFileBasics(file('a.png', 10, 'image/png'))).toBeNull();
    expect(validateImageFileBasics(file('a.webp', 10, 'image/webp'))).toBeNull();
  });

  it('rechaza formatos no admitidos y ficheros demasiado pesados', () => {
    expect(validateImageFileBasics({ name: 'a.gif', type: 'image/gif', size: 10 })).toMatch(/formato/);
    expect(validateImageFileBasics({ name: 'a.pdf', type: 'application/pdf', size: 10 })).toMatch(/formato/);
    expect(validateImageFileBasics({ name: 'big.jpg', type: 'image/jpeg', size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
  });
});

describe('appendFiles', () => {
  it('añade al final como pendientes (sin guardar) con su previsualización', () => {
    const { items, duplicates, overflow } = appendFiles([saved('a')], [file('n1.jpg'), file('n2.jpg')], 10, createUrl);
    expect(items.map((i) => i.key ?? i.file?.name)).toEqual(['a', 'n1.jpg', 'n2.jpg']);
    expect(items[1].url).toBe('blob:n1.jpg');
    expect(duplicates).toEqual([]);
    expect(overflow).toBe(0);
  });

  it('evita duplicados accidentales entre las fotos sin guardar (mismo nombre, peso y fecha)', () => {
    const first = appendFiles([], [file('x.jpg')], 10, createUrl);
    const second = appendFiles(first.items, [file('x.jpg'), file('x.jpg', 2000)], 10, createUrl);
    expect(second.duplicates).toEqual(['x.jpg']);
    expect(second.items).toHaveLength(2);
  });

  it('respeta el máximo y informa de las que no caben', () => {
    const { items, overflow } = appendFiles([saved('a'), saved('b')], [file('1.jpg'), file('2.jpg'), file('3.jpg')], 3, createUrl);
    expect(items).toHaveLength(3);
    expect(overflow).toBe(2);
  });

  it('las imágenes marcadas para eliminar liberan hueco', () => {
    const list = removeItem([saved('a'), saved('b')], 'a', revoke);
    const { items, overflow } = appendFiles(list, [file('1.jpg')], 2, createUrl);
    expect(overflow).toBe(0);
    expect(activeItems(items)).toHaveLength(2);
  });
});

describe('moveItem', () => {
  const list = [saved('a'), saved('b'), saved('c')];

  it('mueve una posición antes o después', () => {
    expect(moveItem(list, 'b', -1).map((i) => i.id)).toEqual(['b', 'a', 'c']);
    expect(moveItem(list, 'b', 1).map((i) => i.id)).toEqual(['a', 'c', 'b']);
  });

  it('no hace nada en los extremos (devuelve la misma lista)', () => {
    expect(moveItem(list, 'a', -1)).toBe(list);
    expect(moveItem(list, 'c', 1)).toBe(list);
    expect(moveItem(list, 'zzz', 1)).toBe(list);
  });

  it('salta las imágenes marcadas para eliminar', () => {
    const withRemoved = removeItem(list, 'b', revoke);
    expect(moveItem(withRemoved, 'a', 1).map((i) => i.id)).toEqual(['c', 'b', 'a']);
  });

  it('no mueve una imagen marcada para eliminar', () => {
    const withRemoved = removeItem(list, 'b', revoke);
    expect(moveItem(withRemoved, 'b', 1)).toBe(withRemoved);
  });
});

describe('removeItem / restoreItem', () => {
  it('una imagen guardada solo se marca (reversible hasta guardar)', () => {
    const list = removeItem([saved('a'), saved('b')], 'a', revoke);
    expect(list).toHaveLength(2);
    expect(list[0].removed).toBe(true);
    expect(activeItems(list).map((i) => i.id)).toEqual(['b']);
    expect(restoreItem(list, 'a')[0].removed).toBe(false);
    expect(revoke).not.toHaveBeenCalled();
  });

  it('una imagen nueva se descarta y libera su previsualización', () => {
    const { items } = appendFiles([], [file('n.jpg')], 5, createUrl);
    const next = removeItem(items, items[0].id, revoke);
    expect(next).toEqual([]);
    expect(revoke).toHaveBeenCalledWith('blob:n.jpg');
  });
});

describe('replaceWithFile', () => {
  it('sustituye manteniendo la posición y deja la nueva como pendiente', () => {
    const next = replaceWithFile([saved('a'), saved('b'), saved('c')], 'b', file('nueva.jpg'), createUrl, revoke);
    expect(next.map((i) => i.key ?? i.file?.name)).toEqual(['a', 'nueva.jpg', 'c']);
    expect(next[1].file).toBeDefined();
    expect(next[1].key).toBeUndefined();
  });

  it('al sustituir una nueva libera la previsualización anterior', () => {
    const { items } = appendFiles([], [file('vieja.jpg')], 5, createUrl);
    revoke.mockClear();
    replaceWithFile(items, items[0].id, file('nueva.jpg'), createUrl, revoke);
    expect(revoke).toHaveBeenCalledWith('blob:vieja.jpg');
  });
});

describe('hasImageChanges', () => {
  const initial = [saved('a'), saved('b')];

  it('sin tocar nada no hay cambios', () => {
    expect(hasImageChanges(initial, initial)).toBe(false);
    expect(hasImageChanges(itemsFromApi([{ key: 'a', url: 'x' }, { key: 'b', url: 'y' }]), initial)).toBe(false);
  });

  it('detecta nuevas, eliminadas, reordenadas y sustituidas', () => {
    expect(hasImageChanges(appendFiles(initial, [file('n.jpg')], 10, createUrl).items, initial)).toBe(true);
    expect(hasImageChanges(removeItem(initial, 'a', revoke), initial)).toBe(true);
    expect(hasImageChanges(moveItem(initial, 'a', 1), initial)).toBe(true);
    expect(hasImageChanges(replaceWithFile(initial, 'a', file('r.jpg'), createUrl, revoke), initial)).toBe(true);
  });

  it('deshacer una eliminación o volver al orden original deja de contar como cambio', () => {
    const removed = removeItem(initial, 'a', revoke);
    expect(hasImageChanges(restoreItem(removed, 'a'), initial)).toBe(false);
    expect(hasImageChanges(moveItem(moveItem(initial, 'a', 1), 'a', -1), initial)).toBe(false);
  });
});

describe('toKeys', () => {
  it('devuelve las claves en el orden elegido, sin las eliminadas', () => {
    const list = removeItem(moveItem([saved('a'), saved('b'), saved('c')], 'c', -1), 'a', revoke);
    expect(toKeys(list)).toEqual(['c', 'b']);
  });

  it('usa la clave de una subida ya hecha y falla si queda alguna sin subir', () => {
    const { items } = appendFiles([saved('a')], [file('n.jpg')], 5, createUrl);
    expect(() => toKeys(items)).toThrow(/pendientes de subir/);
    const uploaded = items.map((i) => (i.file ? { ...i, uploadedKey: 'producers/1/visual/gallery/n.jpg' } : i));
    expect(toKeys(uploaded)).toEqual(['a', 'producers/1/visual/gallery/n.jpg']);
  });

  it('una lista vacía es válida (vaciar la galería)', () => {
    expect(toKeys([])).toEqual([]);
    expect(toKeys(removeItem([saved('a')], 'a', revoke))).toEqual([]);
  });
});

describe('releasePendingUrls', () => {
  it('libera solo las previsualizaciones de las imágenes nuevas', () => {
    const { items } = appendFiles([saved('a')], [file('n.jpg')], 5, createUrl);
    revoke.mockClear();
    releasePendingUrls(items, revoke);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:n.jpg');
  });
});

describe('uploadPendingItems', () => {
  it('sube solo las nuevas y anota la clave en cada una', async () => {
    const { items } = appendFiles([saved('a')], [file('n1.jpg'), file('n2.jpg')], 10, createUrl);
    const upload = vi.fn(async (f: File) => ({ key: `producers/1/visual/gallery/${f.name}` }));

    const { items: out, failed } = await uploadPendingItems(items, upload);

    expect(upload).toHaveBeenCalledTimes(2);
    expect(failed).toEqual([]);
    expect(toKeys(out)).toEqual(['a', 'producers/1/visual/gallery/n1.jpg', 'producers/1/visual/gallery/n2.jpg']);
  });

  it('informa de los fallos por imagen y no vuelve a subir las ya subidas al reintentar', async () => {
    const { items } = appendFiles([], [file('ok.jpg'), file('mal.jpg')], 10, createUrl);
    const onError = vi.fn();
    const first = await uploadPendingItems(
      items,
      async (f) => {
        if (f.name === 'mal.jpg') throw new Error('Error al subir el archivo (500).');
        return { key: 'k-ok' };
      },
      { onError },
    );

    expect(first.failed).toHaveLength(1);
    expect(first.failed[0].message).toMatch(/500/);
    expect(onError).toHaveBeenCalledWith(first.failed[0].id, expect.stringMatching(/500/));
    expect(() => toKeys(first.items)).toThrow();

    const retry = vi.fn(async () => ({ key: 'k-mal' }));
    const second = await uploadPendingItems(first.items, retry);
    expect(retry).toHaveBeenCalledTimes(1);
    expect(toKeys(second.items)).toEqual(['k-ok', 'k-mal']);
  });

  it('no sube las marcadas para eliminar ni hace nada si no hay nuevas', async () => {
    const upload = vi.fn();
    const { items, failed } = await uploadPendingItems([saved('a')], upload);
    expect(upload).not.toHaveBeenCalled();
    expect(failed).toEqual([]);
    expect(items).toEqual([saved('a')]);
  });

  it('notifica inicio y fin de cada subida y limita la concurrencia', async () => {
    const { items } = appendFiles([], [file('1.jpg'), file('2.jpg'), file('3.jpg'), file('4.jpg')], 10, createUrl);
    let running = 0;
    let peak = 0;
    const onStart = vi.fn();
    const onDone = vi.fn();

    await uploadPendingItems(
      items,
      async (f) => {
        running += 1;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running -= 1;
        return { key: f.name };
      },
      { onStart, onDone },
      2,
    );

    expect(peak).toBeLessThanOrEqual(2);
    expect(onStart).toHaveBeenCalledTimes(4);
    expect(onDone).toHaveBeenCalledTimes(4);
  });
});
