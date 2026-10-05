'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Camera, CheckCircle, Edit } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { ProfileSectionNav } from '@/app/dashboard/profile/components/ProfileSectionNav';
import { HideBottomTabBar } from '@/components/shared/mobile/HideBottomTabBar';
import { Avatar, Card, CardContent, CardHeader, CardTitle, PageLoader } from '@arcediano/ux-library';
import { Button, Input, Label, Badge, DateInput } from '@arcediano/ux-library';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { appShellPaddingClass, appShellBottomOffsetClass, NAV_HEIGHT_MOBILE_DASHBOARD } from '@arcediano/ux-library';
import { getCurrentUser, updateCurrentUser, type AuthUser } from '@/lib/api/auth';
import { loadOnboardingData, saveStep1, type OnboardingData } from '@/lib/api/onboarding';
import type { EntityType, LocationData } from '@/lib/onboarding/types';
import { getProducerProfile, updateProducerProfile } from '@/lib/api/producers';
import { uploadFile } from '@/lib/api/media';

type PersonalFormState = {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  avatar: string | null;
};

const EMPTY_FORM: PersonalFormState = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  avatar: null,
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };

  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() ?? '';
  const lastName = parts.join(' ');

  return { firstName, lastName };
}

export default function PersonalInfoPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<PersonalFormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<PersonalFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [partialLoadErrors, setPartialLoadErrors] = useState<Record<string, string>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initials = useMemo(() => {
    const clean = form.name.trim();
    if (!clean) return 'P';
    return clean
      .split(' ')
      .map((chunk) => chunk[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [form.name]);

  useEffect(() => {
    let mounted = true;

    const loadProfileData = async () => {
      setIsLoading(true);
      setLoadError(null);
      setPartialLoadErrors({});

      try {
        const results = await Promise.allSettled([
          getCurrentUser(),
          loadOnboardingData(),
          getProducerProfile(),
        ]);

        const [userResult, onboardingResult, producerProfileResult] = results;

        // Si el usuario falla, bloqueamos la página
        if (userResult.status === 'rejected') {
          if (!mounted) return;
          const errorMsg = userResult.reason instanceof Error ? userResult.reason.message : 'Error al cargar datos de usuario';
          setLoadError(errorMsg);
          setIsLoading(false);
          return;
        }

        const user = userResult.value;

        // Recopilar datos parciales, con errores de secciones específicas
        let data: OnboardingData | null = null;
        let producerProfile: any = null;
        const errors: Record<string, string> = {};

        if (onboardingResult.status === 'rejected') {
          errors.onboarding = onboardingResult.reason instanceof Error ? onboardingResult.reason.message : 'No se pudo cargar la información de dirección y empresa';
        } else if (onboardingResult.value?.data) {
          data = onboardingResult.value.data;
        }

        if (producerProfileResult.status === 'rejected') {
          errors.producerProfile = producerProfileResult.reason instanceof Error ? producerProfileResult.reason.message : 'No se pudo cargar la información de perfil comercial';
        } else if (producerProfileResult.status === 'fulfilled') {
          producerProfile = producerProfileResult.value;
        }

        if (!mounted) return;

        // Mapear los datos disponibles
        let formattedBirthDate = '';
        if (user.birthDate) {
          const date = new Date(user.birthDate);
          if (!isNaN(date.getTime())) {
            formattedBirthDate = date.toISOString().split('T')[0];
          }
        }

        const mapped: PersonalFormState = {
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phone ?? '',
          birthDate: formattedBirthDate,
          avatar: producerProfile?.data?.visual?.logoUrl ?? null,
        };

        setAuthUser(user);
        setOnboardingData(data);
        setAvatarKey(producerProfile?.data?.visual?.logoKey ?? null);
        setForm(mapped);
        setInitialForm(mapped);
        setPartialLoadErrors(errors);
      } catch (error) {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : 'Error al cargar el perfil');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadProfileData();

    return () => {
      mounted = false;
    };
  }, []);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio';
    if (!form.phone.trim()) {
      nextErrors.phone = 'El telefono es obligatorio';
    } else if (!/^[+\d\s-]{9,20}$/.test(form.phone.trim())) {
      nextErrors.phone = 'Formato de teléfono inválido. Ejemplo: +34 612 345 678';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCancel = () => {
    setForm(initialForm);
    setErrors({});
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditing(false);
  };

  const retryPartialLoad = async (section: string) => {
    try {
      const errors = { ...partialLoadErrors };
      delete errors[section];
      setPartialLoadErrors(errors);

      if (section === 'onboarding') {
        const result = await loadOnboardingData();
        if (result?.data) {
          setOnboardingData(result.data);
        }
      } else if (section === 'producerProfile') {
        const result = await getProducerProfile();
        if (result?.data) {
          setAvatarKey(result.data.visual?.logoKey ?? null);
          setForm((prev) => ({
            ...prev,
            avatar: result.data.visual?.logoUrl ?? null,
          }));
        }
      }
    } catch (error) {
      setPartialLoadErrors((prev) => ({
        ...prev,
        [section]: error instanceof Error ? error.message : 'Error al reintentar cargar esta sección',
      }));
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaveError(null);
    try {
      const { key, url } = await uploadFile(file, 'visual/logo');
      setForm((prev) => ({ ...prev, avatar: url ?? URL.createObjectURL(file) }));
      setAvatarKey(key);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al subir la imagen de avatar.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!onboardingData) {
      setSaveError('No se pudieron cargar los datos base para guardar.');
      return;
    }

    const taxId = onboardingData.fiscal?.taxId?.trim();
    if (!taxId) {
      setSaveError('No se puede guardar sin CIF/NIF en onboarding. Completa primero los datos fiscales.');
      return;
    }

    // La dirección se gestiona en Mi negocio: aquí se reenvía tal cual está guardada.
    const location = onboardingData.location;
    if (!location?.street || !location.city || !location.postalCode || !location.province) {
      setSaveError('Completa primero la dirección de tu negocio en Mi negocio.');
      return;
    }

    const step1Payload: LocationData = {
      entityType: onboardingData.fiscal?.entityType as EntityType | undefined,
      legalRepresentativeName: onboardingData.fiscal?.legalRepresentativeName ?? '',
      businessPhone: form.phone.replace(/\s+/g, ''),
      taxId,
      street: location.street,
      streetNumber: location.streetNumber ?? 'S/N',
      streetComplement: location.streetComplement ?? '',
      city: location.city,
      province: location.province,
      postalCode: location.postalCode,
      billingAddressSameAsProduction: !onboardingData.fiscal?.billingAddress,
      billingAddress: onboardingData.fiscal?.billingAddress
        ? {
            street: onboardingData.fiscal.billingAddress.street ?? '',
            streetNumber: onboardingData.fiscal.billingAddress.streetNumber ?? '',
            streetComplement: onboardingData.fiscal.billingAddress.streetComplement ?? '',
            city: onboardingData.fiscal.billingAddress.city ?? '',
            province: onboardingData.fiscal.billingAddress.province ?? '',
            postalCode: onboardingData.fiscal.billingAddress.postalCode ?? '',
          }
        : undefined,
      categories: onboardingData.fiscal?.categories ?? [],
      locationImages: [],
    };

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Sin segundo argumento: `locationImageKeys` omitido = no tocar las fotos del local
      // (pasar `[]` las borraría todas). La historia/tagline ya no viaja por el onboarding.
      const updates: Array<Promise<unknown>> = [saveStep1(step1Payload)];

      if (authUser) {
        const authUserPayload: Parameters<typeof updateCurrentUser>[0] = {};

        const fullName = splitName(form.name);
        if (fullName.firstName && (fullName.firstName !== authUser.firstName || fullName.lastName !== authUser.lastName)) {
          authUserPayload.firstName = fullName.firstName;
          authUserPayload.lastName = fullName.lastName;
        }

        if (form.phone !== (authUser.phone ?? '')) {
          authUserPayload.phone = form.phone;
        }

        if (form.birthDate !== (initialForm.birthDate ?? '')) {
          authUserPayload.birthDate = form.birthDate;
        }

        if (Object.keys(authUserPayload).length > 0) {
          updates.push(updateCurrentUser(authUserPayload));
        }
      }

      if (avatarKey && avatarKey !== initialForm.avatar) {
        updates.push(updateProducerProfile({ logoKey: avatarKey }));
      }

      await Promise.all(updates);

      setInitialForm(form);
      setIsEditing(false);
      setSaveSuccess('Cambios guardados en API real.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageLoader message="Cargando datos personales..." />;

  return (
    <div className="w-full">
      <div className="fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <PageHeader
        title="Datos personales"
        description="Actualiza tu nombre, datos de contacto y foto de perfil de tu cuenta de productor"
        badgeIcon={User}
        badgeText="Datos personales"
        tooltip="Datos personales"
        tooltipDetailed="Actualiza tus datos de contacto y foto de perfil personal, distintos de la información comercial de tu negocio."
        showBackButton={true}
        onBack={() => router.push('/dashboard/profile')}
      />

      <div className={`container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, isEditing ? 64 : 0)} sm:pb-8 ${isEditing ? 'lg:pb-28' : ''}`}>
        <ProfileSectionNav className="mt-3" />

        <div className="mt-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {loadError && (
              <Alert variant="error">
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            )}

            {Object.entries(partialLoadErrors).map(([section, error]) => (
              <Alert key={section} variant="warning" className="flex items-center justify-between">
                <AlertDescription>{error}</AlertDescription>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => retryPartialLoad(section)}
                  className="ml-4 shrink-0"
                >
                  Reintentar
                </Button>
              </Alert>
            ))}

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

            <motion.div variants={itemVariants}>
              <Card className="border border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="relative group shrink-0">
                      <Avatar
                        src={form.avatar ?? undefined}
                        alt={form.name}
                        shape="rounded"
                        size="2xl"
                        className="w-24 h-24 shadow-md bg-origen-bosque"
                        fallback={<span className="text-white text-3xl font-semibold">{initials}</span>}
                      />

                      {isEditing && (
                        <>
                          <div
                            className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                            onClick={() => avatarInputRef.current?.click()}
                          />
                          <div
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                            onClick={() => avatarInputRef.current?.click()}
                          >
                            <div className="bg-surface-alt rounded-full p-2 shadow-lg">
                              <Camera className="w-4 h-4 text-origen-bosque" />
                            </div>
                          </div>
                        </>
                      )}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                        aria-label="Subir avatar"
                      />
                      <p className="mt-2 max-w-[6.5rem] text-center text-[11px] leading-snug text-text-subtle">
                        Mismo logo que en Mi negocio
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                          <h2 className="text-xl font-bold text-origen-bosque truncate">{form.name || 'Perfil de productor'}</h2>
                          <p className="text-sm text-muted-foreground truncate">{form.email || 'Sin email disponible'}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="success" size="xs" icon={<CheckCircle className="w-3 h-3" />}>
                              Verificado
                            </Badge>
                            <Badge variant="leaf" size="xs">Productor</Badge>
                          </div>
                        </div>

                        {!isEditing && (
                          <div className="flex gap-2 shrink-0">
                            <Button onClick={() => setIsEditing(true)} size="sm" variant="secondary" disabled={isLoading}>
                              <span className="flex items-center gap-1">
                                <Edit className="w-3.5 h-3.5" />
                                Editar
                              </span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="border border-border shadow-sm h-full">
                  <CardHeader className="pb-3 border-b border-border-subtle">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="w-4 h-4 text-hoja-tinta" />
                      Datos personales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre completo <span className="text-feedback-danger">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        disabled={!isEditing}
                        className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        placeholder="Tu nombre completo"
                      />
                      {errors.name && <p className="text-xs text-feedback-danger">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        disabled={true}
                        className="h-10 bg-surface cursor-not-allowed"
                        placeholder="tu@email.com"
                        title="El email no puede modificarse aquí. Contacta con soporte para cambiar tu dirección."
                      />
                      <p className="text-xs text-muted-foreground">El email no se puede modificar desde este panel.</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Telefono <span className="text-feedback-danger">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        disabled={!isEditing}
                        className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        placeholder="+34 612 345 678"
                      />
                      {errors.phone && <p className="text-xs text-feedback-danger">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1">
                      <DateInput
                        id="birthDate"
                        label="Fecha de nacimiento"
                        value={form.birthDate}
                        onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                        disabled={!isEditing}
                        inputSize="md"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <Alert variant={isLoading ? 'default' : 'success'} className="py-3">
                <AlertDescription className="text-sm">
                  {isLoading
                    ? 'Cargando datos reales de tu perfil...'
                    : 'Tu identidad ha sido verificada. Si necesitas actualizar tu documento, contacta con soporte.'}
                </AlertDescription>
              </Alert>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Barra de guardado sticky – todos los breakpoints, para no obligar a volver
          arriba al editar campos por debajo de la primera pantalla */}
      {isEditing && (
        <>
          <HideBottomTabBar />
          <div className={`fixed left-0 right-0 ${appShellBottomOffsetClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} lg:bottom-6 z-30 px-4 sm:px-6`}>
          <div className="mx-auto max-w-[680px] rounded-2xl border border-border-subtle bg-surface-alt/95 backdrop-blur-md p-3 shadow-lg">
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={handleCancel}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
