/**
 * Tests unitarios para useSessionVisibilityGuard.
 * Cubre: logout tras 30 min de pestaña oculta, no logout con menos tiempo,
 * cleanup del event listener y estabilidad del callback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionVisibilityGuard } from '@/hooks/useSessionVisibilityGuard';

const THIRTY_MINUTES = 30 * 60 * 1000;

// ── Helpers para simular cambios de visibilidad ───────────────────────────────

function setTabHidden() {
  Object.defineProperty(document, 'visibilityState', {
    value: 'hidden',
    writable: true,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

function setTabVisible() {
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    writable: true,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

// ─────────────────────────────────────────────────────────────────────────────

describe('useSessionVisibilityGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── No expira con menos de 30 minutos ─────────────────────────────────────

  it('NO llama a onExpired si la pestaña estuvo oculta menos de 30 minutos', () => {
    const onExpired = vi.fn();
    renderHook(() => useSessionVisibilityGuard(onExpired));

    setTabHidden();
    vi.advanceTimersByTime(THIRTY_MINUTES - 1000);
    setTabVisible();

    expect(onExpired).not.toHaveBeenCalled();
  });

  it('NO llama a onExpired si la pestaña estuvo oculta exactamente 29 minutos', () => {
    const onExpired = vi.fn();
    renderHook(() => useSessionVisibilityGuard(onExpired));

    setTabHidden();
    vi.advanceTimersByTime(29 * 60 * 1000);
    setTabVisible();

    expect(onExpired).not.toHaveBeenCalled();
  });

  // ── Expira con 30 minutos o más ───────────────────────────────────────────

  it('llama a onExpired si la pestaña estuvo oculta exactamente 30 minutos', () => {
    const onExpired = vi.fn();
    renderHook(() => useSessionVisibilityGuard(onExpired));

    setTabHidden();
    vi.advanceTimersByTime(THIRTY_MINUTES);
    setTabVisible();

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('llama a onExpired si la pestaña estuvo oculta más de 30 minutos', () => {
    const onExpired = vi.fn();
    renderHook(() => useSessionVisibilityGuard(onExpired));

    setTabHidden();
    vi.advanceTimersByTime(THIRTY_MINUTES + 5000);
    setTabVisible();

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  // ── Casos sin cambio de visibilidad ──────────────────────────────────────

  it('NO llama a onExpired si la pestaña se vuelve visible sin haberse ocultado', () => {
    const onExpired = vi.fn();
    renderHook(() => useSessionVisibilityGuard(onExpired));

    setTabVisible(); // sin pasar por 'hidden'

    expect(onExpired).not.toHaveBeenCalled();
  });

  it('NO llama a onExpired si solo se oculta sin volver a mostrarse', () => {
    const onExpired = vi.fn();
    renderHook(() => useSessionVisibilityGuard(onExpired));

    setTabHidden();
    vi.advanceTimersByTime(THIRTY_MINUTES + 5000);
    // No se llama setTabVisible()

    expect(onExpired).not.toHaveBeenCalled();
  });

  // ── Múltiples ciclos ──────────────────────────────────────────────────────

  it('reinicia el contador tras volver visible: segundo ciclo < 30 min no expira', () => {
    const onExpired = vi.fn();
    renderHook(() => useSessionVisibilityGuard(onExpired));

    // Ciclo 1: menos de 30 min → no expira
    setTabHidden();
    vi.advanceTimersByTime(THIRTY_MINUTES - 1000);
    setTabVisible();

    // Ciclo 2: menos de 30 min → tampoco expira
    setTabHidden();
    vi.advanceTimersByTime(THIRTY_MINUTES - 1000);
    setTabVisible();

    expect(onExpired).not.toHaveBeenCalled();
  });

  it('después de un ciclo válido, un segundo ciclo largo sí expira', () => {
    const onExpired = vi.fn();
    renderHook(() => useSessionVisibilityGuard(onExpired));

    // Ciclo 1: corto → no expira
    setTabHidden();
    vi.advanceTimersByTime(5000);
    setTabVisible();

    // Ciclo 2: 30+ min → expira
    setTabHidden();
    vi.advanceTimersByTime(THIRTY_MINUTES + 1000);
    setTabVisible();

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────

  it('elimina el listener de visibilitychange al desmontar', () => {
    const onExpired = vi.fn();
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useSessionVisibilityGuard(onExpired));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    removeEventListenerSpy.mockRestore();
  });

  it('no llama a onExpired después de desmontar aunque la pestaña vuelva visible', () => {
    const onExpired = vi.fn();
    const { unmount } = renderHook(() => useSessionVisibilityGuard(onExpired));

    setTabHidden();
    vi.advanceTimersByTime(THIRTY_MINUTES + 1000);
    unmount();
    setTabVisible();

    expect(onExpired).not.toHaveBeenCalled();
  });

  // ── Callback estable (ref pattern) ───────────────────────────────────────

  it('usa el callback más reciente sin re-registrar el listener', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useSessionVisibilityGuard(cb),
      { initialProps: { cb: cb1 } }
    );

    rerender({ cb: cb2 });

    setTabHidden();
    vi.advanceTimersByTime(THIRTY_MINUTES + 1000);
    setTabVisible();

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
