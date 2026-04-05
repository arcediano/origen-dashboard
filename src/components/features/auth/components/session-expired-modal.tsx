'use client';

import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@origen/ux-library';
import { Button } from '@origen/ux-library';

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
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-origen-pradera" />
            <DialogTitle>Sesión expirada</DialogTitle>
          </div>
          <DialogDescription>
            Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo para continuar.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Por seguridad, cerramos tu sesión automáticamente tras un periodo de inactividad.
        </p>
        <div className="pt-4">
          <Button onClick={handleGoToLogin} className="w-full">
            Ir al inicio de sesión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
