/**
 * @file dashboard-shell.tsx
 * @description Contenedor principal del dashboard con animaciones
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'w-full min-h-screen bg-gradient-to-b from-surface-alt to-surface',
        className
      )}
    >
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8">
        {children}
      </div>
    </motion.div>
  );
}

// Exportar variants para uso en componentes hijos
export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
