'use client';

import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { Shield } from 'lucide-react';
import { SimpleLogin } from './login-form';

export function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  return (
    <>
      {reason === 'password-changed' && (
        <Alert className="mb-6 border-feedback-success/30 bg-feedback-success-subtle text-feedback-success">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            Tu contraseña se actualizó correctamente. Inicia sesión de nuevo.
          </AlertDescription>
        </Alert>
      )}
      <SimpleLogin />
    </>
  );
}
