// 📁 /src/app/dashboard/account/security/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Key, Shield, Smartphone, Check, Copy, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Alert, AlertDescription, Badge, CardIconHeader, PageLoader, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, appShellPaddingClass, NAV_HEIGHT_MOBILE_DASHBOARD } from '@arcediano/ux-library';
import { changePassword, getTwoFactorStatus, setupTwoFactor, enableTwoFactor, disableTwoFactor } from '@/lib/api/auth';
import { logoutUser } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';

// ─── TIPOS INTERNOS ───────────────────────────────────────────────────────────

type PasswordFieldErrors = {
  current?: string;
  new?: string;
  confirm?: string;
};

function getPasswordFieldErrors(password: { current: string; new: string; confirm: string }): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {};

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

// ─── TWO-FACTOR AUTHENTICATION STATE ──────────────────────────────────────────

type TwoFactorStep = 'idle' | 'setup-choose-app' | 'setup-qr' | 'setup-verify' | 'recovery-codes' | 'disable-confirm';

// Apps de autenticación recomendadas para quien no tiene ninguna instalada
// todavía (paso 1 del asistente de configuración) — nombres de paquete/ID de
// App Store estables y bien conocidos, sin depender de detectar iOS/Android
// en el navegador (evita adivinar mal la plataforma).
const RECOMMENDED_AUTH_APPS = [
  {
    name: 'Google Authenticator',
    ios: 'https://apps.apple.com/app/google-authenticator/id388497605',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2',
    gradient: 'from-[#4285F4] to-[#34A853]',
  },
  {
    name: 'Microsoft Authenticator',
    ios: 'https://apps.apple.com/app/microsoft-authenticator/id983156458',
    android: 'https://play.google.com/store/apps/details?id=com.azure.authenticator',
    gradient: 'from-[#0078D4] to-[#00BCF2]',
  },
  {
    name: 'Authy',
    ios: 'https://apps.apple.com/app/authy/id494168017',
    android: 'https://play.google.com/store/apps/details?id=com.authy.authy',
    gradient: 'from-[#EF5350] to-[#F06292]',
  },
] as const;

interface TwoFactorSetupState {
  qrCodeUrl?: string;
  secret?: string;
  otpauthUri?: string;
}

// El navegador puede recargar/descargar esta pestaña en segundo plano al
// navegar a un esquema otpauth:// para entregarlo a la app de autenticación
// (frecuente en Safari iOS, también en Android bajo presión de memoria) —
// sin esto, `setupData.secret` se pierde y la verificación falla siempre al
// volver. Se persiste solo mientras dura un setup en curso, nunca el 2FA
// ya activado.
const TWO_FA_SETUP_STORAGE_KEY = 'origen-2fa-setup-in-progress';
const TWO_FA_SETUP_MAX_AGE_MS = 10 * 60 * 1000;

function saveTwoFactorSetupState(setupData: TwoFactorSetupState) {
  try {
    sessionStorage.setItem(TWO_FA_SETUP_STORAGE_KEY, JSON.stringify({ setupData, savedAt: Date.now() }));
  } catch {
    // sessionStorage no disponible (modo privado, cuota, etc.) — el setup
    // simplemente no sobrevive a una recarga, sin romper el flujo normal.
  }
}

function loadTwoFactorSetupState(): TwoFactorSetupState | null {
  try {
    const raw = sessionStorage.getItem(TWO_FA_SETUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { setupData?: TwoFactorSetupState; savedAt?: number };
    if (!parsed.setupData?.secret || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > TWO_FA_SETUP_MAX_AGE_MS) return null;
    return parsed.setupData;
  } catch {
    return null;
  }
}

function clearTwoFactorSetupState() {
  try {
    sessionStorage.removeItem(TWO_FA_SETUP_STORAGE_KEY);
  } catch {
    // no-op
  }
}

type TwoFactorStateType = {
  enabled: boolean;
  isLoading: boolean;
  step: TwoFactorStep;
  setupData: TwoFactorSetupState;
  recoveryCodesShown?: string[];
  verifyCode: string;
  disableVerification: string;
  error: string | null;
};

export default function SecurityPage() {
  const router = useRouter();
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

  // 2FA State
  const [twoFaDialog, setTwoFaDialog] = useState(false);
  // Paso 1 del asistente ("¿ya tienes una app de autenticación?"): solo
  // controla si se despliega la lista de apps recomendadas -- no bloquea
  // nada, es únicamente para orientar a quien no sabe qué instalar.
  const [showAuthAppRecommendations, setShowAuthAppRecommendations] = useState(false);
  const [twoFa, setTwoFa] = useState<TwoFactorStateType>({
    enabled: false,
    isLoading: true,
    step: 'idle',
    setupData: {},
    verifyCode: '',
    disableVerification: '',
    error: null,
  });

  const passwordErrors = getPasswordFieldErrors(password);
  const hasPasswordErrors = Boolean(passwordErrors.current || passwordErrors.new || passwordErrors.confirm);

  // Load 2FA status on mount
  useEffect(() => {
    const load2FAStatus = async () => {
      try {
        const status = await getTwoFactorStatus();
        setTwoFa((prev) => ({
          ...prev,
          enabled: status.enabled,
          isLoading: false,
        }));

        // Si la pestaña se recargó al volver de la app de autenticación
        // (ver TWO_FA_SETUP_STORAGE_KEY), retomar el setup en curso en vez
        // de perder el secret y obligar a empezar de cero — solo si 2FA
        // sigue sin estar activado.
        if (!status.enabled) {
          const savedSetup = loadTwoFactorSetupState();
          if (savedSetup) {
            setTwoFa((prev) => ({
              ...prev,
              step: 'setup-qr',
              setupData: savedSetup,
              verifyCode: '',
            }));
            setTwoFaDialog(true);
          }
        }
      } catch (error) {
        setTwoFa((prev) => ({
          ...prev,
          isLoading: false,
          error: 'No se pudo cargar el estado de 2FA',
        }));
      }
    };
    load2FAStatus();
  }, []);

  // ─── 2FA HANDLERS ─────────────────────────────────────────────────────────

  // Abre el asistente en el paso 1 ("¿ya tienes una app de autenticación?")
  // -- todavía no llama a la API ni genera el QR/secret, eso ocurre al
  // confirmar ese paso (handleStart2FASetup). Separarlo evita generar un
  // secret nuevo en el backend si el usuario abre el diálogo y lo cierra
  // sin llegar a avanzar.
  const handleOpenSetupWizard = () => {
    setShowAuthAppRecommendations(false);
    setTwoFa((prev) => ({ ...prev, step: 'setup-choose-app', error: null }));
  };

  const handleStart2FASetup = async () => {
    try {
      setTwoFa((prev) => ({ ...prev, isLoading: true, error: null }));
      const data = await setupTwoFactor();
      const setupData: TwoFactorSetupState = {
        qrCodeUrl: data.qrCodeUrl,
        secret: data.secret,
        otpauthUri: data.otpauthUrl,
      };
      saveTwoFactorSetupState(setupData);
      setTwoFa((prev) => ({
        ...prev,
        isLoading: false,
        step: 'setup-qr',
        setupData,
        verifyCode: '',
        error: null,
      }));
    } catch (error) {
      setTwoFa((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof GatewayError ? error.message : 'Error al generar código QR',
      }));
    }
  };

  const handleVerify2FACode = async () => {
    if (twoFa.verifyCode.length !== 6 || !/^\d{6}$/.test(twoFa.verifyCode)) {
      setTwoFa((prev) => ({
        ...prev,
        error: 'El código debe tener exactamente 6 dígitos',
      }));
      return;
    }

    try {
      setTwoFa((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await enableTwoFactor(twoFa.setupData.secret || '', twoFa.verifyCode);
      clearTwoFactorSetupState();
      setTwoFa((prev) => ({
        ...prev,
        isLoading: false,
        step: 'recovery-codes',
        recoveryCodesShown: response.recoveryCodes,
        error: null,
      }));
      // El historial se cargará desde el backend en la próxima recarga de la página
    } catch (error) {
      setTwoFa((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof GatewayError ? error.message : 'Código incorrecto o expirado',
      }));
    }
  };

  const handleClose2FAFlow = () => {
    clearTwoFactorSetupState();
    setTwoFaDialog(false);
    setShowAuthAppRecommendations(false);
    setTwoFa((prev) => ({
      ...prev,
      step: 'idle',
      setupData: {},
      verifyCode: '',
      disableVerification: '',
      isLoading: false,
      error: null,
    }));
    // Reload 2FA status
    getTwoFactorStatus()
      .then((status) => {
        setTwoFa((prev) => ({ ...prev, enabled: status.enabled }));
      })
      .catch(() => {
        // Silent fail
      });
  };

  const handleStartDisable2FA = () => {
    setTwoFa((prev) => ({
      ...prev,
      step: 'disable-confirm',
      disableVerification: '',
      error: null,
    }));
  };

  const handleDisable2FA = async () => {
    if (!twoFa.disableVerification.trim()) {
      setTwoFa((prev) => ({
        ...prev,
        error: 'Ingresa el código TOTP o contraseña para confirmar',
      }));
      return;
    }

    try {
      setTwoFa((prev) => ({ ...prev, isLoading: true, error: null }));
      await disableTwoFactor(twoFa.disableVerification);
      setSaveSuccess('Verificación en dos pasos desactivada correctamente');
      setTimeout(() => {
        handleClose2FAFlow();
        setSaveSuccess(null);
      }, 2000);
    } catch (error) {
      setTwoFa((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof GatewayError ? error.message : 'Error al desactivar 2FA',
      }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // ─── PASSWORD HANDLER ─────────────────────────────────────────────────────

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
      setSaveSuccess('Contraseña actualizada correctamente. Por seguridad, vuelve a iniciar sesión.');

      // D6: Tras éxito, logout y redirección a login con parámetro
      setTimeout(async () => {
        await logoutUser();
        router.push('/auth/login?reason=password-changed');
      }, 2000);
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

  if (twoFa.isLoading) return <PageLoader message="Cargando configuración de seguridad..." className="animate-fade-in" />;

  return (
    <div className="w-full">
      <PageHeader
        title="Seguridad"
        description="Protege tu acceso con contraseña segura, verificación en dos pasos y alertas de riesgo"
        badgeIcon={Shield}
        badgeText="Seguridad"
        tooltip="Seguridad"
        tooltipDetailed="Gestiona el acceso a tu cuenta, activa doble verificación y revisa alertas relacionadas con la seguridad."
        showBackButton
        onBack={() => router.push('/dashboard/account')}
      />

      <div className={`container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} sm:pb-8`}>
        <div className="mb-5">
          <Card variant="section" padding="md">
            <CardIconHeader
              icon={<Shield className="h-5 w-5 text-hoja-tinta" />}
              title="Protege tu cuenta"
              description="Mantén seguro el acceso a tu panel y activa barreras extra antes de modificar datos sensibles."
            />
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            {/* Card A: Cambiar contraseña */}
            <Card className="rounded-2xl border border-border-subtle shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-hoja-tinta" />
                  Cambiar contraseña
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {saveError && (
                  <Alert variant="error">
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                )}

                {saveSuccess && (
                  <Alert variant="success">
                    <AlertDescription>{saveSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                      className="text-xs text-hoja-tinta hover:underline"
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
                      className="text-xs text-hoja-tinta hover:underline"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, next: !prev.next }))}
                    >
                      {showPasswords.next ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
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
                      className="text-xs text-hoja-tinta hover:underline"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="md:col-span-2 lg:col-span-1 lg:col-start-3 flex items-end">
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
              </CardContent>
            </Card>

            {/* Card B: Verificación en dos pasos */}
            <Card className="rounded-2xl border border-border-subtle shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-hoja-tinta" />
                  Verificación en dos pasos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {twoFa.enabled ? (
                  // 2FA Enabled State
                  <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="success" icon={<Check className="w-3 h-3" />}>
                          Activado
                        </Badge>
                        <p className="text-sm text-text-subtle">Tu cuenta está protegida con autenticación en dos pasos.</p>
                      </div>
                      <Dialog open={twoFaDialog} onOpenChange={setTwoFaDialog}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" onClick={handleStartDisable2FA}>
                            Desactivar
                          </Button>
                        </DialogTrigger>

                        {twoFa.step === 'disable-confirm' && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Desactivar verificación en dos pasos</DialogTitle>
                              <DialogDescription>
                                Ingresa tu código TOTP (de tu aplicación de autenticación) o tu contraseña actual para confirmar.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="px-6 py-4 space-y-4">
                              {twoFa.error && (
                                <Alert variant="error">
                                  <AlertDescription>{twoFa.error}</AlertDescription>
                                </Alert>
                              )}

                              <div className="space-y-2">
                                <Label>Código TOTP o contraseña</Label>
                                <Input
                                  type="text"
                                  placeholder="000000 o contraseña"
                                  value={twoFa.disableVerification}
                                  onChange={(e) => setTwoFa((prev) => ({ ...prev, disableVerification: e.target.value }))}
                                  disabled={twoFa.isLoading}
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="secondary"
                                onClick={() => handleClose2FAFlow()}
                                disabled={twoFa.isLoading}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDisable2FA}
                                disabled={twoFa.isLoading}
                              >
                                {twoFa.isLoading ? 'Desactivando...' : 'Desactivar'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    </div>
                  </div>
                ) : (
                  // 2FA Disabled State
                  <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="neutral" icon={<X className="w-3 h-3" />}>
                          Desactivado
                        </Badge>
                        <p className="text-sm text-text-subtle">
                          Añade una capa extra de seguridad a tu cuenta con una app de autenticación.
                        </p>
                      </div>
                      <Dialog open={twoFaDialog} onOpenChange={setTwoFaDialog}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={handleOpenSetupWizard}
                            disabled={twoFa.isLoading}
                          >
                            {twoFa.isLoading ? 'Cargando...' : 'Activar'}
                          </Button>
                        </DialogTrigger>

                    {/* Paso 1 de 3: ¿ya tienes una app de autenticación? */}
                    {twoFa.step === 'setup-choose-app' && (
                      <DialogContent>
                        <DialogHeader>
                          <div className="mb-3 flex gap-1.5">
                            <span className="h-1 flex-1 rounded-full bg-origen-pradera" />
                            <span className="h-1 flex-1 rounded-full bg-border-subtle" />
                            <span className="h-1 flex-1 rounded-full bg-border-subtle" />
                          </div>
                          <DialogTitle>¿Ya tienes una app de autenticación en tu móvil?</DialogTitle>
                          <DialogDescription>
                            La necesitas para generar el código de seguridad cada vez que inicies sesión.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4 space-y-3">
                          {twoFa.error && (
                            <Alert variant="error">
                              <AlertDescription>{twoFa.error}</AlertDescription>
                            </Alert>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowAuthAppRecommendations(false)}
                            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
                              !showAuthAppRecommendations
                                ? 'border-origen-bosque bg-origen-pastel'
                                : 'border-border-subtle bg-surface-alt'
                            }`}
                          >
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                !showAuthAppRecommendations ? 'bg-origen-bosque text-white' : 'bg-origen-pastel text-hoja-tinta'
                              }`}
                            >
                              <Check className="h-5 w-5" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-origen-bosque">Sí, ya la tengo instalada</span>
                              <span className="block text-xs text-text-subtle">Google Authenticator, Authy, etc.</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowAuthAppRecommendations(true)}
                            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
                              showAuthAppRecommendations
                                ? 'border-origen-bosque bg-origen-pastel'
                                : 'border-border-subtle bg-surface-alt'
                            }`}
                          >
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                showAuthAppRecommendations ? 'bg-origen-bosque text-white' : 'bg-origen-pastel text-hoja-tinta'
                              }`}
                            >
                              <Smartphone className="h-5 w-5" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-origen-bosque">No, ayúdame a instalar una</span>
                              <span className="block text-xs text-text-subtle">Es gratis y tarda un minuto</span>
                            </span>
                          </button>

                          {showAuthAppRecommendations && (
                            <div className="space-y-2 pt-1">
                              {RECOMMENDED_AUTH_APPS.map((app) => (
                                <div
                                  key={app.name}
                                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-origen-crema/40 px-3 py-2.5"
                                >
                                  <span className={`h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br ${app.gradient}`} />
                                  <span className="flex-1 text-sm font-medium text-origen-bosque">{app.name}</span>
                                  <a
                                    href={app.ios}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-hoja-tinta underline underline-offset-2"
                                  >
                                    iOS
                                  </a>
                                  <a
                                    href={app.android}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-hoja-tinta underline underline-offset-2"
                                  >
                                    Android
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <DialogFooter>
                          <Button
                            variant="secondary"
                            onClick={() => handleClose2FAFlow()}
                            disabled={twoFa.isLoading}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleStart2FASetup}
                            disabled={twoFa.isLoading}
                          >
                            {twoFa.isLoading ? 'Cargando...' : 'Ya la instalé, continuar'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    )}

                    {/* Paso 2 de 3: escanear o copiar el código */}
                    {twoFa.step === 'setup-qr' && (
                      <DialogContent>
                        <DialogHeader>
                          <div className="mb-3 flex gap-1.5">
                            <span className="h-1 flex-1 rounded-full bg-origen-pradera" />
                            <span className="h-1 flex-1 rounded-full bg-origen-pradera" />
                            <span className="h-1 flex-1 rounded-full bg-border-subtle" />
                          </div>
                          <DialogTitle>Configurar verificación en dos pasos</DialogTitle>
                          <DialogDescription>
                            Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, Microsoft Authenticator, etc.).
                          </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4 space-y-4">
                          {twoFa.error && (
                            <Alert variant="error">
                              <AlertDescription>{twoFa.error}</AlertDescription>
                            </Alert>
                          )}

                          {/* Enlace directo a la app de autenticación — solo tiene sentido en
                              móvil: si configuras el 2FA desde el mismo teléfono que vas a usar
                              como autenticador, es imposible escanear con la cámara un QR que
                              está en la pantalla de ese mismo dispositivo. El sistema operativo
                              entrega el esquema otpauth:// a la app de autenticación instalada
                              (si hay alguna), sin escanear ni copiar nada. Si no hay ninguna app
                              que lo capture, el enlace simplemente no hace nada — no rompe la
                              página. */}
                          {twoFa.setupData.otpauthUri && (
                            <div className="sm:hidden space-y-2">
                              <Button asChild variant="secondary" className="w-full">
                                <a href={twoFa.setupData.otpauthUri}>
                                  Probar acceso directo a mi app de autenticación
                                </a>
                              </Button>
                              <p className="text-xs text-text-subtle text-center">
                                Puede abrir tu app de autenticación (Google Authenticator, Authy, Microsoft Authenticator…) directamente. Si se abre otra app distinta, o no pasa nada, no te preocupes: usa el código QR o el código manual de abajo, que funcionan siempre.
                              </p>
                            </div>
                          )}

                          {/* QR Code */}
                          {twoFa.setupData.qrCodeUrl && (
                            <div className="flex justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={twoFa.setupData.qrCodeUrl}
                                alt="QR Code para 2FA"
                                className="w-48 h-48 border-2 border-border-subtle rounded-lg"
                              />
                            </div>
                          )}

                          {/* Secret Key */}
                          {twoFa.setupData.secret && (
                            <div className="rounded-lg bg-surface-alt p-3 space-y-2">
                              <p className="text-xs font-semibold text-origen-bosque">
                                Código de respaldo (si no puedes escanear el QR):
                              </p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm font-mono bg-surface rounded px-2 py-1 text-origen-bosque break-all">
                                  {twoFa.setupData.secret}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(twoFa.setupData.secret || '')}
                                  className="p-2 hover:bg-surface rounded transition-colors"
                                  aria-label="Copiar código"
                                >
                                  <Copy className="w-4 h-4 text-text-subtle" />
                                </button>
                              </div>
                            </div>
                          )}

                        </div>

                        <DialogFooter>
                          <Button
                            variant="secondary"
                            onClick={() => setTwoFa((prev) => ({ ...prev, step: 'setup-choose-app', error: null }))}
                            disabled={twoFa.isLoading}
                          >
                            Atrás
                          </Button>
                          <Button
                            onClick={() => setTwoFa((prev) => ({ ...prev, step: 'setup-verify', error: null }))}
                            disabled={twoFa.isLoading}
                          >
                            Continuar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    )}

                    {/* Paso 3 de 3: confirmar el código generado */}
                    {twoFa.step === 'setup-verify' && (
                      <DialogContent>
                        <DialogHeader>
                          <div className="mb-3 flex gap-1.5">
                            <span className="h-1 flex-1 rounded-full bg-origen-pradera" />
                            <span className="h-1 flex-1 rounded-full bg-origen-pradera" />
                            <span className="h-1 flex-1 rounded-full bg-origen-pradera" />
                          </div>
                          <DialogTitle>Confirma que quedó bien configurado</DialogTitle>
                          <DialogDescription>
                            Escribe el código de 6 dígitos que tu app de autenticación está mostrando ahora mismo.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4 space-y-4">
                          {twoFa.error && (
                            <Alert variant="error">
                              <AlertDescription>{twoFa.error}</AlertDescription>
                            </Alert>
                          )}

                          {/* TOTP Code Input */}
                          <div className="space-y-2">
                            <Label>Ingresa el código de 6 dígitos para confirmar</Label>
                            <p className="text-xs text-text-subtle">
                              Escribe el código que tu app de autenticación está mostrando <strong>en este momento</strong> (cambia cada 30 segundos) — no un código fijo ni uno anterior.
                            </p>
                            <div className="flex justify-center gap-1 sm:gap-2">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  value={twoFa.verifyCode[i] || ''}
                                  onChange={(e) => {
                                    const newCode = twoFa.verifyCode.split('');
                                    newCode[i] = e.target.value.slice(-1);
                                    const code = newCode.join('').slice(0, 6);
                                    setTwoFa((prev) => ({ ...prev, verifyCode: code }));
                                    // Auto-focus next input
                                    if (e.target.value && i < 5) {
                                      const nextInput = document.querySelector(
                                        `input[data-2fa-digit="${i + 1}"]`
                                      ) as HTMLInputElement;
                                      nextInput?.focus();
                                    }
                                  }}
                                  onPaste={(e) => {
                                    // Pegar el código completo (habitual con gestores de
                                    // contraseñas que también guardan TOTP) solo llenaba la
                                    // primera casilla y perdía el resto en silencio —
                                    // repartirlo entre las 6 casillas en su lugar.
                                    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
                                    if (pasted.length > 1) {
                                      e.preventDefault();
                                      const code = pasted.slice(0, 6);
                                      setTwoFa((prev) => ({ ...prev, verifyCode: code }));
                                      const lastIndex = Math.min(code.length, 6) - 1;
                                      const nextInput = document.querySelector(
                                        `input[data-2fa-digit="${lastIndex}"]`
                                      ) as HTMLInputElement;
                                      nextInput?.focus();
                                    }
                                  }}
                                  className="w-9 h-11 sm:w-12 sm:h-14 text-center text-xl font-semibold tabular-nums rounded-xl border-2 border-border-subtle bg-surface text-origen-bosque transition-colors focus:outline-none focus:border-origen-pradera focus:ring-2 focus:ring-origen-pradera/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={twoFa.isLoading}
                                  data-2fa-digit={i}
                                  aria-label={`Dígito ${i + 1} de 6`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="secondary"
                            onClick={() => setTwoFa((prev) => ({ ...prev, step: 'setup-qr', error: null }))}
                            disabled={twoFa.isLoading}
                          >
                            Atrás
                          </Button>
                          <Button
                            onClick={handleVerify2FACode}
                            disabled={twoFa.isLoading || twoFa.verifyCode.length !== 6}
                          >
                            {twoFa.isLoading ? 'Verificando...' : 'Verificar código'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    )}

                    {/* Recovery Codes Step */}
                    {twoFa.step === 'recovery-codes' && (
                      <DialogContent closeOnOutsideClick={false}>
                        <DialogHeader>
                          <DialogTitle>Códigos de recuperación</DialogTitle>
                          <DialogDescription>
                            Guarda estos códigos en un lugar seguro. Úsalos si pierdes acceso a tu aplicación de autenticación.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4 space-y-4">
                          <Alert variant="warning">
                            <AlertDescription>
                              No podremos mostrar estos códigos de nuevo. Guarda una copia en un lugar seguro.
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-2 rounded-lg bg-surface-alt p-4">
                            {twoFa.recoveryCodesShown?.map((code, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded bg-surface px-3 py-2"
                              >
                                <code className="text-sm font-mono text-origen-bosque">{code}</code>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(code)}
                                  className="p-1.5 hover:bg-surface-alt rounded transition-colors"
                                  aria-label={`Copiar código ${code}`}
                                >
                                  <Copy className="w-3 h-3 text-text-subtle" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <DialogFooter>
                          <Button onClick={() => handleClose2FAFlow()} className="w-full">
                            Entendido, continuar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                    </div>
                  </div>
                )}

                <Alert variant="info">
                  <AlertDescription>
                    Recomendamos usar una contraseña única y activar la verificación en dos pasos antes de actualizar datos bancarios o fiscales.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 xl:self-start">
            <Card className="rounded-2xl border border-border-subtle shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-hoja-tinta" />
                  Estado de protección
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert
                  trailing={
                    <Badge
                      variant={twoFa.enabled ? 'success' : 'neutral'}
                      size="sm"
                      className="shrink-0"
                    >
                      {twoFa.enabled ? 'Protección reforzada' : 'Protección básica'}
                    </Badge>
                  }
                >
                  <AlertDescription>
                    {twoFa.enabled
                      ? 'Protección reforzada activa. Tu cuenta tiene doble verificación habilitada.'
                      : 'Protección básica activa. Mejora tu cuenta habilitando 2FA y revisando accesos recientes.'}
                  </AlertDescription>
                </Alert>
                {!twoFa.enabled && (
                  <Alert
                    variant="warning"
                    trailing={
                      <Badge
                        variant="warning"
                        size="sm"
                        className="shrink-0"
                      >
                        Pendiente
                      </Badge>
                    }
                  >
                    <AlertDescription>
                      Activa la verificación en dos pasos antes de publicar más productos o cambiar datos bancarios.
                    </AlertDescription>
                  </Alert>
                )}
                {twoFa.enabled && (
                  <Alert
                    variant="success"
                    trailing={
                      <Badge
                        variant="success"
                        size="sm"
                        className="shrink-0"
                      >
                        Completo
                      </Badge>
                    }
                  >
                    <AlertDescription>
                      La verificación en dos pasos está activada y proporciona protección adicional a tu cuenta.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
