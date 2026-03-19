/**
 * @file badge.tsx
 * @description Componente de badge unificado y simplificado
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  XCircle, 
  Package, 
  FileText,
  Sparkles,
  Star,
  Info
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export type BadgeVariant =
  | 'success'   // Verde - Para estados positivos (activo, completado, verificado)
  | 'warning'   // Ámbar - Para estados de advertencia (pendiente, stock bajo)
  | 'danger'    // Rojo - Para estados críticos (error, agotado, cancelado)
  | 'info'      // Azul - Para estados informativos (procesando, enviado)
  | 'neutral'   // Gris - Para estados neutros (inactivo, borrador)
  | 'leaf'      // Verde pastel - Para badges decorativos (certificaciones, tags)
  | 'outline'   // Borde - Para badges secundarios
  | 'notification'; // Índigo - Para badges de notificación (contador circular)

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Texto del badge */
  children: React.ReactNode;
  /** Variante de color (ver tabla abajo) */
  variant?: BadgeVariant;
  /** Tamaño del badge */
  size?: BadgeSize;
  /** Icono opcional (puede ser cualquier icono de lucide-react) */
  icon?: React.ReactNode;
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// CONFIGURACIÓN DE VARIANTES
// ============================================================================

/**
 * VARIANTES DISPONIBLES:
 *
 * success  → Verde   → Activo, Completado, Verificado, Aprobado, Entregado
 * warning  → Ámbar   → Pendiente, Stock bajo, Pendiente aprobación, Advertencia
 * danger   → Rojo    → Error, Agotado, Cancelado, Suspendido
 * info     → Azul    → Procesando, Enviado, Información
 * neutral  → Gris    → Inactivo, Borrador, Pendiente verificación
 * leaf     → Verde pastel → Certificaciones, Etiquetas, Badges decorativos
 * outline  → Borde   → Badges secundarios, botones outline
 * notification → Índigo → Badges de notificación con contador
 */

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-origen-hoja/10 text-origen-hoja border-origen-hoja/20',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-origen-pradera/10 text-origen-pradera border-origen-pradera/20',
  neutral: 'bg-surface text-muted-foreground border-border',
  leaf: 'bg-origen-pastel text-origen-hoja border-origen-pradera/30',
  outline: 'bg-transparent text-muted-foreground border-border',
  notification: 'bg-origen-pradera text-white border-transparent shadow-sm',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-1 text-xs gap-1',
  md: 'px-2.5 py-1.5 text-xs gap-1.5',
  lg: 'px-3 py-2 text-sm gap-1.5',
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Badge unificado para toda la aplicación
 * 
 * @example
 * // Estados de producto
 * <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />}>Activo</Badge>
 * <Badge variant="warning" icon={<Clock className="w-3 h-3" />}>Stock bajo</Badge>
 * <Badge variant="danger" icon={<AlertCircle className="w-3 h-3" />}>Agotado</Badge>
 * <Badge variant="neutral" icon={<FileText className="w-3 h-3" />}>Borrador</Badge>
 * 
 * // Badges decorativos
 * <Badge variant="leaf" icon={<Sparkles className="w-3 h-3" />}>Certificado</Badge>
 * <Badge variant="outline" icon={<Tag className="w-3 h-3" />}>Etiqueta</Badge>
 */
export function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'md', 
  icon,
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// ============================================================================
// COMPONENTE DE ESTADO (Wrapper para casos comunes)
// ============================================================================

export type StatusType = 
  | 'active' | 'inactive' | 'out_of_stock' | 'draft' | 'pending_approval'
  | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  | 'verified' | 'pending_verification' | 'approved' | 'suspended';

export interface StatusBadgeProps {
  /** Estado a mostrar */
  status: StatusType;
  /** Tamaño del badge */
  size?: BadgeSize;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Badge específico para estados, mapea automáticamente el estado a la variante correcta
 * 
 * @example
 * <StatusBadge status="active" />
 * <StatusBadge status="out_of_stock" size="sm" />
 */
export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  // Mapeo de estados a variantes
  const statusMap: Record<StatusType, { variant: BadgeVariant; label: string; icon: React.ReactNode }> = {
    // Producto
    active: { variant: 'success', label: 'Activo', icon: <CheckCircle className="w-3 h-3" /> },
    inactive: { variant: 'neutral', label: 'Inactivo', icon: <Clock className="w-3 h-3" /> },
    out_of_stock: { variant: 'danger', label: 'Sin stock', icon: <AlertCircle className="w-3 h-3" /> },
    draft: { variant: 'neutral', label: 'Borrador', icon: <FileText className="w-3 h-3" /> },
    pending_approval: { variant: 'warning', label: 'Pendiente aprobación', icon: <Clock className="w-3 h-3" /> },
    
    // Pedido
    pending: { variant: 'warning', label: 'Pendiente', icon: <Clock className="w-3 h-3" /> },
    processing: { variant: 'info', label: 'Procesando', icon: <Package className="w-3 h-3" /> },
    shipped: { variant: 'info', label: 'Enviado', icon: <Package className="w-3 h-3" /> },
    delivered: { variant: 'success', label: 'Entregado', icon: <CheckCircle className="w-3 h-3" /> },
    cancelled: { variant: 'danger', label: 'Cancelado', icon: <XCircle className="w-3 h-3" /> },
    
    // Verificación
    verified: { variant: 'success', label: 'Verificado', icon: <CheckCircle className="w-3 h-3" /> },
    pending_verification: { variant: 'neutral', label: 'Pendiente verificación', icon: <Clock className="w-3 h-3" /> },
    approved: { variant: 'success', label: 'Aprobado', icon: <CheckCircle className="w-3 h-3" /> },
    suspended: { variant: 'danger', label: 'Suspendido', icon: <AlertCircle className="w-3 h-3" /> },
  };

  const { variant, label, icon } = statusMap[status] || statusMap.pending;

  return (
    <Badge variant={variant} size={size} icon={icon} className={className}>
      {label}
    </Badge>
  );
}