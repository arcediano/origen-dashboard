/**
 * @file welcome-header.tsx
 * @description Header de bienvenida con saludo dinámico y fecha
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/atoms/button';
import { Sparkles, Clock, Eye } from 'lucide-react';
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
    <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        {/* Badge Panel de control */}
        <div className="inline-flex items-center gap-2 bg-origen-pradera/10 text-origen-bosque rounded-full px-4 py-2 mb-4 border border-origen-pradera/30">
          <Sparkles className="w-4 h-4 text-origen-pradera" />
          <span className="text-sm font-medium">Panel de control</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-origen-bosque mb-2">
          {greeting}, {userName}
        </h1>
        <p className="text-gray-500 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {currentTime}
        </p>
      </div>

      {showViewStoreButton && (
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
      )}
    </motion.div>
  );
}
