/**
 * @component SidebarSubmenu
 * @description Submenú desplegable con animación suave
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@origen/ux-library';
import type { SubmenuItem } from '@/constants/sidebar';

interface SidebarSubmenuProps {
  items: SubmenuItem[];
  isOpen: boolean;
  onItemClick?: () => void;
  depth?: number;
}

export function SidebarSubmenu({ 
  items, 
  isOpen, 
  onItemClick,
  depth = 0 
}: SidebarSubmenuProps) {
  const pathname = usePathname();

  // TODOS los submenús con el mismo padding: pl-8
  // Independientemente de la profundidad
  const paddingLeft = 'pl-8';

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={cn('py-1 space-y-0.5', paddingLeft)}>
            {items.map((item) => {
              const isActive = pathname === item.href || 
                (item.href.includes('?') && pathname === item.href.split('?')[0]);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                    // SIN ICONO, solo texto
                    'hover:bg-origen-pradera/5',
                    isActive && 'bg-origen-pradera/15 font-medium'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* SIN ICONO - solo texto con un pequeño indicador visual */}
                    <span className={cn(
                      'truncate transition-all',
                      isActive
                        ? 'text-origen-bosque font-semibold pl-0'
                        : 'text-muted-foreground group-hover:text-origen-bosque pl-0'
                    )}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <Badge variant="notification" size="xs" className="min-w-[1.2rem] h-5">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}

                  {/* Indicador de elemento activo */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSubmenuIndicator"
                      className="absolute left-0 w-1 h-5 rounded-full bg-origen-menta shadow-menta-glow"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}