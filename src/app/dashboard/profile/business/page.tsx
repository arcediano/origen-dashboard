'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  FileText,
  Save,
  MapPin,
  Phone,
  CheckCircle,
  Loader2,
  Plus,
  X,
  Edit,
  Camera,
  Image as ImageIcon,
  Building2,
  Tags,
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
import { motion } from 'framer-motion';
import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import { PRODUCER_CATEGORIES } from '@/constants/categories';
import { getProvinciaFromCP } from '@/constants/cp-provincias';
import {
  getProducerProfile,
  updateProducerProfile,
  type ProducerProfileData,
  type UpdateProducerProfilePayload,
} from '@/lib/api/producers';
import { uploadFile } from '@/lib/api/media';

type BusinessFormState = {
  businessName: string;
  legalName: string;
  taxId: string;
  entityType: string;
  legalRepresentativeName: string;
  foundedYear: string;
  teamSize: string;
  description: string;
  tagline: string;
  productionPhilosophy: string;
  values: string[];
  categories: string[];
  phone: string;
  website: string;
  instagram: string;
  street: string;
  streetNumber: string;
  streetComplement: string;
  city: string;
  province: string;
  postalCode: string;
  logo: string | null;
  banner: string | null;
  logoKey: string | null;
  bannerKey: string | null;
};

const EMPTY_FORM: BusinessFormState = {
  businessName: '',
  legalName: '',
  taxId: '',
  entityType: '',
  legalRepresentativeName: '',
  foundedYear: '',
  teamSize: '',
  description: '',
  tagline: '',
  productionPhilosophy: '',
  values: [],
  categories: [],
  phone: '',
  website: '',
  instagram: '',
  street: '',
  streetNumber: '',
  streetComplement: '',
  city: '',
  province: '',
  postalCode: '',
  logo: null,
  banner: null,
  logoKey: null,
  bannerKey: null,
};

const TEAM_SIZE_OPTIONS = [
  { value: 'ONE_TWO', label: '1-2 personas' },
  { value: 'THREE_FIVE', label: '3-5 personas' },
  { value: 'SIX_TEN', label: '6-10 personas' },
  { value: 'ELEVEN_PLUS', label: '11 o mas personas' },
] as const;

const ENTITY_TYPE_OPTIONS = [
  { value: 'autonomo', label: 'Autonomo' },
  { value: 'sl', label: 'SL' },
  { value: 'sa', label: 'SA' },
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'comunidad_bienes', label: 'Comunidad de bienes' },
  { value: 'asociacion', label: 'Asociacion' },
  { value: 'otro', label: 'Otro' },
] as const;

const CORE_VALUES = [
  { id: 'sostenibilidad', label: 'Sostenibilidad' },
  { id: 'calidad', label: 'Calidad' },
  { id: 'tradicion', label: 'Tradicion' },
  { id: 'innovacion', label: 'Innovacion' },
  { id: 'local', label: 'Local' },
  { id: 'artesanal', label: 'Artesanal' },
  { id: 'ecologico', label: 'Ecologico' },
  { id: 'familiar', label: 'Familiar' },
];

function mapTeamSizeFromApi(value?: string | null): string {
  if (value === 'ONE_TWO' || value === '1-2') return 'ONE_TWO';
  if (value === 'THREE_FIVE' || value === '3-5') return 'THREE_FIVE';
  if (value === 'SIX_TEN' || value === '6-10') return 'SIX_TEN';
  if (value === 'ELEVEN_PLUS' || value === '11+') return 'ELEVEN_PLUS';
  return '';
}

function resolveVisualUrl(url?: string | null, key?: string | null): string | null {
  if (url && /^https?:\/\//i.test(url)) return url;
  if (key && /^https?:\/\//i.test(key)) return key;

  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE_URL;
  if (!cdnBase || !key) return url ?? null;

  const normalizedBase = cdnBase.endsWith('/') ? cdnBase.slice(0, -1) : cdnBase;
  const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
  return `${normalizedBase}/${normalizedKey}`;
}

function mapProfileToForm(data: ProducerProfileData): BusinessFormState {
  const logoUrl = resolveVisualUrl(data.visual?.logoUrl, data.visual?.logoKey);
  const bannerUrl = resolveVisualUrl(data.visual?.bannerUrl, data.visual?.bannerKey);

  return {
    businessName: data.story?.businessName ?? data.fiscal?.businessName ?? '',
    legalName: data.fiscal?.legalName ?? '',
    taxId: data.fiscal?.taxId ?? '',
    entityType: data.fiscal?.entityType ?? '',
    legalRepresentativeName: data.fiscal?.legalRepresentativeName ?? '',
    foundedYear: data.location?.foundedYear ? String(data.location.foundedYear) : '',
    teamSize: mapTeamSizeFromApi(data.location?.teamSize),
    description: data.story?.description ?? '',
    tagline: data.story?.tagline ?? '',
    productionPhilosophy: data.story?.productionPhilosophy ?? '',
    values: data.story?.values ?? [],
    categories: data.fiscal?.categories ?? [],
    phone: data.fiscal?.businessPhone ?? '',
    website: data.story?.website ?? '',
    instagram: data.story?.instagramHandle ?? '',
    street: data.location?.street ?? '',
    streetNumber: data.location?.streetNumber ?? '',
    streetComplement: data.location?.streetComplement ?? '',
    city: data.location?.city ?? '',
    province: data.location?.province ?? '',
    postalCode: data.location?.postalCode ?? '',
    logo: logoUrl,
    banner: bannerUrl,
    logoKey: data.visual?.logoKey ?? null,
    bannerKey: data.visual?.bannerKey ?? null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Cálculo de completitud por secciones
// ──────────────────────────────────────────────────────────────────────────

type SectionCompleteness = {
  [key: string]: {
    isComplete: boolean;
    filledFields: number;
    totalFields: number;
    percent: number;
  };
};

function calculateSectionCompleteness(form: BusinessFormState): SectionCompleteness {
  return {
    identity: {
      isComplete: Boolean(form.businessName && form.legalName && form.taxId && form.entityType),
      filledFields: [form.businessName, form.legalName, form.taxId, form.entityType].filter(Boolean).length,
      totalFields: 4,
      percent: 0, // se calcula abajo
    },
    contact: {
      isComplete: Boolean(form.phone || form.website || form.instagram),
      filledFields: [form.phone, form.website, form.instagram].filter(Boolean).length,
      totalFields: 3,
      percent: 0,
    },
    location: {
      isComplete: Boolean(form.street && form.city && form.province && form.postalCode),
      filledFields: [form.street, form.city, form.province, form.postalCode].filter(Boolean).length,
      totalFields: 4,
      percent: 0,
    },
    story: {
      isComplete: Boolean(form.description && form.tagline && form.values.length > 0),
      filledFields: [form.description, form.tagline, form.values.length > 0 ? 'true' : ''].filter(Boolean).length,
      totalFields: 3,
      percent: 0,
    },
    categories: {
      isComplete: form.categories.length > 0,
      filledFields: form.categories.length,
      totalFields: 1,
      percent: 0,
    },
    visual: {
      isComplete: Boolean(form.logo && form.banner),
      filledFields: [form.logo, form.banner].filter(Boolean).length,
      totalFields: 2,
      percent: 0,
    },
  } as const;
}

function BusinessPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="h-32 sm:h-48 bg-surface rounded-t-xl" />
        <div className="bg-surface rounded-b-xl px-6 pb-6 pt-20">
          <div className="flex items-end gap-6 -mt-16 mb-4">
            <div className="w-28 h-28 rounded-xl bg-surface-alt" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-48 bg-surface-alt rounded" />
              <div className="h-4 w-72 bg-surface-alt rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Button skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-40 bg-surface rounded-xl animate-pulse" />
      </div>

      {/* Section skeletons */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center justify-between gap-3">
                <div className="h-6 w-40 bg-surface-alt rounded" />
                <div className="h-5 w-20 bg-surface-alt rounded" />
              </div>
            </div>
            <div className="px-6 py-6 space-y-4">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-4 w-24 bg-surface-alt rounded" />
                  <div className="h-10 bg-surface-alt rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Helper para mostrar badge de completitud
// ──────────────────────────────────────────────────────────────────────────

interface SectionStatusBadgeProps {
  isComplete: boolean;
  percent: number;
}

function SectionStatusBadge({ isComplete, percent }: SectionStatusBadgeProps) {
  if (isComplete) {
    return (
      <Badge variant="success" size="xs" className="w-fit self-start sm:self-auto gap-1">
        <CheckCircle className="w-3 h-3" />
        Completo
      </Badge>
    );
  }
  
  if (percent >= 50) {
    return (
      <Badge variant="warning" size="xs" className="w-fit self-start sm:self-auto">
        {percent}% completado
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" size="xs" className="w-fit self-start sm:self-auto">
      {percent}% completado
    </Badge>
  );
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
  const [newCategory, setNewCategory] = useState('');
  const [isUploadingVisual, setIsUploadingVisual] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const producerInitial = useMemo(() => {
    if (!form.businessName) return 'P';
    return form.businessName.charAt(0).toUpperCase();
  }, [form.businessName]);

  // ──────────────────────────────────────────────────────────────────────────
  // Cálculos de completitud por sección (se memorizan para evitar recálculos)
  // ──────────────────────────────────────────────────────────────────────────
  
  const sectionCompleteness = useMemo(() => {
    const completeness = calculateSectionCompleteness(form);
    
    // Calcular porcentaje para cada sección
    Object.keys(completeness).forEach((key) => {
      completeness[key as keyof SectionCompleteness].percent =
        completeness[key as keyof SectionCompleteness].totalFields > 0
          ? Math.round((completeness[key as keyof SectionCompleteness].filledFields / completeness[key as keyof SectionCompleteness].totalFields) * 100)
          : 0;
    });

    return completeness;
  }, [
    form.businessName, form.legalName, form.taxId, form.entityType,
    form.phone, form.website, form.instagram,
    form.street, form.city, form.province, form.postalCode,
    form.description, form.tagline, form.values.length,
    form.categories.length,
    form.logo, form.banner,
  ]);

  // Completitud general
  const overallCompleteness = useMemo(() => {
    const sections = Object.values(sectionCompleteness);
    const totalPercent = sections.length > 0
      ? Math.round(sections.reduce((sum, s) => sum + s.percent, 0) / sections.length)
      : 0;
    const completedSections = sections.filter(s => s.isComplete).length;
    return { totalPercent, completedSections, totalSections: sections.length };
  }, [sectionCompleteness]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await getProducerProfile();
        if (!response?.data) {
          throw new Error('No hay datos de perfil para el negocio.');
        }

        const mapped = mapProfileToForm(response.data);

        if (!mounted) return;
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

  useEffect(() => {
    if (!saveSuccess) return undefined;
    const t = setTimeout(() => setSaveSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (form.website.trim() && !/^https?:\/\//i.test(form.website.trim())) {
      nextErrors.website = 'Incluye URL valida (http:// o https://)';
    }
    if (form.description.trim() && form.description.trim().length < 50) {
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

  const handleToggleValue = (valueId: string) => {
    setForm((prev) => ({
      ...prev,
      values: prev.values.includes(valueId)
        ? prev.values.filter((item) => item !== valueId)
        : [...prev.values, valueId],
    }));
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVisual(true);
    setSaveError(null);
    try {
      const { key, url } = await uploadFile(file, 'visual/logo');
      setForm((prev) => ({ ...prev, logo: url ?? URL.createObjectURL(file), logoKey: key }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al subir el logo.');
    } finally {
      setIsUploadingVisual(false);
      e.target.value = '';
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVisual(true);
    setSaveError(null);
    try {
      const { key, url } = await uploadFile(file, 'visual/banner');
      setForm((prev) => ({ ...prev, banner: url ?? URL.createObjectURL(file), bannerKey: key }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al subir el banner.');
    } finally {
      setIsUploadingVisual(false);
      e.target.value = '';
    }
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

    const payload: UpdateProducerProfilePayload = {
      businessName: form.businessName.trim() || undefined,
      legalName: form.legalName.trim() || undefined,
      taxId: form.taxId.trim() || undefined,
      entityType: form.entityType || undefined,
      legalRepresentativeName: form.legalRepresentativeName.trim() || undefined,
      businessPhone: form.phone.trim() || undefined,
      street: form.street.trim() || undefined,
      streetNumber: form.streetNumber.trim() || undefined,
      streetComplement: form.streetComplement.trim() || undefined,
      city: form.city.trim() || undefined,
      province: form.province || undefined,
      postalCode: form.postalCode.trim() || undefined,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      teamSize: form.teamSize || undefined,
      tagline: form.tagline.trim() || undefined,
      description: form.description.trim() || undefined,
      productionPhilosophy: form.productionPhilosophy.trim() || undefined,
      values: form.values.length > 0 ? form.values : undefined,
      website: form.website.trim() || undefined,
      instagramHandle: form.instagram.trim() || undefined,
      categories: form.categories.length > 0 ? form.categories : undefined,
      ...(form.logoKey && { logoKey: form.logoKey }),
      ...(form.bannerKey && { bannerKey: form.bannerKey }),
    };

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const response = await updateProducerProfile(payload);
      const updated = response?.data ? mapProfileToForm(response.data) : form;

      setForm(updated);
      setInitialForm(updated);
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

      <PageHeader
        title="Mi negocio"
        description="Gestiona identidad legal, presencia comercial, historia de marca y ubicación productiva"
        badgeIcon={Store}
        badgeText="Negocio"
        showBackButton={true}
        onBack={() => router.back()}
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">
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
            <Alert className="mb-6 border-origen-pradera/30 bg-origen-pastel/40">
              <CheckCircle className="w-4 h-4 text-origen-pradera" />
              <AlertDescription className="text-origen-bosque">{saveSuccess}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <BusinessPageSkeleton />
          ) : (
            <>
              {!loadError &&
                !form.businessName &&
                !form.taxId &&
                !form.description &&
                form.categories.length === 0 && (
                  <Alert className="mb-6 border-origen-pradera/30 bg-origen-pastel/30">
                    <AlertDescription className="text-origen-bosque">
                      Aun no hay datos de negocio cargados. Empieza por completar nombre, historia y ubicacion.
                    </AlertDescription>
                  </Alert>
                )}

          <div className="mb-6">
            <Card className="overflow-hidden border border-border shadow-sm">
              <div className="h-44 sm:h-48 bg-gradient-to-r from-origen-pradera to-origen-hoja relative">
                {form.banner ? (
                  <img src={form.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-white/30" />
                  </div>
                )}
                {isEditing && (
                  <button
                    type="button"
                    disabled={isUploadingVisual}
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute bottom-3 right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-alt shadow-lg flex items-center justify-center text-origen-bosque hover:text-origen-pradera transition-colors disabled:opacity-50"
                    aria-label="Cambiar banner"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerFileChange}
                  aria-label="Subir banner"
                />
              </div>

              <CardContent className="relative px-4 sm:px-6 pb-5 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-10 sm:-mt-16 mb-3 sm:mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl bg-surface-alt shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
                      {form.logo ? (
                        <img src={form.logo} alt={form.businessName || 'Logo de negocio'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
                          <span className="text-2xl sm:text-3xl font-bold text-origen-pradera/50">{producerInitial}</span>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        aria-label="Cambiar logo"
                        disabled={isUploadingVisual}
                        onClick={() => logoInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-surface-alt border border-border shadow-md flex items-center justify-center text-origen-bosque hover:text-origen-pradera disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                    {isEditing && (
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="Cambiar logo"
                        onClick={() => logoInputRef.current?.click()}
                        onKeyDown={(e) => e.key === 'Enter' && logoInputRef.current?.click()}
                        className="absolute inset-0 hidden sm:flex bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity items-center justify-center cursor-pointer"
                      >
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleLogoFileChange}
                      aria-label="Subir logo"
                    />
                  </div>

                  <div className="flex-1 pb-1 sm:pb-2 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold leading-tight text-origen-bosque break-words">
                      {form.businessName || 'Perfil comercial'}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed break-words">
                      {form.tagline || 'Agrega un tagline para contar que hace unico tu negocio'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row sm:justify-end gap-3">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="md" disabled={isLoading} className="w-full sm:w-auto">
                <span className="flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar informacion del negocio
                </span>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button variant="outline" size="md" onClick={handleCancel} className="w-full sm:w-auto">
                  <span className="flex items-center justify-center gap-2">
                    <X className="w-4 h-4" />
                    Cancelar
                  </span>
                </Button>
                <Button size="md" onClick={handleSave} disabled={isSaving || isLoading} className="w-full sm:w-auto">
                  <span className="flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar cambios
                  </span>
                </Button>
              </div>
            )}
          </div>
            </>
          )}

          {!isLoading && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Progress indicator */}
              <Card className="border-origen-pradera/20 bg-gradient-to-r from-origen-pradera/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-origen-bosque">Completitud del perfil comercial</span>
                      <span className="text-lg font-bold text-origen-pradera">{overallCompleteness.totalPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-origen-pradera rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${overallCompleteness.totalPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-xs text-text-subtle">
                      {overallCompleteness.completedSections} de {overallCompleteness.totalSections} secciones completadas
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5 text-origen-pradera" />
                      Identidad del negocio
                    </CardTitle>
                    <SectionStatusBadge 
                      isComplete={sectionCompleteness.identity.isComplete}
                      percent={sectionCompleteness.identity.percent}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="businessName">Nombre comercial</Label>
                      <Input id="businessName" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalName">Razon social</Label>
                      <Input id="legalName" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">CIF / NIF</Label>
                      <Input id="taxId" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value.toUpperCase() })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityType">Tipo de entidad</Label>
                      <select id="entityType" value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })} disabled={!isEditing} className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm">
                        <option value="">Selecciona una opcion</option>
                        {ENTITY_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalRepresentativeName">Representante legal</Label>
                      <Input id="legalRepresentativeName" value={form.legalRepresentativeName} onChange={(e) => setForm({ ...form, legalRepresentativeName: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="foundedYear">Ano de fundacion</Label>
                      <Input id="foundedYear" value={form.foundedYear} onChange={(e) => setForm({ ...form, foundedYear: e.target.value.replace(/\D/g, '').slice(0, 4) })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamSize">Tamano del equipo</Label>
                      <select id="teamSize" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} disabled={!isEditing} className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm">
                        <option value="">Selecciona una opcion</option>
                        {TEAM_SIZE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Phone className="w-5 h-5 text-origen-pradera" />
                      Contacto y presencia web
                    </CardTitle>
                    <SectionStatusBadge 
                      isComplete={sectionCompleteness.contact.isComplete}
                      percent={sectionCompleteness.contact.percent}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Telefono</Label>
                      <Input id="businessPhone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Sitio web</Label>
                      <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} disabled={!isEditing} placeholder="https://..." />
                      {errors.website && <p className="text-xs text-feedback-danger">{errors.website}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input id="instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value.replace(/^@/, '') })} disabled={!isEditing} placeholder="@usuario" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="w-5 h-5 text-origen-pradera" />
                      Direccion productiva
                    </CardTitle>
                    <SectionStatusBadge 
                      isComplete={sectionCompleteness.location.isComplete}
                      percent={sectionCompleteness.location.percent}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Calle</Label>
                      <Input id="street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="streetNumber">Numero</Label>
                      <Input id="streetNumber" value={form.streetNumber} onChange={(e) => setForm({ ...form, streetNumber: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="streetComplement">Complemento</Label>
                      <Input id="streetComplement" value={form.streetComplement} onChange={(e) => setForm({ ...form, streetComplement: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Provincia</Label>
                      <select id="province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} disabled={!isEditing} className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm">
                        <option value="">Selecciona una provincia</option>
                        {PROVINCIAS_ESPANA.map((province) => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Codigo postal</Label>
                      <Input
                        id="postalCode"
                        value={form.postalCode}
                        onBlur={() => {
                          if (form.postalCode.length === 5 && !form.province) {
                            const suggested = getProvinciaFromCP(form.postalCode);
                            if (suggested) setForm((prev) => ({ ...prev, province: suggested }));
                          }
                        }}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-origen-pradera" />
                      Historia y valores
                    </CardTitle>
                    <SectionStatusBadge 
                      isComplete={sectionCompleteness.story.isComplete}
                      percent={sectionCompleteness.story.percent}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input id="tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">Descripcion</Label>
                    <Textarea id="businessDescription" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={!isEditing} rows={5} />
                    {errors.description && <p className="text-xs text-feedback-danger">{errors.description}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productionPhilosophy">Filosofia de produccion</Label>
                    <Textarea id="productionPhilosophy" value={form.productionPhilosophy} onChange={(e) => setForm({ ...form, productionPhilosophy: e.target.value })} disabled={!isEditing} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valores</Label>
                    <div className="flex flex-wrap gap-2">
                      {CORE_VALUES.map((value) => {
                        const selected = form.values.includes(value.id);
                        return (
                          <button
                            key={value.id}
                            type="button"
                            disabled={!isEditing}
                            onClick={() => handleToggleValue(value.id)}
                            className={selected ? 'rounded-full border border-origen-pradera bg-origen-pradera/10 px-3 py-1.5 text-sm text-origen-bosque' : 'rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-sm text-text-subtle'}
                          >
                            {value.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tags className="w-5 h-5 text-origen-pradera" />
                      Categorias
                    </CardTitle>
                    <SectionStatusBadge 
                      isComplete={sectionCompleteness.categories.isComplete}
                      percent={sectionCompleteness.categories.percent}
                    />
                  </div>
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
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {PRODUCER_CATEGORIES.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => !form.categories.includes(category.id) && setForm((prev) => ({ ...prev, categories: [...prev.categories, category.id] }))}
                            className="rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-sm text-origen-bosque"
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nueva categoria" />
                        <Button variant="outline" size="md" onClick={handleAddCategory}>
                          <span className="flex items-center gap-2 whitespace-nowrap flex-nowrap">
                            <Plus className="w-4 h-4" />
                            Anadir
                          </span>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Barra de guardado sticky – solo móvil */}
      {isEditing && (
        <div className="fixed left-0 right-0 bottom-[calc(88px+env(safe-area-inset-bottom))] lg:hidden z-30 px-4 sm:px-6">
          <div className="mx-auto max-w-[680px] rounded-2xl border border-border-subtle bg-surface-alt/95 backdrop-blur-md p-3 shadow-lg">
            <div className="flex gap-2">
              <Button variant="outline" size="md" className="flex-1" onClick={handleCancel}>
                <span className="flex items-center gap-2 whitespace-nowrap flex-nowrap">
                  <X className="w-4 h-4" />
                  Cancelar
                </span>
              </Button>
              <Button size="md" className="flex-1" onClick={handleSave} disabled={isSaving || isUploadingVisual}>
                <span className="flex items-center gap-2 whitespace-nowrap flex-nowrap">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar cambios
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
