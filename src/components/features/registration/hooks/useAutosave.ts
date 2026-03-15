// ============================================================================
// HOOK: useAutosave
// ============================================================================
// Automatically saves form data to localStorage for draft persistence
// NOTE: The visual indicator has been removed as per requirements

import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEY } from '../constants';

export const useAutosave = <FormData extends Record<string, any>>(
  formData: Partial<FormData>
) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const hasData = Object.values(formData).some(v => v && v !== '' && v !== false);
    if (!hasData) return;

    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setLastSaved(new Date());
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData]);

  const loadDraft = useCallback((): Partial<FormData> | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { lastSaved, loadDraft, clearDraft };
};
