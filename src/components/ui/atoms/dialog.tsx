/**
 * @file dialog.tsx
 * @description Modal con portal real + focus trap accesible.
 *
 * Mejoras sobre la versión anterior:
 *   - Renderiza vía `createPortal` → nunca queda cortado por overflow/stacking contexts
 *   - Focus trap: Tab/Shift+Tab ciclan dentro del modal
 *   - Al abrirse mueve el foco al primer elemento interactivo
 *   - Al cerrarse devuelve el foco al elemento que lo tenía antes
 */

'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// ─── Selectores de elementos focalizables ─────────────────────────────────────

const FOCUSABLE = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// ─── Hook: focus trap ─────────────────────────────────────────────────────────

function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;

    // Mover foco al primer elemento interactivo del modal
    const focusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => getComputedStyle(el).display !== 'none',
      );

    focusable()[0]?.focus();

    // Ciclar Tab/Shift+Tab dentro del modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = focusable();
      if (!els.length) return;

      const first = els[0];
      const last = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus(); // Devolver foco al abrir el modal
    };
  }, [isOpen, containerRef]);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ModalProps {
  /** Control de apertura */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Título del modal */
  title?: string;
  /** Descripción del modal */
  description?: string;
  /** Icono del header (opcional) */
  icon?: React.ReactNode;
  /** Contenido del modal */
  children: React.ReactNode;
  /** Acciones del footer */
  footer?: React.ReactNode;
  /** Tamaño del modal */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Clase CSS adicional */
  className?: string;
  /** Si se puede cerrar haciendo clic fuera */
  closeOnOutsideClick?: boolean;
  /** Si muestra el botón de cerrar */
  showCloseButton?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  className,
  closeOnOutsideClick = true,
  showCloseButton = true,
}: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  // Portal sólo funciona en el cliente
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Focus trap
  useFocusTrap(isOpen, modalRef);

  // Cerrar con Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Bloquear scroll del body
  React.useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-origen-oscuro/60 backdrop-blur-sm animate-in fade-in-0"
      onClick={closeOnOutsideClick ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-surface-alt rounded-2xl shadow-2xl border border-border',
          'animate-in zoom-in-95 slide-in-from-bottom-4',
          sizeClasses[size],
          className,
        )}
      >
        {/* Botón de cierre */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-all z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        {(icon || title || description) && (
          <div className="px-6 pt-6 pb-2 border-b border-border-subtle">
            <div className="flex items-start gap-4">
              {icon && (
                <div className="w-10 h-10 rounded-xl bg-origen-pradera/10 flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <h3
                    id="modal-title"
                    className="text-lg font-semibold text-origen-bosque leading-none tracking-tight"
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p id="modal-description" className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cuerpo */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-surface border-t border-border-subtle flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
