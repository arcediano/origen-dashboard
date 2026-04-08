/**
 * @file welcome-header.tsx
 * @description Header de bienvenida con saludo dinámico y fecha
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@arcediano/ux-library';
import { Clock, Eye } from 'lucide-react';
import { itemVariants } from '../layout/dashboard-shell';

interface WelcomeHeaderProps {
  userName?: string;
  showViewStoreButton?: boolean;
  storeUrl?: string;
}

export function WelcomeHeader({
  userName = 'Usuario',
  showViewStoreButton = true,
  storeUrl = '/tienda',
}: WelcomeHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { greeting, currentTime } = useMemo(() => {
    if (!mounted) return { greeting: '', currentTime: '' };

    const hour = new Date().getHours();
    let greetingText = 'Buenas noches';
    
    if (hour < 12) greetingText = 'Buenos días';
    else if (hour < 20) greetingText = 'Buenas tardes';

    const time = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return { greeting: greetingText, currentTime: time };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-origen-bosque mb-1">
          {greeting}, {userName}
        </h1>
        {/* Fecha — solo sm+ para no ocupar espacio en 375px */}
        <p className="hidden sm:flex items-center gap-2 text-xs text-text-subtle">
          <Clock className="w-3.5 h-3.5" />
          {currentTime}
        </p>
      </div>

      {showViewStoreButton && (
        <div className="hidden sm:block">
          <Button
            variant="outline"
            size="lg"
            className="border-origen-pradera text-origen-pradera hover:bg-origen-pradera/10 h-auto py-3 px-6"
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Ver tienda pública
            </span>
          </Button>
        </div>
      )}
    </motion.div>
  );
}

