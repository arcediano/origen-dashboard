/**
 * @file product-image.tsx
 * @description Componente de imagen de producto con fallback automático
 *
 * Gestiona tres escenarios en un único componente reutilizable:
 *   1. src ausente o nulo → muestra el fallback directamente
 *   2. Imagen rota (error de red/404) → onError activa el fallback
 *   3. Carga correcta → muestra la imagen con object-cover
 *
 * El tamaño y la forma del contenedor los define el padre.
 * Este componente solo gestiona qué renderizar dentro de ese contenedor.
 *
 * @example
 * // Thumbnail en tabla (contenedor 32×32 con rounded-lg)
 * <div className="w-8 h-8 rounded-lg overflow-hidden bg-origen-crema">
 *   <ProductImage src={product.mainImage?.url} alt={product.name} />
 * </div>
 *
 * @example
 * // Imagen principal en detalle (contenedor aspect-square)
 * <div className="aspect-square rounded-xl overflow-hidden bg-origen-crema">
 *   <ProductImage src={product.mainImage?.url} alt={product.name} />
 * </div>
 *
 * @example
 * // Icono de fallback personalizado
 * <ProductImage
 *   src={item.imageUrl}
 *   alt={item.name}
 *   fallback={<ShoppingBag className="w-6 h-6 text-text-subtle" />}
 * />
 */

'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ProductImageProps {
  /** URL de la imagen. Puede ser undefined/null (mostrará el fallback). */
  src?: string | null;
  /** Texto alternativo para accesibilidad. */
  alt: string;
  /** Clases adicionales para el <img>. El componente aplica w-full h-full object-cover por defecto. */
  className?: string;
  /**
   * Nodo React a mostrar cuando no hay imagen o cuando falla la carga.
   * Por defecto: icono Package proporcional al tamaño del contenedor.
   */
  fallback?: React.ReactNode;
}

// ─── Componente ─────────────────────────────────────────────────────────────────

/**
 * ProductImage
 *
 * Renderiza una imagen con manejo automático de fallback.
 * Compatible con cualquier contenedor: solo necesita overflow-hidden en el padre.
 */
export function ProductImage({ src, alt, className, fallback }: ProductImageProps) {
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('w-full h-full object-cover', className)}
        onError={() => setError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {fallback ?? <Package className="w-1/2 h-1/2 max-w-[3rem] text-origen-pradera/30" />}
    </div>
  );
}
