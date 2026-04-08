/**
 * @file quick-actions-grid.tsx
 * @description Grid de tarjetas de acciones rápidas
 */

'use client';

import { motion } from 'framer-motion';
import { Package, ShoppingBag, Store, CreditCard } from 'lucide-react';
import { QuickActionCard } from './quick-action-card';
import { itemVariants } from '../layout/dashboard-shell';
import type { QuickAction } from '../../types';

interface QuickActionsGridProps {
  actions?: QuickAction[];
  pendingOrders?: number;
  className?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'new-product',
    title: 'Nuevo producto',
    description: 'Añade un producto a tu catálogo',
    icon: Package,
    href: '/dashboard/products/create',
    gradient: 'from-origen-pradera to-origen-hoja',
  },
  {
    id: 'view-orders',
    title: 'Ver pedidos',
    description: 'Gestiona tus pedidos pendientes',
    icon: ShoppingBag,
    href: '/dashboard/orders',
    badge: 3,
    gradient: 'from-origen-pradera to-origen-hoja',
  },
  {
    id: 'business-profile',
    title: 'Mi negocio',
    description: 'Actualiza la información comercial',
    icon: Store,
    href: '/dashboard/profile/business',
    gradient: 'from-origen-hoja to-origen-pino',
  },
  {
    id: 'payments',
    title: 'Cobros',
    description: 'Revisa Stripe, pagos y bloqueos',
    icon: CreditCard,
    href: '/dashboard/configuracion/pagos',
    gradient: 'from-origen-pino to-origen-bosque',
  },
];

export function QuickActionsGrid({
  actions = DEFAULT_ACTIONS,
  pendingOrders,
  className,
}: QuickActionsGridProps) {
  // Actualizar badge de pedidos si se proporciona
  const finalActions = actions.map(action => {
    if (action.id === 'view-orders' && pendingOrders !== undefined) {
      return { ...action, badge: pendingOrders };
    }
    return action;
  });

  return (
    <motion.div variants={itemVariants} className={className}>
      <h3 className="text-sm font-medium text-text-subtle uppercase tracking-wider mb-4">
        Acciones rápidas
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {finalActions.map((action) => (
          <QuickActionCard
            key={action.id}
            title={action.title}
            description={action.description}
            icon={action.icon}
            href={action.href}
            gradient={action.gradient}
            badge={action.badge}
          />
        ))}
      </div>
    </motion.div>
  );
}
