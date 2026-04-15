'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Save, Camera, CheckCircle, Edit, X } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { ProfileSectionNav } from '@/app/dashboard/profile/components/ProfileSectionNav';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { Button, Input, Label, Badge } from '@arcediano/ux-library';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { getCurrentUser, updateCurrentUser, type AuthUser } from '@/lib/api/auth';
import { loadOnboardingData, saveStep1, saveStep2, type OnboardingData } from '@/lib/api/onboarding';

type PersonalFormState = {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  bio: string;
  avatar: string | null;
};

const EMPTY_FORM: PersonalFormState = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  address: '',
  city: '',
  postalCode: '',
  province: '',
  country: 'Espana',
  bio: '',
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

function mapTeamSizeFromApi(value?: string | null): '1-2' | '3-5' | '6-10' | '11+' | undefined {
  if (value === 'ONE_TWO' || value === '1-2') return '1-2';
  if (value === 'THREE_FIVE' || value === '3-5') return '3-5';
  if (value === 'SIX_TEN' || value === '6-10') return '6-10';
  if (value === 'ELEVEN_PLUS' || value === '11+') return '11+';
  return undefined;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };

  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() ?? '';
  const lastName = parts.join(' ');

  return { firstName, lastName };
}

function buildAddress(street?: string, streetNumber?: string): string {
  return [street, streetNumber].filter(Boolean).join(' ').trim();
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

      try {
        const [user, onboardingRes] = await Promise.all([
          getCurrentUser(),
          loadOnboardingData(),
        ]);

        if (!onboardingRes?.data) {
          throw new Error('No hay datos de onboarding disponibles para este perfil');
        }

        const data = onboardingRes.data;
        const mapped: PersonalFormState = {
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: data.fiscal?.businessPhone ?? '',
          birthDate: '',
          address: buildAddress(data.location?.street, data.location?.streetNumber),
          city: data.location?.city ?? '',
          postalCode: data.location?.postalCode ?? '',
          province: data.location?.province ?? '',
          country: 'Espana',
          bio: data.story?.tagline ?? data.story?.description ?? '',
          avatar: null,
        };

        if (!mounted) return;

        setAuthUser(user);
        setOnboardingData(data);
        setForm(mapped);
        setInitialForm(mapped);
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
    if (!form.email.trim()) nextErrors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Email no valido';
    if (!form.phone.trim()) nextErrors.phone = 'El telefono es obligatorio';

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

    const businessName = (onboardingData.story?.businessName ?? onboardingData.fiscal?.businessName ?? '').trim();
    if (!businessName) {
      setSaveError('No se puede guardar sin nombre comercial. Completa primero tu perfil de negocio.');
      return;
    }

    const descriptionBase = (onboardingData.story?.description ?? '').trim();
    if (descriptionBase.length < 50) {
      setSaveError('No se puede guardar mientras falte una descripcion comercial valida en onboarding.');
      return;
    }

    const addressParts = form.address.trim().split(/\s+/);
    const streetNumber = onboardingData.location?.streetNumber ?? addressParts.pop() ?? 'S/N';
    const street = onboardingData.location?.street ?? (addressParts.join(' ') || form.address.trim());

    const step1Payload: Parameters<typeof saveStep1>[0] = {
      entityType: onboardingData.fiscal?.entityType as Parameters<typeof saveStep1>[0]['entityType'],
      legalRepresentativeName: onboardingData.fiscal?.legalRepresentativeName ?? '',
      businessPhone: form.phone.replace(/\s+/g, ''),
      taxId,
      street,
      streetNumber,
      streetComplement: onboardingData.location?.streetComplement ?? '',
      city: form.city.trim(),
      province: form.province.trim(),
      postalCode: form.postalCode.trim(),
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
      foundedYear: onboardingData.location?.foundedYear ?? undefined,
      teamSize: mapTeamSizeFromApi(onboardingData.location?.teamSize),
      locationImages: [],
    };

    const step2Payload: Parameters<typeof saveStep2>[0] = {
      businessName,
      tagline: form.bio.trim().slice(0, 200),
      description: descriptionBase,
      productionPhilosophy: onboardingData.story?.productionPhilosophy ?? '',
      values: onboardingData.story?.values?.length
        ? onboardingData.story.values
        : ['Calidad', 'Proximidad'],
      website: onboardingData.story?.website ?? '',
      instagramHandle: onboardingData.story?.instagramHandle ?? '',
      certifications: [],
      photos: [],
    };

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updates: Array<Promise<unknown>> = [
        saveStep1(step1Payload, []),
        saveStep2(step2Payload, []),
      ];

      if (authUser) {
        const fullName = splitName(form.name);
        if (fullName.firstName && (fullName.firstName !== authUser.firstName || fullName.lastName !== authUser.lastName)) {
          updates.push(updateCurrentUser({ firstName: fullName.firstName, lastName: fullName.lastName }));
        }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <div className="fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">
        <PageHeader
          title="Datos personales"
          description="Actualiza tu nombre, datos de contacto, dirección y foto de perfil de tu cuenta de productor"
          badgeIcon={User}
          badgeText="Datos personales"
          showBackButton={true}
          onBack={() => router.back()}
        />

        <ProfileSectionNav className="mt-3" />

        <div className="mt-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {loadError && (
              <Alert className="border-feedback-danger/30 bg-feedback-danger/10">
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            )}

            {saveError && (
              <Alert className="border-feedback-danger/30 bg-feedback-danger/10">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            {saveSuccess && (
              <Alert className="border-origen-pradera/30 bg-origen-pastel/40">
                <CheckCircle className="w-4 h-4 text-origen-pradera" />
                <AlertDescription className="text-origen-bosque">{saveSuccess}</AlertDescription>
              </Alert>
            )}

            <motion.div variants={itemVariants}>
              <Card className="border border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-origen-pradera to-origen-hoja flex items-center justify-center shadow-md overflow-hidden">
                        {form.avatar ? (
                          <img src={form.avatar} alt={form.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-3xl font-semibold">{initials}</span>
                        )}
                      </div>

                      {isEditing && (
                        <>
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-surface-alt rounded-full p-2 shadow-lg">
                              <Camera className="w-4 h-4 text-origen-bosque" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                          <h2 className="text-xl font-bold text-origen-bosque truncate">{form.name || 'Perfil de productor'}</h2>
                          <p className="text-sm text-muted-foreground truncate">{form.email || 'Sin email disponible'}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="success" size="xs" className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificado
                            </Badge>
                            <Badge variant="leaf" size="xs">Productor</Badge>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {!isEditing ? (
                            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="border-origen-pradera text-origen-pradera hover:bg-origen-pradera/10" disabled={isLoading}>
                              <span className="flex items-center gap-1">
                                <Edit className="w-3.5 h-3.5" />
                                Editar
                              </span>
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={handleCancel} className="text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" />
                                  Cancelar
                                </span>
                              </Button>
                              <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading}>
                                <span className="flex items-center gap-1">
                                  {isSaving ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Guardando
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-3.5 h-3.5" />
                                      Guardar
                                    </>
                                  )}
                                </span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="border border-border shadow-sm h-full">
                  <CardHeader className="pb-3 border-b border-border-subtle">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="w-4 h-4 text-origen-pradera" />
                      Datos personales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre completo <span className="text-red-500">*</span>
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
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        disabled={true}
                        className="h-10 bg-surface"
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Telefono <span className="text-red-500">*</span>
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
                      <Label htmlFor="birthDate" className="text-sm font-medium">
                        Fecha de nacimiento
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={form.birthDate}
                        onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                        disabled={true}
                        className="h-10 bg-surface"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border border-border shadow-sm h-full">
                  <CardHeader className="pb-3 border-b border-border-subtle">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="w-4 h-4 text-origen-pradera" />
                      Direccion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Direccion
                      </Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        disabled={!isEditing}
                        className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        placeholder="Calle, numero, piso..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="city" className="text-sm">Ciudad</Label>
                        <Input
                          id="city"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          disabled={!isEditing}
                          className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="postalCode" className="text-sm">Codigo postal</Label>
                        <Input
                          id="postalCode"
                          value={form.postalCode}
                          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                          disabled={!isEditing}
                          className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="province" className="text-sm">Provincia</Label>
                        <Input
                          id="province"
                          value={form.province}
                          onChange={(e) => setForm({ ...form, province: e.target.value })}
                          disabled={!isEditing}
                          className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="country" className="text-sm">Pais</Label>
                        <Input
                          id="country"
                          value={form.country}
                          disabled={true}
                          className="h-10 bg-surface"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border-subtle">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4 text-origen-pradera" />
                    Biografia
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-1">
                    <textarea
                      id="bio"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full p-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-origen-menta/50 focus:border-origen-pradera disabled:bg-surface"
                      placeholder="Cuentanos algo sobre ti..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Esta informacion se sincroniza con el tagline comercial de tu perfil.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Alert className="bg-origen-crema/20 border-origen-pradera/30 py-3">
                <CheckCircle className="w-4 h-4 text-origen-pradera" />
                <AlertDescription className="text-sm text-origen-bosque">
                  {isLoading
                    ? 'Cargando datos reales de tu perfil...'
                    : 'Tu identidad ha sido verificada. Si necesitas actualizar tu documento, contacta con soporte.'}
                </AlertDescription>
              </Alert>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Barra de guardado sticky – solo móvil */}
      {isEditing && (
        <div className="fixed left-0 right-0 bottom-[calc(88px+env(safe-area-inset-bottom))] lg:hidden z-30 px-4 sm:px-6">
          <div className="mx-auto max-w-[680px] rounded-2xl border border-border-subtle bg-surface-alt/95 backdrop-blur-md p-3 shadow-lg">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
