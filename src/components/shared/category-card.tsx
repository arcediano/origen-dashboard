/**
 * @file category-card.tsx
 * @description Tarjeta de selección de categoría de productor.
 * Componente único compartido entre el formulario de registro y el onboarding.
 *
 * Estilos de referencia: onboarding (origen-pradera como color principal).
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Sprout,
  Beef,
  ChefHat,
  Flower2,
  Wine,
  Package,
  CheckCircle2,
} from 'lucide-react';

// ─── Mapa de iconos ───────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  agricola:    Sprout,
  ganadero:    Beef,
  artesano:    ChefHat,
  apicultor:   Flower2,
  viticultor:  Wine,
  especializado: Package,
};

export const getCategoryIcon = (categoryId: string): React.ComponentType<{ className?: string }> =>
  ICON_MAP[categoryId] ?? Package;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    description: string;
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
  /** Permite selección múltiple (onboarding) o única (registro) */
  multiple?: boolean;
  className?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Tarjeta de categoría con icono, nombre y descripción.
 * Estado activo con color corporativo `origen-pradera`.
 *
 * @example
 * <CategoryCard
 *   category={cat}
 *   isSelected={selected.includes(cat.id)}
 *   onSelect={handleSelect}
 * />
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected,
  onSelect,
  className,
}) => {
  const IconComponent = getCategoryIcon(category.id);

  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className={cn(
        'group relative bg-surface-alt rounded-xl border-2 w-full p-3',
        'transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-origen-pradera/50',
        isSelected
          ? 'border-origen-pradera shadow-md bg-origen-pradera/[0.03]'
          : 'border-border hover:border-origen-pradera',
        className,
      )}
      aria-pressed={isSelected}
    >
      {/* Indicador de selección */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-origen-pradera flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center text-center gap-2">
        {/* Icono */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
            isSelected
              ? 'bg-gradient-to-br from-origen-pradera to-origen-hoja text-white shadow-md'
              : 'bg-gradient-to-br from-origen-crema to-origen-pastel text-origen-bosque group-hover:scale-110',
          )}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        {/* Texto */}
        <div className="w-full">
          <h3
            className={cn(
              'text-sm font-semibold leading-tight',
              isSelected ? 'text-origen-bosque' : 'text-foreground',
            )}
          >
            {category.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
            {category.description}
          </p>
        </div>
      </div>
    </button>
  );
};

CategoryCard.displayName = 'CategoryCard';
