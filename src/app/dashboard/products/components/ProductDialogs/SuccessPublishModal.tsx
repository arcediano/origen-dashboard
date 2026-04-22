/**
 * @file SuccessPublishModal.tsx
 * @description Modal de confirmación al enviar un producto a revisión
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@arcediano/ux-library';

// ============================================================================
// TIPOS
// ============================================================================

export interface SuccessPublishModalProps {
  /** Control de apertura */
  open: boolean;
  /** Función para cambiar el estado de apertura */
  onOpenChange: (open: boolean) => void;
  /** Nombre del producto publicado */
  productName: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Modal de confirmación al enviar un producto a revisión - Sin botones, redirige automáticamente
 */
export function SuccessPublishModal({
  open,
  onOpenChange,
  productName,
}: SuccessPublishModalProps) {
  const router = useRouter();

  // Redirigir automáticamente después de 3 segundos
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
        router.push('/dashboard/products');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [open, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-origen-pradera" />
            <DialogTitle>Producto enviado a revisión</DialogTitle>
          </div>
          <DialogDescription>{`${productName} está pendiente de verificación por el equipo de Origen`}</DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="flex flex-col items-center text-center">
            {/* Icono animado */}
            <div className="w-20 h-20 rounded-full bg-origen-pradera/10 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500">
              <Package className="w-10 h-10 text-origen-pradera" />
            </div>

            <h4 className="text-lg font-semibold text-origen-bosque mb-2">
              ¡Todo listo!
            </h4>

            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Revisaremos tu producto en un plazo de 24-48 horas. Te notificaremos cuando esté aprobado y visible en el catálogo.
            </p>

            {/* Indicador de carga */}
            <div className="w-12 h-12 rounded-full border-4 border-origen-pradera/20 border-t-origen-pradera animate-spin mb-2" />

            <p className="text-xs text-text-subtle">Redirigiendo a tus productos...</p>

            {/* Datos del estado */}
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <div className="p-3 bg-origen-crema/50 rounded-lg border border-origen-pradera/20">
                <p className="text-xs text-muted-foreground">Plazo de revisión</p>
                <p className="text-sm font-semibold text-origen-bosque">24-48 horas</p>
              </div>
              <div className="p-3 bg-origen-crema/50 rounded-lg border border-origen-pradera/20">
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="text-sm font-semibold text-origen-pradera">Pendiente</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
