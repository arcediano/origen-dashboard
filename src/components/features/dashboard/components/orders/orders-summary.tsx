/**
 * @file orders-summary.tsx
 * @description Resumen de pedidos recientes
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { Card, EmptyState } from '@arcediano/ux-library';
import { OrderItem } from '../recent/order-item';
import { itemVariants } from '../layout/dashboard-shell';
import type { Order } from '../../types';

interface OrdersSummaryProps {
  orders: Order[];
  isLoading?: boolean;
  className?: string;
}

export function OrdersSummary({ orders, isLoading = false, className }: OrdersSummaryProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`lg:col-span-2 space-y-4 ${className || ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-subtle uppercase tracking-wider">
          Pedidos recientes
        </h3>
        <Link
          href="/dashboard/orders"
          className="text-sm text-origen-pradera hover:text-origen-hoja flex items-center gap-1"
        >
          Ver todos <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          // Estado de carga con skeleton
          <Card>
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-origen-pastel rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-origen-pastel rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          </Card>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <OrderItem key={order.id} {...order} />
          ))
        ) : (
          // Estado vacío
          <Card>
            <EmptyState
              size="sm"
              icon={<ShoppingBag className="w-6 h-6" />}
              title="Sin pedidos recientes"
              description="Aquí aparecerán tus últimos pedidos."
            />
          </Card>
        )}
      </div>
    </motion.div>
  );
}
