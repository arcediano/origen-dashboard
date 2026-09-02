/**
 * @file OrderItem.tsx
 * @description Item de pedido - ESTILO EXACTO DE BENEFITSSECTION
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ShoppingBag, Clock, Package, Truck, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Badge, type BadgeVariant } from '@arcediano/ux-library';

interface OrderItemProps {
  id: string;
  orderNumber: string;
  customer: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  date: string;
}

// Mismo mapeo de estado que OrderCard.tsx (lista de pedidos) — reutiliza
// Badge de origen-UXLibrary en vez de clases de color hardcodeadas para que
// ambas vistas de pedidos se mantengan consistentes entre sí.
const STATUS_CONFIG: Record<OrderItemProps['status'], { label: string; variant: BadgeVariant; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', variant: 'warning', icon: Clock },
  processing: { label: 'Procesando', variant: 'info', icon: Package },
  shipped: { label: 'Enviado', variant: 'info', icon: Truck },
  delivered: { label: 'Entregado', variant: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', variant: 'danger', icon: XCircle },
  returned: { label: 'Devolución solicitada', variant: 'warning', icon: RotateCcw },
};

export function OrderItem({
  id,
  orderNumber,
  customer,
  items,
  total,
  status,
  date
}: OrderItemProps) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <Link href={`/dashboard/orders/${id}`} className="block group relative">
      {/* EFECTO EXACTO DE BENEFITSSECTION */}
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-transform duration-300",
        "bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5",
        "group-hover:scale-[1.02]"
      )}></div>
      
      <div className={cn(
        "relative bg-surface-alt rounded-xl sm:rounded-2xl p-3.5 sm:p-5 lg:p-6 border border-border",
        "shadow-origen group-hover:shadow-origen-lg group-hover:border-origen-pradera",
        "transition-all duration-300"
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Icono circular */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-origen-pino to-origen-hoja flex items-center justify-center flex-shrink-0 shadow-subtle">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-origen-bosque truncate">{orderNumber}</h3>
                <span className="text-xs text-text-subtle hidden sm:inline">{date}</span>
              </div>
              <Badge
                variant={config.variant}
                size="xs"
                icon={<StatusIcon className="w-3 h-3" />}
                className="flex-shrink-0 ml-2"
              >
                {config.label}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="text-text-subtle truncate max-w-[100px] sm:max-w-none">{customer}</span>
                <span className="hidden sm:inline w-1 h-1 rounded-full bg-border" />
                <span className="text-text-subtle hidden sm:inline">{items} {items === 1 ? 'producto' : 'productos'}</span>
              </div>
              <span className="font-semibold text-sm sm:text-lg text-origen-bosque flex-shrink-0">
                {total.toFixed(2)}€
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
