/**
 * @file alert-list.tsx
 * @description Lista de alertas del dashboard
 */

'use client';

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from '@arcediano/ux-library';
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
    <div className="relative">
      <Alert variant={alertVariant}>
        <AlertTitle>{alert.title}</AlertTitle>
        <AlertDescription>{alert.description}</AlertDescription>
      </Alert>
      {alert.dismissible && (
        <button
          onClick={() => onDismiss(alert.id)}
          className="absolute top-2 right-2 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
          aria-label="Cerrar alerta"
        >
          ×
        </button>
      )}
    </div>
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

