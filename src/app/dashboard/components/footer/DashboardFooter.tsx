/**
 * @component DashboardFooter
 * @description Pie de página del dashboard con enlaces, métricas y badges decorativos
 * 
 * FUNCIONALIDADES:
 * - Métricas rápidas con iconos y valores dinámicos
 * - Enlaces legales con iconos
 * - Badge de estado del sistema
 * - Indicador de tiempo real
 * - Diseño responsive con gradientes
 * - Animaciones suaves al hover
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Shield, 
  Clock,
  TrendingUp,
  Users,
  Sparkles,
  Leaf,
  CheckCircle,
  Package,
  ArrowUpRight
} from 'lucide-react';
import { Badge } from '@arcediano/ux-library';

interface DashboardFooterProps {
  className?: string;
  /** Métricas personalizadas (opcional) */
  metrics?: {
    growth?: string;
    producers?: string;
    support?: string;
  };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function DashboardFooter({ 
  className,
  metrics = {
    growth: '+34%',
    producers: '+500',
    support: '24h'
  }
}: DashboardFooterProps) {
  const currentYear = new Date().getFullYear();
  const [currentTime, setCurrentTime] = useState<string>('');

  // Actualizar hora cada minuto
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <motion.footer 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn(
        "relative mt-auto border-t border-border-subtle bg-gradient-to-b from-white/50 to-origen-crema/30 backdrop-blur-sm",
        className
      )}
    >
      {/* Elementos decorativos sutiles — solo desktop */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-origen-pradera/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl" />
      </div>

      {/* ── MÓVIL: footer mínimo (< lg) ── */}
      <div className="lg:hidden relative px-4 py-3 flex items-center justify-between gap-3">
        {/* Copyright + versión */}
        <p className="text-[11px] text-text-subtle">
          © {currentYear} Origen · v2.0
        </p>

        {/* Estado del sistema */}
        <Badge variant="success" size="xs" className="gap-1 flex-shrink-0">
          <CheckCircle className="w-2.5 h-2.5" />
          Operativo
        </Badge>
      </div>

      {/* ── DESKTOP: footer completo (≥ lg) ── */}
      <div className="hidden lg:block relative px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* COLUMNA 1: Copyright + marca */}
          <div className="text-center lg:text-left space-y-2">
            <div className="flex items-center justify-center lg:justify-start gap-2.5">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-origen-pradera to-origen-hoja flex items-center justify-center shadow-sm shadow-origen-pradera/20"
              >
                <span className="text-sm font-bold text-white">O</span>
              </motion.div>
              <div>
                <span className="text-sm font-semibold text-origen-bosque">Origen Marketplace</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="leaf" size="xs" className="gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Productores locales
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-xs text-text-subtle flex items-center justify-center lg:justify-start gap-1">
              <span>©</span>
              <span>{currentYear}</span>
              <span>·</span>
              <span>Todos los derechos reservados</span>
            </p>
          </div>

          {/* COLUMNA 2: Métricas rápidas */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <motion.div 
              whileHover={{ y: -2 }}
              className="flex items-center gap-2.5 group cursor-default"
            >
              <div className="relative">
                <TrendingUp className="w-5 h-5 text-origen-pradera group-hover:scale-110 transition-transform" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white"
                />
              </div>
              <div className="text-left">
                <div className="flex items-baseline gap-1">
                  <p className="text-sm font-bold text-origen-bosque">{metrics.growth}</p>
                  <span className="text-[10px] text-green-600 font-medium">↑</span>
                </div>
                <p className="text-[10px] text-muted-foreground">crecimiento mensual</p>
              </div>
            </motion.div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

            <motion.div 
              whileHover={{ y: -2 }}
              className="flex items-center gap-2.5 group cursor-default"
            >
              <Users className="w-5 h-5 text-origen-hoja group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-sm font-bold text-origen-bosque">{metrics.producers}</p>
                <p className="text-[10px] text-muted-foreground">productores activos</p>
              </div>
            </motion.div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

            <motion.div 
              whileHover={{ y: -2 }}
              className="flex items-center gap-2.5 group cursor-default"
            >
              <Clock className="w-5 h-5 text-origen-menta group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-sm font-bold text-origen-bosque">{metrics.support}</p>
                <p className="text-[10px] text-muted-foreground">soporte continuo</p>
              </div>
            </motion.div>
          </div>

          {/* COLUMNA 3: Enlaces legales */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/privacidad" 
              className="group flex items-center gap-1.5 text-xs text-text-subtle hover:text-origen-pradera transition-all"
            >
              <Shield className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Privacidad</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <span className="text-border-subtle">|</span>
            <Link href="/terminos" className="text-xs text-text-subtle hover:text-origen-pradera transition-colors">
              Términos
            </Link>
            <span className="text-border-subtle">|</span>
            <Link href="/cookies" className="text-xs text-text-subtle hover:text-origen-pradera transition-colors">
              Cookies
            </Link>
          </div>

          {/* COLUMNA 4: Made with love + estado */}
          <div className="flex flex-col items-center lg:items-end gap-2">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 text-xs"
            >
              <span className="text-text-subtle">Hecho con</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 text-origen-pradera fill-origen-pradera/30" />
              </motion.div>
              <span className="text-text-subtle">para</span>
              <span className="font-medium text-origen-bosque">productores locales</span>
            </motion.div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="xs" className="gap-1.5">
                <CheckCircle className="w-2.5 h-2.5" />
                Sistema operativo
              </Badge>
              <span className="text-[10px] text-text-subtle font-mono">
                {currentTime} UTC
              </span>
            </div>
          </div>
        </div>

        {/* Sub-línea con métricas adicionales */}
        <div className="mt-4 pt-4 border-t border-border-subtle/50">
          <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] text-text-subtle">
            <div className="flex items-center gap-4">
              <span>✨ Plataforma v2.0</span>
              <span>🌱 Carbon Neutral</span>
              <span>⚡ 99.9% uptime</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>{new Date().toLocaleDateString('es-ES')}</span>
            </div>
          </div>
        </div>
      </div>

    </motion.footer>
  );
}
