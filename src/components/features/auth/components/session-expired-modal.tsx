'use client';

import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { Modal } from '@/components/ui/atoms/dialog';

interface SessionExpiredModalProps {
  isOpen: boolean;
}

/**
 * Modal que se muestra cuando la sesión del usuario ha expirado.
 * No puede cerrarse — el usuario debe ir al login.
 */
export function SessionExpiredModal({ isOpen }: SessionExpiredModalProps) {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.replace('/auth/login');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleGoToLogin}
      size="sm"
      closeOnOutsideClick={false}
      showCloseButton={false}
      icon={<Clock className="w-5 h-5 text-origen-pradera" />}
      title="Sesión expirada"
      description="Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo para continuar."
      footer={
        <button
          onClick={handleGoToLogin}
          className="w-full px-4 py-2.5 bg-origen-pradera hover:bg-origen-hoja text-white text-sm font-medium rounded-xl transition-colors"
        >
          Ir al inicio de sesión
        </button>
      }
    >
      <p className="text-sm text-gray-500">
        Por seguridad, cerramos tu sesión automáticamente tras un periodo de inactividad.
      </p>
    </Modal>
  );
}
