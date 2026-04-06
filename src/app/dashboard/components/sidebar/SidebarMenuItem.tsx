/**
 * @component SidebarMenuItem
 * @description Item del menú principal con soporte para submenús anidados
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@arcediano/ux-library';
import { SidebarSubmenu } from './SidebarSubmenu';
import type { MenuItem, SubmenuItem } from '@/constants/sidebar';

interface SidebarMenuItemProps extends MenuItem {
  onItemClick?: () => void;
  defaultOpen?: boolean;
  depth?: number;
}

export function SidebarMenuItem({
  id,
  label,
  icon: Icon,
  href,
  badge,
  submenu,
  onItemClick,
  defaultOpen = false,
  depth = 0
}: SidebarMenuItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Determinar si el item o algún subitem está activo
  const isActive = href ? pathname === href : false;
  
  const hasActiveChild = submenu?.some(item => {
    if ('submenu' in item) {
      return (item as any).submenu?.some((sub: SubmenuItem) => 
        pathname === sub.href || pathname === sub.href.split('?')[0]
      );
    }
    return pathname === item.href || pathname === item.href.split('?')[0];
  }) || false;

  // Abrir automáticamente si tiene un hijo activo
  useEffect(() => {
    if (hasActiveChild && !isOpen) {
      setIsOpen(true);
    }
  }, [hasActiveChild, isOpen]);

  const toggleSubmenu = () => {
    if (submenu) setIsOpen(!isOpen);
  };

  // Padding fijo para items principales
  const itemPadding = 'pl-4';

  // Si tiene submenú, renderizar con toggle
  if (submenu) {
    return (
      <div className="space-y-0.5">
        <button
          onClick={toggleSubmenu}
          className={cn(
            'group relative w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
            itemPadding,
            'hover:bg-origen-pradera/5',
            (isActive || hasActiveChild) && 'bg-origen-pradera/15'
          )}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Icono solo en primer nivel */}
            <Icon className={cn(
              'w-5 h-5 flex-shrink-0 transition-colors',
              (isActive || hasActiveChild)
                ? 'text-origen-menta'
                : 'text-text-subtle group-hover:text-origen-pradera'
            )} />
            <span className={cn(
              'truncate',
              (isActive || hasActiveChild)
                ? 'text-origen-bosque font-semibold'
                : 'text-muted-foreground group-hover:text-origen-bosque'
            )}>
              {label}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {badge && (
              <Badge variant="neutral" className="min-w-[1.2rem] h-5 text-xs px-1.5 py-0">
                {badge > 99 ? '99+' : badge}
              </Badge>
            )}
            {/* Chevron solo en items que tienen submenú */}
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform',
              isOpen ? 'rotate-180' : '',
              (isActive || hasActiveChild) ? 'text-origen-menta' : 'text-text-subtle'
            )} />
          </div>

          {/* Indicador de sección activa */}
          {(isActive || hasActiveChild) && (
            <motion.div
              layoutId="activeNav"
              className="absolute left-0 w-1 h-6 rounded-full bg-origen-menta shadow-menta-glow"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>

        {/* Renderizar submenús anidados */}
        <div>
          {submenu.map((item) => {
            if ('submenu' in item) {
              return (
                <SidebarMenuItem
                  key={item.id}
                  {...item as any}
                  onItemClick={onItemClick}
                  depth={depth + 1}
                />
              );
            }
            return (
              <SidebarSubmenu
                key={item.id}
                items={[item]}
                isOpen={isOpen}
                onItemClick={onItemClick}
                depth={depth + 1}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Si no tiene submenú, renderizar como link
  return (
    <Link
      href={href || '#'}
      onClick={onItemClick}
      className={cn(
        'group relative flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
        itemPadding,
        'hover:bg-origen-pradera/5',
        isActive && 'bg-origen-pradera/15'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Icon className={cn(
          'w-5 h-5 flex-shrink-0 transition-colors',
          isActive ? 'text-origen-menta' : 'text-text-subtle group-hover:text-origen-pradera'
        )} />
        <span className={cn(
          'truncate',
          isActive ? 'text-origen-bosque font-semibold' : 'text-muted-foreground group-hover:text-origen-bosque'
        )}>
          {label}
        </span>
      </div>

      {badge && (
        <Badge variant="neutral" className="min-w-[1.2rem] h-5 text-xs px-1.5 py-0">
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}

      {/* Indicador de elemento activo */}
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 w-1 h-6 rounded-full bg-origen-menta shadow-menta-glow"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
}
