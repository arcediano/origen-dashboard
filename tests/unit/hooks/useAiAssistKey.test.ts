import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAiAssistKey, clearAiAssistDraft } from '@/hooks/useAiAssistKey';

const STORAGE = 'origen-nuevo-producto-ai-assist-v1';

describe('useAiAssistKey', () => {
  beforeEach(() => localStorage.clear());

  it('en edición usa el productId real y nunca avisa de cupo sin guardar', () => {
    const { result } = renderHook(() => useAiAssistKey('prod-abc12345'));
    expect(result.current.assistKey).toBe('prod-abc12345');
    act(() => result.current.markUsed());
    expect(result.current.assistUsedUnsaved).toBe(false);
    expect(localStorage.getItem(STORAGE)).toBeNull();
  });

  it('en creación genera una clave válida para el backend y la persiste', () => {
    const { result } = renderHook(() => useAiAssistKey());
    expect(result.current.assistKey).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(JSON.parse(localStorage.getItem(STORAGE)!)).toEqual({
      key: result.current.assistKey,
      used: false,
    });
  });

  it('reutiliza la misma clave al recargar el borrador (no gasta otra unidad)', () => {
    const first = renderHook(() => useAiAssistKey());
    const key = first.result.current.assistKey;
    first.unmount();
    const second = renderHook(() => useAiAssistKey());
    expect(second.result.current.assistKey).toBe(key);
  });

  it('markUsed marca el borrador como con cupo consumido y lo persiste', () => {
    const { result } = renderHook(() => useAiAssistKey());
    expect(result.current.assistUsedUnsaved).toBe(false);
    act(() => result.current.markUsed());
    expect(result.current.assistUsedUnsaved).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE)!).used).toBe(true);
  });

  it('clearAiAssistDraft descarta la clave: el siguiente producto nuevo usa otra', () => {
    const first = renderHook(() => useAiAssistKey());
    const key = first.result.current.assistKey;
    first.unmount();
    clearAiAssistDraft();
    const second = renderHook(() => useAiAssistKey());
    expect(second.result.current.assistKey).not.toBe(key);
  });
});
