import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateMainPhoto, MAIN_PHOTO_REQUIREMENTS } from '@/lib/products/photo-requirements';

const original = globalThis.Image;
function fakeImage(width: number, height: number) {
  globalThis.Image = class {
    naturalWidth = width;
    naturalHeight = height;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) {
      setTimeout(() => this.onload?.(), 0);
    }
  } as unknown as typeof Image;
}
const jpg = (size = 10) => new File([new Uint8Array(size)], 'a.jpg', { type: 'image/jpeg' });

describe('validateMainPhoto', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    globalThis.Image = original;
  });

  it('acepta una foto cuadrada de 1000 px', async () => {
    fakeImage(1000, 1000);
    expect(await validateMainPhoto(jpg())).toBeNull();
  });
  it('rechaza una foto pequeña', async () => {
    fakeImage(600, 600);
    expect(await validateMainPhoto(jpg())).toMatch(/demasiado pequeña/);
  });
  it('rechaza una foto apaisada o vertical', async () => {
    fakeImage(1176, 1568);
    expect(await validateMainPhoto(jpg())).toMatch(/cuadrada/);
  });
  it('rechaza tipos no admitidos y archivos enormes', async () => {
    expect(await validateMainPhoto(new File(['x'], 'a.gif', { type: 'image/gif' }))).toMatch(/JPG, PNG o WebP/);
    fakeImage(1000, 1000);
    expect(await validateMainPhoto(jpg(11 * 1024 * 1024))).toMatch(/pesa demasiado/);
  });
  it('lista los requisitos para mostrarlos al productor', () => {
    expect(MAIN_PHOTO_REQUIREMENTS.length).toBeGreaterThanOrEqual(4);
  });
});
