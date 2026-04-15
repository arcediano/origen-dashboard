'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  FileText,
  Save,
  MapPin,
  Globe,
  Phone,
  CheckCircle,
  Plus,
  X,
  Award,
  Edit,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { ProfileSectionNav } from '@/app/dashboard/profile/components/ProfileSectionNav';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@arcediano/ux-library';
import { Textarea } from '@arcediano/ux-library';
import { loadOnboardingData, loadProducerProfile, saveStep1, saveStep2, type OnboardingData } from '@/lib/api/onboarding';

type BusinessFormState = {
  businessName: string;
  legalName: string;
  taxId: string;
  foundedYear: string;
  teamSize: string;
  description: string;
  categories: string[];
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  socialMedia: {
    instagram: string;
    facebook: string;
    twitter: string;
    youtube: string;
  };
  logo: string | null;
  banner: string | null;
};

const EMPTY_FORM: BusinessFormState = {
  businessName: '',
  legalName: '',
  taxId: '',
  foundedYear: '',
  teamSize: '',
  description: '',
  categories: [],
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'Espana',
  socialMedia: {
    instagram: '',
    facebook: '',
    twitter: '',
    youtube: '',
  },
  logo: null,
  banner: null,
};

function mapTeamSizeFromApi(value?: string | null): string {
  if (value === 'ONE_TWO' || value === '1-2') return '1-2';
  if (value === 'THREE_FIVE' || value === '3-5') return '3-5';
  if (value === 'SIX_TEN' || value === '6-10') return '6-10';
  if (value === 'ELEVEN_PLUS' || value === '11+') return '11+';
  return '';
}

function splitStreet(fullAddress: string, fallbackStreet?: string, fallbackNumber?: string) {
  const clean = fullAddress.trim();
  if (!clean) {
    return {
      street: fallbackStreet ?? '',
      streetNumber: fallbackNumber ?? 'S/N',
    };
  }

  const parts = clean.split(/\s+/);
  const maybeNumber = parts[parts.length - 1] ?? '';
  const looksNumber = /\d/.test(maybeNumber);

  if (!looksNumber) {
    return {
      street: clean,
      streetNumber: fallbackNumber ?? 'S/N',
    };
  }

  parts.pop();
  return {
    street: parts.join(' ') || fallbackStreet || clean,
    streetNumber: maybeNumber,
  };
}

export default function BusinessInfoPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<BusinessFormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<BusinessFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [newCategory, setNewCategory] = useState('');

  const producerInitial = useMemo(() => {
    if (!form.businessName) return 'P';
    return form.businessName.charAt(0).toUpperCase();
  }, [form.businessName]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await loadProducerProfile();
        if (!response?.data) {
          throw new Error('No hay datos de onboarding para el perfil comercial.');
        }

        const data = response.data;

        const mapped: BusinessFormState = {
          businessName: data.story?.businessName ?? data.fiscal?.businessName ?? '',
          legalName: data.fiscal?.legalName ?? '',
          taxId: data.fiscal?.taxId ?? '',
          foundedYear: data.location?.foundedYear ? String(data.location.foundedYear) : '',
          teamSize: mapTeamSizeFromApi(data.location?.teamSize),
          description: data.story?.description ?? '',
          categories: data.fiscal?.categories ?? [],
          phone: data.fiscal?.businessPhone ?? '',
          email: '',
          website: data.story?.website ?? '',
          address: [data.location?.street, data.location?.streetNumber].filter(Boolean).join(' ').trim(),
          city: data.location?.city ?? '',
          province: data.location?.province ?? '',
          postalCode: data.location?.postalCode ?? '',
          country: 'Espana',
          socialMedia: {
            instagram: data.story?.instagramHandle ?? '',
            facebook: '',
            twitter: '',
            youtube: '',
          },
          logo: null,
          banner: null,
        };

        if (!mounted) return;
        setOnboardingData(data);
        setForm(mapped);
        setInitialForm(mapped);
      } catch (error) {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : 'Error al cargar perfil comercial.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.businessName.trim()) nextErrors.businessName = 'El nombre del negocio es obligatorio';
    if (!form.taxId.trim()) nextErrors.taxId = 'El CIF/NIF es obligatorio';
    if (!form.phone.trim()) nextErrors.phone = 'El telefono es obligatorio';
    if (form.website.trim() && !/^https?:\/\//i.test(form.website.trim())) {
      nextErrors.website = 'Incluye URL valida (http:// o https://)';
    }
    if (form.description.trim().length < 50) {
      nextErrors.description = 'La descripcion debe tener al menos 50 caracteres';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddCategory = () => {
    const category = newCategory.trim();
    if (!category) return;
    if (form.categories.some((item) => item.toLowerCase() === category.toLowerCase())) {
      return;
    }

    setForm((prev) => ({ ...prev, categories: [...prev.categories, category] }));
    setNewCategory('');
  };

  const handleRemoveCategory = (category: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((item) => item !== category),
    }));
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
      setSaveError('No se pudo cargar la base de onboarding para guardar.');
      return;
    }

    const streetData = splitStreet(
      form.address,
      onboardingData.location?.street,
      onboardingData.location?.streetNumber,
    );

    const step1Payload: Parameters<typeof saveStep1>[0] = {
      entityType: onboardingData.fiscal?.entityType as Parameters<typeof saveStep1>[0]['entityType'],
      legalRepresentativeName: onboardingData.fiscal?.legalRepresentativeName ?? '',
      businessPhone: form.phone.replace(/\s+/g, ''),
      taxId: form.taxId.trim(),
      street: streetData.street,
      streetNumber: streetData.streetNumber,
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
      categories: form.categories,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      teamSize: form.teamSize as Parameters<typeof saveStep1>[0]['teamSize'],
      locationImages: [],
    };

    const step2Payload: Parameters<typeof saveStep2>[0] = {
      businessName: form.businessName.trim(),
      tagline: onboardingData.story?.tagline ?? '',
      description: form.description.trim(),
      productionPhilosophy: onboardingData.story?.productionPhilosophy ?? '',
      values: onboardingData.story?.values?.length
        ? onboardingData.story.values
        : ['Calidad', 'Origen local'],
      website: form.website.trim(),
      instagramHandle: form.socialMedia.instagram.trim(),
      certifications: [],
      photos: [],
    };

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await Promise.all([
        saveStep1(step1Payload, []),
        saveStep2(step2Payload, []),
      ]);

      setInitialForm(form);
      setIsEditing(false);
      setSaveSuccess('Perfil comercial sincronizado con API real.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar el perfil comercial.');
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
          title="Información del negocio"
          description="Gestiona los datos oficiales de tu empresa, contacto, dirección fiscal, categorías y redes sociales"
          badgeIcon={Store}
          badgeText="Negocio"
          showBackButton={true}
          onBack={() => router.back()}
        />

        <ProfileSectionNav className="mt-3" />

        <div className="mt-6">
          {loadError && (
            <Alert className="mb-6 border-feedback-danger/30 bg-feedback-danger/10">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}

          {saveError && (
            <Alert className="mb-6 border-feedback-danger/30 bg-feedback-danger/10">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {saveSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">{saveSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="mb-6">
            <Card className="overflow-hidden border border-border shadow-sm">
              <div className="h-32 sm:h-48 bg-gradient-to-r from-origen-pradera to-origen-hoja relative">
                {form.banner ? (
                  <img src={form.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-white/30" />
                  </div>
                )}
                {isEditing && (
                  <button className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-surface-alt shadow-lg flex items-center justify-center text-origen-bosque hover:text-origen-pradera transition-colors">
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </div>

              <CardContent className="relative px-6 pb-6">
                <div className="flex items-end gap-6 -mt-16 mb-4">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-xl bg-surface-alt shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
                      {form.logo ? (
                        <img src={form.logo} alt={form.businessName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
                          <span className="text-3xl font-bold text-origen-pradera/50">{producerInitial}</span>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 pb-2">
                    <h2 className="text-2xl font-bold text-origen-bosque">{form.businessName || 'Perfil comercial'}</h2>
                    <p className="text-sm text-muted-foreground">CIF: {form.taxId || 'Pendiente'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 flex justify-end">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="lg" disabled={isLoading}>
                <span className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar informacion del negocio
                </span>
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={handleCancel}>
                  <span className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Cancelar
                  </span>
                </Button>
                <Button size="lg" onClick={handleSave} disabled={isSaving || isLoading}>
                  <span className="flex items-center gap-2">
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar cambios
                      </>
                    )}
                  </span>
                </Button>
              </div>
            )}
          </div>

          <div className="mb-8">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Tu negocio ha sido verificado. La informacion fiscal se sincroniza con producers-service.
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="w-5 h-5 text-origen-pradera" />
                  Datos principales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="businessName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Nombre comercial
                    </Label>
                    <Input
                      id="businessName"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                    {errors.businessName && <p className="text-xs text-feedback-danger">{errors.businessName}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="legalName">Razon social (si es diferente)</Label>
                    <Input
                      id="legalName"
                      value={form.legalName}
                      onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      CIF / NIF
                    </Label>
                    <Input
                      id="taxId"
                      value={form.taxId}
                      onChange={(e) => setForm({ ...form, taxId: e.target.value.toUpperCase() })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                    {errors.taxId && <p className="text-xs text-feedback-danger">{errors.taxId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="foundedYear">Ano de fundacion</Label>
                    <Input
                      id="foundedYear"
                      value={form.foundedYear}
                      onChange={(e) => setForm({ ...form, foundedYear: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                      placeholder="Ej: 1985"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Tamano del equipo</Label>
                    <Input
                      id="teamSize"
                      value={form.teamSize}
                      onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                      placeholder="1-2, 3-5, 6-10, 11+"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5 text-origen-pradera" />
                  Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.categories.map((cat) => (
                    <Badge key={cat} variant="leaf" size="md" className="px-3 py-1.5">
                      {cat}
                      {isEditing && (
                        <button className="ml-2 hover:text-red-500" onClick={() => handleRemoveCategory(cat)}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nueva categoria"
                    />
                    <Button variant="outline" size="sm" onClick={handleAddCategory}>
                      <Plus className="w-4 h-4 mr-2" />
                      Anadir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5 text-origen-pradera" />
                  Contacto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Telefono
                    </Label>
                    <Input
                      id="businessPhone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                    {errors.phone && <p className="text-xs text-feedback-danger">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Email de contacto</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={true}
                      className="bg-surface"
                      placeholder="Se gestiona desde autenticacion"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio web</Label>
                    <Input
                      id="website"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                      placeholder="https://..."
                    />
                    {errors.website && <p className="text-xs text-feedback-danger">{errors.website}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-origen-pradera" />
                  Direccion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="businessAddress">Direccion</Label>
                    <Input
                      id="businessAddress"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessCity">Ciudad</Label>
                    <Input
                      id="businessCity"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessPostalCode">Codigo postal</Label>
                    <Input
                      id="businessPostalCode"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessProvince">Provincia</Label>
                    <Input
                      id="businessProvince"
                      value={form.province}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessCountry">Pais</Label>
                    <Input id="businessCountry" value={form.country} disabled={true} className="bg-surface" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="w-5 h-5 text-origen-pradera" />
                  Redes sociales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={form.socialMedia.instagram}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialMedia: { ...form.socialMedia, instagram: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                      placeholder="@usuario"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={form.socialMedia.facebook}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialMedia: { ...form.socialMedia, facebook: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <Input
                      id="twitter"
                      value={form.socialMedia.twitter}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialMedia: { ...form.socialMedia, twitter: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={form.socialMedia.youtube}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialMedia: { ...form.socialMedia, youtube: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-surface' : ''}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-origen-pradera" />
                  Descripcion del negocio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Descripcion</Label>
                  <Textarea
                    id="businessDescription"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    disabled={!isEditing}
                    rows={6}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                  <p className="text-xs text-muted-foreground text-right">{form.description.length}/5000</p>
                  {errors.description && <p className="text-xs text-feedback-danger">{errors.description}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
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
