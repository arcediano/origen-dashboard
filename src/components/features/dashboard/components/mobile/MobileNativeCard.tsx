'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileNativeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onPress?: () => void;
  /** Deshabilitar el feedback táctil */
  noTap?: boolean;
  /** Variante visual */
  variant?: 'default' | 'elevated' | 'flat' | 'outlined';
  className?: string;
}

const variantClasses = {
  default: 'bg-surface-alt border border-border-subtle shadow-sm',
  elevated: 'bg-surface-alt shadow-md shadow-origen-bosque/5 border-0',
  flat: 'bg-surface border-0',
  outlined: 'bg-transparent border border-border',
};

export function MobileNativeCard({
  children,
  onPress,
  noTap = false,
  variant = 'default',
  className,
  ...props
}: MobileNativeCardProps) {
  const isInteractive = !!onPress || !!props.onClick;

  return (
    <motion.div
      whileTap={!noTap && isInteractive ? { scale: 0.975 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={onPress ?? props.onClick}
      className={cn(
        'rounded-2xl overflow-hidden',
        variantClasses[variant],
        isInteractive && 'cursor-pointer active:brightness-95 transition-[filter]',
        className,
      )}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
