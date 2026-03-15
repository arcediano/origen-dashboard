/**
 * @file modal.tsx
 * @description Componente de modal simple y fácil de integrar
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// ============================================================================
// MODAL SIMPLE
// ============================================================================

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

/**
 * Modal simple y fácil de integrar
 * 
 * @example
 * <Modal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   title="Confirmar acción"
 *   description="¿Estás seguro de continuar?"
 *   footer={
 *     <>
 *       <button onClick={() => setOpen(false)}>Cancelar</button>
 *       <button onClick={handleConfirm}>Confirmar</button>
 *     </>
 *   }
 * >
 *   Contenido del modal
 * </Modal>
 */
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
  // Referencias
  const modalRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Tamaños del modal
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Cerrar con tecla Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Cerrar al hacer clic fuera
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Bloquear scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in-0"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl border border-gray-200 animate-in zoom-in-95 slide-in-from-bottom-4',
          sizeClasses[size],
          className
        )}
      >
        {/* Botón de cierre */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header con icono y título */}
        {(icon || title || description) && (
          <div className="px-6 pt-6 pb-2 border-b border-gray-100">
            <div className="flex items-start gap-4">
              {icon && (
                <div className="w-10 h-10 rounded-xl bg-origen-pradera/10 flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className="text-lg font-semibold text-origen-bosque leading-none tracking-tight">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cuerpo del modal */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer con acciones */}
        {footer && (
          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}