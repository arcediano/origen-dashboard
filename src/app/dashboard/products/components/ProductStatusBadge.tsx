/**
 * Estado de un producto en el listado. Un borrador que la validación de IA (o un
 * admin) devolvió con datos por corregir se muestra como «Corregir datos» en
 * lugar de «Borrador», para que el productor vea que hay algo pendiente.
 */
import { AlertTriangle, EyeOff } from 'lucide-react';
import { Badge, StatusBadge, type StatusType } from '@arcediano/ux-library';
import type { Product } from '@/types/product';

/** Producto «activo» que NO se muestra en la tienda (visibilidad no pública): no debe parecer publicado. */
export const isHiddenFromStore = (product: Pick<Product, 'status'> & Partial<Pick<Product, 'visibility'>>) =>
  product.status === 'active' && !!product.visibility && product.visibility !== 'public';

interface ProductStatusBadgeProps {
  product: Pick<Product, 'status' | 'aiCorrectionPending'> & Partial<Pick<Product, 'visibility'>>;
  size?: 'xs' | 'sm';
}

export function ProductStatusBadge({ product, size = 'sm' }: ProductStatusBadgeProps) {
  if (product.status === 'draft' && product.aiCorrectionPending) {
    return (
      <Badge
        variant="warning"
        size={size}
        icon={<AlertTriangle className="h-3 w-3" aria-hidden="true" />}
        className="whitespace-nowrap"
      >
        Corregir datos
      </Badge>
    );
  }
  if (isHiddenFromStore(product)) {
    return (
      <Badge
        variant="warning"
        size={size}
        icon={<EyeOff className="h-3 w-3" aria-hidden="true" />}
        className="whitespace-nowrap"
      >
        Activo · oculto
      </Badge>
    );
  }
  return <StatusBadge status={product.status as StatusType} size={size} />;
}
