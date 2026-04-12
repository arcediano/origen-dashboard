// 📁 /src/app/dashboard/security/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, ChevronRight, Key, Shield, Smartphone } from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Separator } from '@arcediano/ux-library';
import { changePassword } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';

type PasswordFieldErrors = {
  current?: string;
  new?: string;
  confirm?: string;
};

function getPasswordFieldErrors(password: { current: string; new: string; confirm: string }): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {};
  const hasAnyValue = Boolean(password.current || password.new || password.confirm);

  if (!hasAnyValue) {
    return errors;
  }

  if (!password.current) {
    errors.current = 'La contraseña actual es obligatoria.';
  }

  if (!password.new) {
    errors.new = 'La nueva contraseña es obligatoria.';
  } else if (password.new.length < 8) {
    errors.new = 'La nueva contraseña debe tener al menos 8 caracteres.';
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/.test(password.new)) {
    errors.new = 'Incluye mayúscula, minúscula, número y símbolo.';
  } else if (password.current && password.new === password.current) {
    errors.new = 'La nueva contraseña debe ser diferente a la actual.';
  }

  if (!password.confirm) {
    errors.confirm = 'Confirma la nueva contraseña.';
  } else if (password.new && password.confirm !== password.new) {
    errors.confirm = 'Las contraseñas no coinciden.';
  }

  return errors;
}

export default function SecurityPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const passwordErrors = getPasswordFieldErrors(password);
  const hasPasswordErrors = Boolean(passwordErrors.current || passwordErrors.new || passwordErrors.confirm);

  const handleChangePassword = async () => {
    setDidAttemptSubmit(true);

    if (hasPasswordErrors) {
      setSaveSuccess(null);
      setSaveError(null);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await changePassword({
        currentPassword: password.current,
        newPassword: password.new,
        confirmPassword: password.confirm,
      });

      setPassword({ current: '', new: '', confirm: '' });
      setDidAttemptSubmit(false);
      setSaveSuccess('Contraseña actualizada correctamente. Inicia sesión de nuevo en otros dispositivos.');
    } catch (error) {
      if (error instanceof GatewayError) {
        setSaveError(error.message || 'No se pudo actualizar la contraseña.');
      } else {
        setSaveError('No se pudo actualizar la contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <PageHeader
        title="Seguridad"
        description="Protege tu acceso con contraseña segura, verificación en dos pasos y alertas de riesgo"
        badgeIcon={Shield}
        badgeText="Seguridad"
        tooltip="Seguridad"
        tooltipDetailed="Gestiona el acceso a tu cuenta, activa doble verificación y revisa alertas relacionadas con la seguridad."
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">
        <div className="mb-5 rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
              <Shield className="h-5 w-5 text-origen-pradera" />
            </div>
            <div>
              <p className="text-sm font-semibold text-origen-bosque leading-tight">Protege tu cuenta</p>
              <p className="mt-1 text-xs text-text-subtle sm:text-sm">Mantén seguro el acceso a tu panel y activa barreras extra antes de modificar datos sensibles.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <Card className="rounded-2xl border border-border-subtle shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-origen-pradera" />
                Acceso y autenticación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {saveError && (
                <Alert className="border-red-200 bg-red-50 text-red-900">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {saveSuccess && (
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>{saveSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2 text-origen-bosque">
                  <Key className="w-4 h-4 text-origen-pradera" />
                  Cambiar contraseña
                </h3>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Contraseña actual</Label>
                    <Input
                      aria-label="Contraseña actual"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={password.current}
                      onChange={(e) => setPassword({ ...password, current: e.target.value })}
                      placeholder="••••••••"
                      error={didAttemptSubmit ? passwordErrors.current : undefined}
                    />
                    <button
                      type="button"
                      className="text-xs text-origen-pradera hover:text-origen-bosque"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Label>Nueva contraseña</Label>
                    <Input
                      aria-label="Nueva contraseña"
                      type={showPasswords.next ? 'text' : 'password'}
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      placeholder="••••••••"
                      error={didAttemptSubmit ? passwordErrors.new : undefined}
                    />
                    <button
                      type="button"
                      className="text-xs text-origen-pradera hover:text-origen-bosque"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, next: !prev.next }))}
                    >
                      {showPasswords.next ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar contraseña</Label>
                    <Input
                      aria-label="Confirmar contraseña"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      placeholder="••••••••"
                      error={didAttemptSubmit ? passwordErrors.confirm : undefined}
                    />
                    <button
                      type="button"
                      className="text-xs text-origen-pradera hover:text-origen-bosque"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="lg:col-start-3 flex items-end">
                    <Button
                      data-testid="change-password-submit"
                      onClick={handleChangePassword}
                      disabled={isSaving}
                      className="w-full"
                    >
                      {isSaving ? 'Actualizando...' : 'Guardar nueva contraseña'}
                    </Button>
                  </div>
                </div>

              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-alt p-4">
                <div>
                  <h4 className="font-medium text-origen-bosque">Verificación en dos pasos</h4>
                  <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad a tu cuenta.</p>
                </div>
                <Button variant="outline">Activar</Button>
              </div>

              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  Recomendamos usar una contraseña única y activar la verificación en dos pasos antes de actualizar datos bancarios o fiscales.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border border-border-subtle shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-origen-pradera" />
                  Estado de protección
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
                  <p className="text-sm font-medium text-origen-bosque">Nivel actual</p>
                  <p className="mt-1 text-xs text-muted-foreground">Protección básica activa. Mejora tu cuenta habilitando 2FA y revisando accesos recientes.</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Siguiente acción recomendada</p>
                      <p className="mt-1 text-xs text-amber-800">Activa la verificación en dos pasos antes de publicar más productos o cambiar datos bancarios.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/dashboard/account" className="block rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm transition-colors hover:bg-surface-alt">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-origen-pradera/10">
                  <Key className="h-4 w-4 text-origen-pradera" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-origen-bosque">Volver a Cuenta</p>
                  <p className="text-xs text-muted-foreground">Gestiona notificaciones, preferencias y ayuda desde un único lugar.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-subtle" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
