/**
 * @component SwipeableRow
 * @description Contenedor con swipe-to-reveal actions nativo para móvil.
 *              Deslizar a la izquierda revela acciones configurable con color y label.
 *              Snap automático: si superas el 40% del panel se abre, si no regresa.
 *              Toca fuera → cierra. Soporte touch y mouse (para emulación en DevTools).
 *
 * Tokens Origen v3.0. Sin dependencias externas.
 */

'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface SwipeAction {
  /** Etiqueta visible */
  label:     string;
  /** Icono Lucide */
  icon:      React.ElementType;
  /** Color de fondo del botón */
  color:     'bosque' | 'amber' | 'red' | 'blue' | 'gray';
  /** Callback al pulsar */
  onPress:   () => void;
  /** Deshabilitar esta acción */
  disabled?: boolean;
}

export interface SwipeableRowProps {
  /** Las acciones que aparecen al deslizar (máximo 3) */
  actions:    SwipeAction[];
  children:   React.ReactNode;
  className?: string;
  /** Ancho de cada botón de acción en px */
  actionWidth?: number;
  /** Deshabilitar el swipe (ej: en desktop) */
  disabled?: boolean;
}

// ─── COLORES ──────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<SwipeAction['color'], { bg: string; text: string }> = {
  bosque: { bg: 'bg-origen-bosque',  text: 'text-white'      },
  amber:  { bg: 'bg-amber-500',      text: 'text-white'      },
  red:    { bg: 'bg-red-500',        text: 'text-white'      },
  blue:   { bg: 'bg-blue-500',       text: 'text-white'      },
  gray:   { bg: 'bg-gray-400',       text: 'text-white'      },
};

// ─── HOOK INTERNO ─────────────────────────────────────────────────────────────

function useSwipe(totalWidth: number, disabled: boolean) {
  const x = useMotionValue(0);
  const [isOpen, setIsOpen] = useState(false);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const snapOpen  = useCallback(() => { animate(x, -totalWidth, { type: 'spring', stiffness: 400, damping: 35 }); setIsOpen(true);  }, [x, totalWidth]);
  const snapClose = useCallback(() => { animate(x, 0,           { type: 'spring', stiffness: 400, damping: 35 }); setIsOpen(false); }, [x]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    startX.current = e.clientX;
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [disabled]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || disabled) return;
    const delta = e.clientX - startX.current;
    const base  = isOpen ? -totalWidth : 0;
    const next  = Math.max(-totalWidth, Math.min(0, base + delta));
    x.set(next);
  }, [disabled, isOpen, totalWidth, x]);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current || disabled) return;
    isDragging.current = false;
    const current = x.get();
    const threshold = -totalWidth * 0.40;
    if (current < threshold) {
      snapOpen();
    } else {
      snapClose();
    }
  }, [disabled, snapClose, snapOpen, totalWidth, x]);

  return { x, isOpen, snapClose, onPointerDown, onPointerMove, onPointerUp };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * Envuelve cualquier fila de lista con swipe-to-reveal.
 * Las acciones aparecen a la derecha con botones de acción rápida.
 *
 * @example
 * <SwipeableRow actions={[{ label:'Editar', icon:Edit, color:'bosque', onPress:()=>{} }]}>
 *   <ProductRow ... />
 * </SwipeableRow>
 */
export function SwipeableRow({
  actions,
  children,
  className,
  actionWidth = 72,
  disabled = false,
}: SwipeableRowProps) {
  const limited  = actions.slice(0, 3);
  const panelW   = limited.length * actionWidth;
  const containerRef = useRef<HTMLDivElement>(null);

  const { x, isOpen, snapClose, onPointerDown, onPointerMove, onPointerUp } =
    useSwipe(panelW, disabled);

  // Cierra si se hace tap fuera del contenedor
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        snapClose();
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen, snapClose]);

  // Opacidad del panel de acciones proporcional al desplazamiento
  const panelOpacity = useTransform(x, [-panelW, 0], [1, 0]);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* ── Panel de acciones (detrás, derecha) ── */}
      <motion.div
        style={{ opacity: panelOpacity, width: panelW }}
        className="absolute right-0 top-0 bottom-0 flex items-stretch"
      >
        {limited.map((action, idx) => {
          const colors = COLOR_MAP[action.color];
          const Icon   = action.icon;
          const isLast = idx === limited.length - 1;

          return (
            <button
              key={idx}
              onClick={() => { action.onPress(); snapClose(); }}
              disabled={action.disabled}
              style={{ width: actionWidth }}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-shrink-0',
                'transition-opacity',
                colors.bg,
                colors.text,
                action.disabled && 'opacity-40 cursor-not-allowed',
                // El último botón tiene bordes redondeados a la derecha
                isLast && 'rounded-tr-none rounded-br-none',
              )}
              aria-label={action.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold leading-none">{action.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Fila deslizable (encima) ── */}
      <motion.div
        style={{ x }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative bg-surface touch-pan-y cursor-grab active:cursor-grabbing select-none"
      >
        {children}
      </motion.div>
    </div>
  );
}
