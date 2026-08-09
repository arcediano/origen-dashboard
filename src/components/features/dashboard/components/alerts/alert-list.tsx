/**
 * @file alert-list.tsx
 * @description Lista de alertas del dashboard
 */

'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription, Button } from '@arcediano/ux-library';
import { itemVariants } from '../layout/dashboard-shell';
import type { DashboardAlert } from '../../types';

interface AlertListProps {
  alerts: DashboardAlert[];
  className?: string;
}

const AlertItem = memo(function AlertItem({
  alert,
  onDismiss,
}: {
  alert: DashboardAlert;
  onDismiss: (id: string) => void;
}) {
  const alertVariant = alert.type === 'accent' ? 'info' : alert.type;

  return (
    <Alert
      variant={alertVariant}
      // No se usa el dismissible/onDismiss nativo de Alert: esconde el
      // contenido al instante (visible interno propio), lo que cortaría la
      // animación de salida que ya gestiona AlertList más abajo. En su lugar,
      // el botón de cerrar va en `trailing` -- mismo componente Button,
      // pero la visibilidad la sigue controlando el padre.
      trailing={
        alert.dismissible ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDismiss(alert.id)}
            aria-label="Cerrar alerta"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>{alert.title}</AlertTitle>
      <AlertDescription>{alert.description}</AlertDescription>
      {alert.action && (
        <div className="mt-2">
          <Button asChild variant="primary" size="sm">
            <Link href={alert.action.href}>{alert.action.label}</Link>
          </Button>
        </div>
      )}
    </Alert>
  );
});

export function AlertList({ alerts: initialAlerts, className }: AlertListProps) {
  const [alerts, setAlerts] = useState(initialAlerts);

  const handleDismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  return (
    <motion.div variants={itemVariants} className={`space-y-3 ${className || ''}`}>
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
          >
            <AlertItem alert={alert} onDismiss={handleDismiss} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}


