/**
 * @file quick-actions-grid.tsx
 * @description Grid de tarjetas de acciones rápidas
 */

'use client';

import { motion } from 'framer-motion';
import { Package, ShoppingBag, Store, BarChart3 } from 'lucide-react';
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
    href: '/dashboard/pedidos',
    badge: 3,
    gradient: 'from-origen-pradera to-origen-hoja',
  },
  {
    id: 'my-profile',
    title: 'Mi perfil',
    description: 'Actualiza la información de tu negocio',
    icon: Store,
    href: '/dashboard/profile',
    gradient: 'from-origen-hoja to-origen-pino',
  },
  {
    id: 'statistics',
    title: 'Estadísticas',
    description: 'Analiza el rendimiento de tu tienda',
    icon: BarChart3,
    href: '/dashboard/estadisticas',
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
