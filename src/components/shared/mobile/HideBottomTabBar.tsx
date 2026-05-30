'use client';

import { useHideBottomTabBar } from '@/hooks/useHideBottomTabBar';

/**
 * Renders nothing — side-effect only component that hides the global BottomTabBar
 * while mounted. Use this when the hide condition is computed at render time
 * (e.g., only hide when a contextual action is available).
 *
 * @example
 * {nextAction && <HideBottomTabBar />}
 */
export function HideBottomTabBar() {
  useHideBottomTabBar();
  return null;
}
