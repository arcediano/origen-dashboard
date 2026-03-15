/**
 * @file tooltip.tsx
 * @description Componente de ayuda inline con hover - VERSIÓN ORIGINAL + POSICIÓN INTELIGENTE
 */

'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface TooltipProps {
  /** Texto de ayuda */
  content: string;
  /** Texto detallado adicional */
  detailed?: string;
  /** Tamaño del icono */
  size?: 'sm' | 'md' | 'lg';
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function Tooltip({
  content,
  detailed,
  size = 'md',
  className,
}: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState<'top' | 'bottom'>('bottom');
  const [tooltipStyles, setTooltipStyles] = React.useState<React.CSSProperties>({});
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Calcular posición
    const newPosition = (spaceAbove > spaceBelow && spaceAbove > 150) ? 'top' : 'bottom';
    setPosition(newPosition);

    // Calcular estilos para posicionamiento absoluto respecto al viewport
    const styles: React.CSSProperties = {
      position: 'fixed',
      left: rect.left + (rect.width / 2),
      zIndex: 9999999,
    };

    if (newPosition === 'bottom') {
      styles.top = rect.bottom + 8;
      styles.transform = 'translateX(-50%)';
    } else {
      styles.bottom = window.innerHeight - rect.top + 8;
      styles.transform = 'translateX(-50%)';
    }

    setTooltipStyles(styles);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    calculatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Recalcular posición en scroll y resize
  React.useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      calculatePosition();
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen]);

  return (
    <div 
      ref={triggerRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icono de ayuda */}
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-help",
          "text-gray-400 hover:text-origen-pradera"
        )}
      >
        <HelpCircle className={sizeClasses[size]} />
      </div>

      {/* Tooltip renderizado con Portal al final del body */}
      {isOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 pointer-events-none z-[9999999]"
          style={{ isolation: 'isolate' }}
        >
          <div 
            style={tooltipStyles}
            className="absolute w-72"
          >
            {/* Tooltip con colores de marca Origen */}
            <div className="relative bg-origen-oscuro rounded-xl shadow-2xl border border-origen-pradera/20 overflow-hidden">
              {/* Efecto de brillo superior */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              
              {/* Contenido */}
              <div className="p-4">
                <p className="text-sm font-semibold text-origen-crema mb-2">{content}</p>
                {detailed && (
                  <p className="text-xs text-origen-crema/80 leading-relaxed">{detailed}</p>
                )}
              </div>

              {/* Flecha decorativa */}
              <div 
                className={cn(
                  "absolute w-4 h-4 bg-origen-oscuro border-l border-t border-origen-pradera/20 transform rotate-45",
                  position === 'bottom' ? '-top-2 left-4' : '-bottom-2 left-4 rotate-[-135deg]'
                )} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ============================================================================
// ALIAS PARA COMPATIBILIDAD
// ============================================================================

export const InfoTooltip = Tooltip;
export const TooltipInline = Tooltip;