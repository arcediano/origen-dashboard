// ============================================================================
// CONSTANTS - Registration Components
// ============================================================================

import {
  Sprout,
  Beef,
  ChefHat,
  Flower,
  Wine,
  Package,
} from 'lucide-react';

// ============================================================================
// STORAGE
// ============================================================================

export const STORAGE_KEY = 'origen-registration-draft';

// ============================================================================
// CATEGORY ICONS
// ============================================================================

export const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  agricola: Sprout,
  ganadero: Beef,
  artesano: ChefHat,
  apicultor: Flower,
  viticultor: Wine,
  especializado: Package,
};

export const getCategoryIcon = (categoryId: string) =>
  CATEGORY_ICON_MAP[categoryId] || Package;
