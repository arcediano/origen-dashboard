'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobilePullRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 72;

export function MobilePullRefresh({ onRefresh, children, className }: MobilePullRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const startY = useRef(0);
  const pullY = useMotionValue(0);

  const indicatorOpacity = useTransform(pullY, [0, PULL_THRESHOLD], [0, 1]);
  const indicatorScale = useTransform(pullY, [0, PULL_THRESHOLD], [0.5, 1]);
  const indicatorRotate = useTransform(pullY, [0, PULL_THRESHOLD], [0, 180]);
  const contentY = useTransform(pullY, [0, PULL_THRESHOLD], [0, PULL_THRESHOLD]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    // Resistance curve
    pullY.set(Math.min(PULL_THRESHOLD * 1.5, delta * 0.45));
  }, [pulling, refreshing, pullY]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);
    if (pullY.get() >= PULL_THRESHOLD) {
      setRefreshing(true);
      pullY.set(PULL_THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        pullY.set(0);
      }
    } else {
      pullY.set(0);
    }
  }, [pulling, pullY, onRefresh]);

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicador pull */}
      <motion.div
        style={{ opacity: indicatorOpacity, scale: indicatorScale }}
        className="absolute top-0 inset-x-0 flex justify-center z-10 pointer-events-none"
      >
        <div className="mt-3 w-10 h-10 rounded-full bg-surface-alt shadow-md border border-border-subtle flex items-center justify-center">
          {refreshing ? (
            <Loader2 className="w-5 h-5 text-origen-pradera animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotate }}>
              <ArrowDown className="w-5 h-5 text-origen-pradera" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Contenido desplazable */}
      <motion.div style={{ y: refreshing ? PULL_THRESHOLD * 0.6 : contentY }}>
        {children}
      </motion.div>
    </div>
  );
}
