/**
 * @component StepShell
 * @description Envoltorio común de los pasos del formulario de producto. En el
 * wizard pinta la tarjeta elevada con animación de entrada; en modo `embedded`
 * (pantalla de revisión del onboarding con IA, que pone su propia cabecera y
 * tarjeta) solo agrupa el contenido.
 */

'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@arcediano/ux-library';

interface StepShellProps {
  embedded?: boolean;
  children: ReactNode;
}

export function StepShell({ embedded = false, children }: StepShellProps) {
  if (embedded) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="p-4 sm:p-6">
        {children}
      </Card>
    </motion.div>
  );
}
