/**
 * @file SuccessPublishModal.tsx
 * @description Modal de éxito al publicar un producto - SIN BOTONES
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Package } from 'lucide-react';
import { Modal } from '@origen/ux-library';

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
 * Modal de éxito al publicar un producto - Sin botones, redirige automáticamente
 */
export function SuccessPublishModal({
  open,
  onOpenChange,
  productName,
}: SuccessPublishModalProps) {
  const router = useRouter();

  // Redirigir automáticamente después de 2 segundos
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
        router.push('/products');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [open, onOpenChange, router]);

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="¡Producto publicado con éxito!"
      description={`${productName} ya está disponible en el catálogo`}
      icon={<CheckCircle className="w-6 h-6 text-green-600" />}
      size="md"
      showCloseButton={false}
      closeOnOutsideClick={false}
    >
      <div className="py-6">
        <div className="flex flex-col items-center text-center">
          {/* Icono de éxito animado */}
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h4 className="text-lg font-semibold text-origen-bosque mb-2">
            ¡Felicidades!
          </h4>
          
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Tu producto ha sido publicado correctamente. Serás redirigido al catálogo en unos segundos...
          </p>
          
          {/* Indicador de carga */}
          <div className="w-12 h-12 rounded-full border-4 border-origen-pradera/20 border-t-origen-pradera animate-spin mb-2" />
          
          <p className="text-xs text-text-subtle">Redirigiendo...</p>
          
          {/* Métricas de ejemplo (simuladas) */}
          <div className="grid grid-cols-2 gap-3 w-full mt-6">
            <div className="p-3 bg-origen-crema/50 rounded-lg border border-origen-pradera/20">
              <p className="text-xs text-muted-foreground">Visibilidad</p>
              <p className="text-sm font-semibold text-origen-bosque">Inmediata</p>
            </div>
            <div className="p-3 bg-origen-crema/50 rounded-lg border border-origen-pradera/20">
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="text-sm font-semibold text-green-600">Activo</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}