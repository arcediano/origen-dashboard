'use client';

import { useEffect } from 'react';

/**
 * Hides the global BottomTabBar while the component that calls this hook is mounted.
 * Uses the same CustomEvent bus pattern as FilterBottomSheet.
 *
 * Usage: call this hook in any page/component that renders its own contextual action bar
 * on mobile, so the global nav doesn't overlap.
 */
export function useHideBottomTabBar() {
  useEffect(() => {
    const dispatch = (open: boolean) =>
      window.dispatchEvent(
        new CustomEvent('page-action-bar:toggle', { detail: { open } })
      );

    dispatch(true);
    return () => dispatch(false);
  }, []);
}
