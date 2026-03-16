/**
 * @file orders-summary.tsx
 * @description Resumen de pedidos recientes
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
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
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Pedidos recientes
        </h3>
        <Link
          href="/dashboard/pedidos"
          className="text-sm text-origen-pradera hover:text-origen-hoja flex items-center gap-1"
        >
          Ver todos <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          // Estado de carga
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-origen flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-origen-pradera animate-spin" />
            <p className="text-sm text-gray-500">Cargando pedidos...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <OrderItem key={order.id} {...order} />
          ))
        ) : (
          // Estado vacío
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-origen text-center">
            <div className="w-16 h-16 rounded-xl bg-origen-pastel mx-auto mb-4 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-origen-pino" />
            </div>
            <p className="text-gray-500 mb-1">No hay pedidos recientes</p>
            <p className="text-sm text-gray-400">Los nuevos pedidos aparecerán aquí</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
