// ============================================================================
// HOOK: useLockBodyScroll
// ============================================================================
// Locks the body scroll when the modal is open to prevent background scrolling

import { useEffect } from 'react';

export const useLockBodyScroll = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, [locked]);
};
