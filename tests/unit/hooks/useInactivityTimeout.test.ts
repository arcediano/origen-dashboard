/**
 * Tests unitarios para useInactivityTimeout.
 * Cubre: timeout de 15 minutos, reinicio con eventos de actividad, cleanup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

describe('useInactivityTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Comportamiento del timeout ────────────────────────────────────────────

  it('llama a onTimeout tras exactamente 15 minutos de inactividad', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(onTimeout));

    vi.advanceTimersByTime(FIFTEEN_MINUTES);

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('NO llama a onTimeout antes de los 15 minutos', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(onTimeout));

    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('no llama a onTimeout si hay actividad constante', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(onTimeout));

    // Simular actividad cada 14 minutos durante 60 minutos
    for (let i = 0; i < 4; i++) {
      vi.advanceTimersByTime(FIFTEEN_MINUTES - 60_000);
      window.dispatchEvent(new Event('mousemove'));
    }

    expect(onTimeout).not.toHaveBeenCalled();
  });

  // ── Reinicio del timer por eventos de actividad ───────────────────────────

  it('mousemove reinicia el timer', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(onTimeout));

    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000);
    window.dispatchEvent(new Event('mousemove'));
    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000); // aún no han pasado 15 min desde el reset

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('keydown reinicia el timer', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(onTimeout));

    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000);
    window.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('click reinicia el timer', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(onTimeout));

    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000);
    window.dispatchEvent(new Event('click'));
    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('touchstart reinicia el timer', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(onTimeout));

    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000);
    window.dispatchEvent(new Event('touchstart'));
    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('scroll reinicia el timer', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(onTimeout));

    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000);
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1000);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('tras el reinicio, el timeout se dispara 15 min después de la última actividad', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimeout(onTimeout));

    // Actividad a los 10 min
    vi.advanceTimersByTime(10 * 60 * 1000);
    window.dispatchEvent(new Event('click'));

    // 15 min después del click → debe disparar
    vi.advanceTimersByTime(FIFTEEN_MINUTES);

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  // ── Cleanup al desmontar ──────────────────────────────────────────────────

  it('elimina los event listeners al desmontar el componente', () => {
    const onTimeout = vi.fn();
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useInactivityTimeout(onTimeout));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });

  it('no dispara onTimeout después de desmontar', () => {
    const onTimeout = vi.fn();
    const { unmount } = renderHook(() => useInactivityTimeout(onTimeout));

    unmount();
    vi.advanceTimersByTime(FIFTEEN_MINUTES * 2);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  // ── Callback estable (ref pattern) ────────────────────────────────────────

  it('usa el callback más reciente sin re-registrar listeners', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useInactivityTimeout(cb),
      { initialProps: { cb: cb1 } }
    );

    // Actualizar el callback antes del timeout
    rerender({ cb: cb2 });
    vi.advanceTimersByTime(FIFTEEN_MINUTES);

    // Solo debe llamarse el callback más reciente
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
