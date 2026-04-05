/**
 * @file dashboard-tabs.tsx
 * @description Sistema de tabs del dashboard - Solo Analíticas
 */

'use client';

import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@arcediano/ux-library';
import { BarChart3 } from 'lucide-react';
import { itemVariants } from '../layout/dashboard-shell';
import { cn } from '@/lib/utils';

interface DashboardTabsProps {
  analyticsContent?: React.ReactNode;
  className?: string;
}

const defaultContent = (
  <div className="bg-surface-alt rounded-2xl p-8 border border-border shadow-origen text-center">
    <div className="w-16 h-16 rounded-xl bg-origen-menta/20 mx-auto mb-4 flex items-center justify-center">
      <BarChart3 className="w-8 h-8 text-origen-menta" />
    </div>
    <p className="text-muted-foreground mb-1">Analíticas detalladas</p>
    <p className="text-sm text-text-subtle">Próximamente: gráficos de ventas, visitas y rendimiento</p>
  </div>
);

export function DashboardTabs({
  analyticsContent,
  className,
}: DashboardTabsProps) {
  return (
    <motion.div variants={itemVariants} className={cn('hidden lg:block', className)}>
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="analytics">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analíticas
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {analyticsContent || defaultContent}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

