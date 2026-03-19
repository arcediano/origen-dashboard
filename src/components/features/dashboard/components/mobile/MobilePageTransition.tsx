'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React from 'react';

interface MobilePageTransitionProps {
  children: React.ReactNode;
}

const ENTER = { duration: 0.28, ease: 'easeOut' } as const;
const EXIT  = { duration: 0.18, ease: 'easeIn'  } as const;

export function MobilePageTransition({ children }: MobilePageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1,    y: 0,  transition: ENTER }}
        exit={{    opacity: 0, scale: 0.98,  y: -8, transition: EXIT  }}
        className="will-change-transform"
        style={{ transformOrigin: 'top center' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
