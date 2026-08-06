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
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckboxWithLabel,
  Input,
  Label,
  PageLoader,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  appShellPaddingClass,
  appShellBottomOffsetClass,
  NAV_HEIGHT_MOBILE_DASHBOARD,
} from '@arcediano/ux-library';
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
import {
  getMyReadiness,
  type ProducerReadinessReport,
} from '@/lib/api/onboarding';

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
  whyOrigin: string;
  productionPhilosophy: string;
  values: string[];
  categories: string[];
  phone: string;
  website: string;
  introVideoUrl: string;
  instagram: string;
  street: string;
  streetNumber: string;
  streetComplement: string;
  city: string;
  province: string;
  postalCode: string;
  billingAddressSameAsProduction: boolean;
  billingStreet: string;
  billingStreetNumber: string;
  billingStreetComplement: string;
  billingCity: string;
  billingProvince: string;
  billingPostalCode: string;
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
  whyOrigin: '',
  productionPhilosophy: '',
  values: [],
  categories: [],
  phone: '',
  website: '',
  introVideoUrl: '',
  instagram: '',
  street: '',
  streetNumber: '',
  streetComplement: '',
  city: '',
  province: '',
  postalCode: '',
  billingAddressSameAsProduction: true,
  billingStreet: '',
  billingStreetNumber: '',
  billingStreetComplement: '',
  billingCity: '',
  billingProvince: '',
  billingPostalCode: '',
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

  // Si no hay billingAddress, usar la dirección productiva (default)
  const hasBillingAddress = data.fiscal?.billingAddress?.street !== null && data.fiscal?.billingAddress?.street !== undefined;

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
    whyOrigin: data.fiscal?.whyOrigin ?? '',
    productionPhilosophy: data.story?.productionPhilosophy ?? '',
    values: data.story?.values ?? [],
    categories: data.fiscal?.categories ?? [],
    phone: data.fiscal?.businessPhone ?? '',
    website: data.story?.website ?? '',
    introVideoUrl: data.story?.introVideoUrl ?? '',
    instagram: data.story?.instagramHandle ?? '',
    street: data.location?.street ?? '',
    streetNumber: data.location?.streetNumber ?? '',
    streetComplement: data.location?.streetComplement ?? '',
    city: data.location?.city ?? '',
    province: data.location?.province ?? '',
    postalCode: data.location?.postalCode ?? '',
    billingAddressSameAsProduction: !hasBillingAddress,
    billingStreet: data.fiscal?.billingAddress?.street ?? '',
    billingStreetNumber: data.fiscal?.billingAddress?.streetNumber ?? '',
    billingStreetComplement: data.fiscal?.billingAddress?.streetComplement ?? '',
    billingCity: data.fiscal?.billingAddress?.city ?? '',
    billingProvince: data.fiscal?.billingAddress?.province ?? '',
    billingPostalCode: data.fiscal?.billingAddress?.postalCode ?? '',
    logo: logoUrl,
    banner: bannerUrl,
    logoKey: data.visual?.logoKey ?? null,
    bannerKey: data.visual?.bannerKey ?? null,
  };
}

/**
 * Mapea códigos de blocker a texto legible para mostrar en UI
 */
function mapBlockerToText(blocker: string): string {
  const blockerMap: Record<string, string> = {
    'taxId_missing': 'CIF/NIF requerido',
    'businessName_missing': 'Nombre comercial requerido',
    'entityType_missing': 'Tipo de entidad requerido',
    'categories_empty': 'Al menos una categoría requerida',
    'location_incomplete': 'Dirección completa requerida (ciudad, provincia, código postal)',
    'storyName_short': 'Nombre comercial debe tener al menos 3 caracteres',
    'description_short': 'Descripción debe tener al menos 50 caracteres',
    'logo_missing': 'Logo requerido',
  };
  return blockerMap[blocker] || blocker;
}

/**
 * Determina si un campo específico es un bloqueador según el readiness report
 */
function isFieldBlocker(
  fieldKey: keyof ProducerReadinessReport['profileChecks'],
  readinessReport: ProducerReadinessReport | null,
): boolean {
  if (!readinessReport) return false;
  const check = readinessReport.profileChecks[fieldKey];
  return !check.passed && !!check.blocker;
}

/**
 * Componente indicador de campo obligatorio para publicar
 */
function RequiredFieldIndicator({ isRequired }: { isRequired: boolean }) {
  if (!isRequired) return null;
  return (
    <Badge variant="danger" size="xs" className="ml-1">
      Obligatorio
    </Badge>
  );
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
      filledFields: form.categories.length > 0 ? 1 : 0,
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
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [readinessReport, setReadinessReport] = useState<ProducerReadinessReport | null>(null);
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
        const [response, readiness] = await Promise.all([
          getProducerProfile(),
          getMyReadiness(),
        ]);

        if (!response?.data) {
          throw new Error('No hay datos de perfil para el negocio.');
        }

        const mapped = mapProfileToForm(response.data);

        if (!mounted) return;
        setForm(mapped);
        setInitialForm(mapped);
        setReadinessReport(readiness);
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
    if (form.tagline.trim() && form.tagline.trim().length < 3) {
      nextErrors.tagline = 'El tagline debe tener al menos 3 caracteres';
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


  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    setSaveError(null);
    try {
      const { key, url } = await uploadFile(file, 'visual/logo');
      setForm((prev) => ({ ...prev, logo: url ?? URL.createObjectURL(file), logoKey: key }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al subir el logo.');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setSaveError(null);
    try {
      const { key, url } = await uploadFile(file, 'visual/banner');
      setForm((prev) => ({ ...prev, banner: url ?? URL.createObjectURL(file), bannerKey: key }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al subir el banner.');
    } finally {
      setIsUploadingBanner(false);
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
    if (!validateForm()) {
      setSaveError('Hay campos con errores. Revisa los mensajes marcados en el formulario antes de guardar.');
      return;
    }

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
      billingAddressSameAsProduction: form.billingAddressSameAsProduction,
      ...(
        !form.billingAddressSameAsProduction && {
          billingAddress: {
            street: form.billingStreet.trim(),
            streetNumber: form.billingStreetNumber.trim(),
            streetComplement: form.billingStreetComplement.trim() || undefined,
            city: form.billingCity.trim(),
            province: form.billingProvince,
            postalCode: form.billingPostalCode.trim(),
          },
        }
      ),
      tagline: form.tagline.trim() || undefined,
      description: form.description.trim() || undefined,
      whyOrigin: form.whyOrigin.trim() || undefined,
      productionPhilosophy: form.productionPhilosophy.trim() || undefined,
      values: form.values.length > 0 ? form.values : undefined,
      website: form.website.trim() || undefined,
      introVideoUrl: form.introVideoUrl.trim() || undefined,
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

  if (isLoading) return <PageLoader message="Cargando datos de negocio..." />;

  return (
    <div className="w-full">
      <div className="fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <PageHeader
        title="Mi negocio"
        description="Gestiona identidad legal, presencia comercial, historia de marca y ubicación productiva"
        badgeIcon={Store}
        badgeText="Negocio"
        tooltip="Negocio"
        tooltipDetailed="Edita la identidad legal, comercial y de marca de tu negocio, visible en tu tienda y documentos."
        showBackButton={true}
        onBack={() => router.push('/dashboard/profile')}
      />

      <div className={`container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} sm:pb-8 ${isEditing ? 'lg:pb-28' : ''}`}>
        <ProfileSectionNav className="mt-3" />

        <div className="mt-6">
          {loadError && (
            <Alert variant="error" className="mb-6">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}

          {saveError && (
            <Alert variant="error" className="mb-6">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {saveSuccess && (
            <Alert variant="success" className="mb-6">
              <AlertDescription>{saveSuccess}</AlertDescription>
            </Alert>
          )}

          {readinessReport && !readinessReport.canSubmitProducts && (
            <Alert variant="warning" className="mb-6">
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Tu perfil no está listo para ser público.</p>
                  <p className="text-sm">Completa los siguientes campos obligatorios:</p>
                  <ul className="text-sm list-disc list-inside mt-2 space-y-0.5">
                    {readinessReport.blockers.map((blocker) => (
                      <li key={blocker}>{mapBlockerToText(blocker)}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <>
              {!loadError &&
                !form.businessName &&
                !form.taxId &&
                !form.description &&
                form.categories.length === 0 && (
                  <Alert variant="organic" className="mb-6">
                    <AlertDescription>
                      Aun no hay datos de negocio cargados. Empieza por completar nombre, historia y ubicacion.
                    </AlertDescription>
                  </Alert>
                )}

          <div className="mb-6">
            <Card variant="elevated" className="overflow-hidden">
              <div className="h-40 sm:h-48 bg-gradient-to-r from-origen-pradera to-origen-hoja relative">
                {form.banner ? (
                  <img src={form.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-white/30" />
                  </div>
                )}
                {isUploadingBanner && (
                  <div className="absolute inset-0 flex items-center justify-center bg-origen-oscuro/50 backdrop-blur-[1px]">
                    <Loader2 className="w-7 h-7 text-white animate-spin" aria-hidden="true" />
                    <span className="sr-only">Subiendo imagen…</span>
                  </div>
                )}
                {isEditing && (
                  <button
                    type="button"
                    disabled={isUploadingBanner}
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-surface-alt shadow-lg flex items-center justify-center text-origen-bosque hover:text-origen-pradera transition-colors disabled:opacity-50"
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

              {/* Patron "identidad separada del banner": el nombre y el tagline viven
                  siempre en el flujo normal de CardContent (fondo blanco, tipografia de
                  marca), nunca superpuestos a la imagen del banner. Solo el avatar (con
                  su propio margen negativo, desacoplado del bloque de texto) se solapa
                  visualmente con el banner. Esto elimina por construccion el riesgo de
                  contraste que arrastraban los dos intentos anteriores (scrim posicionado
                  a ciegas en v5.18/v5.21, luego chip flotante en v5.21) — ver manual de
                  diseño para el detalle de por que se descartan ambos. */}
              <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                  <div className="relative flex flex-col items-start shrink-0 -mt-10 sm:-mt-14">
                    <Avatar
                      src={form.logo ?? undefined}
                      alt={form.businessName || 'Logo de negocio'}
                      shape="rounded"
                      size="2xl"
                      className="w-20 h-20 sm:w-28 sm:h-28 border-4 border-white shadow-xl bg-white"
                      fallback={<span className="text-2xl sm:text-3xl font-bold text-origen-pradera/50">{producerInitial}</span>}
                    />
                    {isUploadingLogo && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-origen-oscuro/50 backdrop-blur-[1px]">
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" aria-hidden="true" />
                        <span className="sr-only">Subiendo imagen…</span>
                      </div>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        aria-label="Cambiar logo"
                        disabled={isUploadingLogo}
                        onClick={() => logoInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 h-11 w-11 rounded-full bg-surface-alt border border-border shadow-md flex items-center justify-center text-origen-bosque hover:text-origen-pradera disabled:opacity-50"
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
                        className="absolute inset-0 hidden sm:flex bg-origen-oscuro/50 rounded-xl opacity-0 hover:opacity-100 transition-opacity items-center justify-center cursor-pointer"
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
                    {isFieldBlocker('logo', readinessReport) && (
                      <Badge variant="danger" size="xs" className="mt-2">
                        Obligatorio
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 max-w-full pt-2 sm:pt-3 text-left">
                    <CardTitle size="lg" className="break-words">
                      {form.businessName || 'Perfil comercial'}
                    </CardTitle>
                    <CardDescription size="sm" className="mt-1 break-words">
                      {form.tagline || 'Agrega un tagline para contar que hace unico tu negocio'}
                    </CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {!isEditing && (
            <div className="mb-8 flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button onClick={() => setIsEditing(true)} size="md" disabled={isLoading} className="w-full sm:w-auto">
                <span className="flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar informacion del negocio
                </span>
              </Button>
            </div>
          )}
          </>

          {(
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
                      <Label htmlFor="businessName" className="flex items-center">
                        Nombre comercial
                        <RequiredFieldIndicator isRequired={isFieldBlocker('businessName', readinessReport)} />
                      </Label>
                      <Input id="businessName" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalName">Razon social</Label>
                      <Input id="legalName" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId" className="flex items-center">
                        CIF / NIF
                        <RequiredFieldIndicator isRequired={isFieldBlocker('taxId', readinessReport)} />
                      </Label>
                      <Input id="taxId" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value.toUpperCase() })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityType" className="flex items-center">
                        Tipo de entidad
                        <RequiredFieldIndicator isRequired={isFieldBlocker('entityType', readinessReport)} />
                      </Label>
                      <Select value={form.entityType} onValueChange={(v) => setForm({ ...form, entityType: v })} disabled={!isEditing}>
                        <SelectTrigger id="entityType" className="w-full">
                          <SelectValue placeholder="Selecciona una opcion" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTITY_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select value={form.teamSize} onValueChange={(v) => setForm({ ...form, teamSize: v })} disabled={!isEditing}>
                        <SelectTrigger id="teamSize" className="w-full">
                          <SelectValue placeholder="Selecciona una opcion" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEAM_SIZE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Label htmlFor="city" className="flex items-center">
                        Ciudad
                        <RequiredFieldIndicator isRequired={isFieldBlocker('location', readinessReport)} />
                      </Label>
                      <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province" className="flex items-center">
                        Provincia
                        <RequiredFieldIndicator isRequired={isFieldBlocker('location', readinessReport)} />
                      </Label>
                      <Select value={form.province} onValueChange={(v) => setForm({ ...form, province: v })} disabled={!isEditing}>
                        <SelectTrigger id="province" className="w-full">
                          <SelectValue placeholder="Selecciona una provincia" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVINCIAS_ESPANA.map((province) => (
                            <SelectItem key={province} value={province}>{province}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="flex items-center">
                        Codigo postal
                        <RequiredFieldIndicator isRequired={isFieldBlocker('location', readinessReport)} />
                      </Label>
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
                      <MapPin className="w-5 h-5 text-origen-pradera" />
                      Direccion de facturacion
                    </CardTitle>
                    <Badge variant="outline" size="xs" className="w-fit self-start sm:self-auto">
                      Opcional
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <CheckboxWithLabel
                      id="billingAddressSameAsProduction"
                      label="Usar la misma direccion que la productiva"
                      checked={form.billingAddressSameAsProduction}
                      onCheckedChange={(checked) => setForm({ ...form, billingAddressSameAsProduction: checked === true })}
                      disabled={!isEditing}
                    />

                    {!form.billingAddressSameAsProduction && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="billingStreet">Calle</Label>
                          <Input id="billingStreet" value={form.billingStreet} onChange={(e) => setForm({ ...form, billingStreet: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingStreetNumber">Numero</Label>
                          <Input id="billingStreetNumber" value={form.billingStreetNumber} onChange={(e) => setForm({ ...form, billingStreetNumber: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="billingStreetComplement">Complemento</Label>
                          <Input id="billingStreetComplement" value={form.billingStreetComplement} onChange={(e) => setForm({ ...form, billingStreetComplement: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingCity">Ciudad</Label>
                          <Input id="billingCity" value={form.billingCity} onChange={(e) => setForm({ ...form, billingCity: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingProvince">Provincia</Label>
                          <Select value={form.billingProvince} onValueChange={(v) => setForm({ ...form, billingProvince: v })} disabled={!isEditing}>
                            <SelectTrigger id="billingProvince" className="w-full">
                              <SelectValue placeholder="Selecciona una provincia" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROVINCIAS_ESPANA.map((province) => (
                                <SelectItem key={province} value={province}>{province}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingPostalCode">Codigo postal</Label>
                          <Input id="billingPostalCode" value={form.billingPostalCode} onChange={(e) => setForm({ ...form, billingPostalCode: e.target.value.replace(/\D/g, '').slice(0, 5) })} disabled={!isEditing} />
                        </div>
                      </div>
                    )}
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
                    <Label htmlFor="tagline" className="flex items-center">
                      Tagline
                      <RequiredFieldIndicator isRequired={isFieldBlocker('storyName', readinessReport)} />
                    </Label>
                    <Input id="tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} disabled={!isEditing} />
                    {errors.tagline && <p className="text-xs text-feedback-danger">{errors.tagline}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessDescription" className="flex items-center">
                      Descripcion
                      <RequiredFieldIndicator isRequired={isFieldBlocker('description', readinessReport)} />
                    </Label>
                    <Textarea id="businessDescription" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={!isEditing} rows={5} />
                    {errors.description && <p className="text-xs text-feedback-danger">{errors.description}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whyOrigin">Por que Origen?</Label>
                    <Textarea id="whyOrigin" value={form.whyOrigin} onChange={(e) => setForm({ ...form, whyOrigin: e.target.value })} disabled={!isEditing} rows={3} placeholder="Cuéntanos tu motivación para unirte a Origen" />
                    {errors.whyOrigin && <p className="text-xs text-feedback-danger">{errors.whyOrigin}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="introVideoUrl">Video de presentacion</Label>
                    <Input id="introVideoUrl" value={form.introVideoUrl} onChange={(e) => setForm({ ...form, introVideoUrl: e.target.value })} disabled={!isEditing} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productionPhilosophy">Filosofia de produccion</Label>
                    <Textarea id="productionPhilosophy" value={form.productionPhilosophy} onChange={(e) => setForm({ ...form, productionPhilosophy: e.target.value })} disabled={!isEditing} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valores</Label>
                    <ToggleGroup
                      type="multiple"
                      variant="pill"
                      size="sm"
                      value={form.values}
                      onValueChange={(next) => setForm((prev) => ({ ...prev, values: Array.isArray(next) ? next : [next] }))}
                      className="gap-2"
                    >
                      {CORE_VALUES.map((value) => (
                        <ToggleGroupItem key={value.id} value={value.id} disabled={!isEditing}>
                          {value.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tags className="w-5 h-5 text-origen-pradera" />
                      Categorias
                      <RequiredFieldIndicator isRequired={isFieldBlocker('categories', readinessReport)} />
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
                          <button className="ml-2 hover:text-feedback-danger" onClick={() => handleRemoveCategory(cat)}>
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>

                  {isEditing && (
                    <>
                      <ToggleGroup
                        type="multiple"
                        variant="pill"
                        size="sm"
                        value={form.categories.filter((cat) => PRODUCER_CATEGORIES.some((c) => c.id === cat))}
                        onValueChange={(next) => {
                          const selected = Array.isArray(next) ? next : [next];
                          const customCategories = form.categories.filter(
                            (cat) => !PRODUCER_CATEGORIES.some((c) => c.id === cat)
                          );
                          setForm((prev) => ({ ...prev, categories: [...customCategories, ...selected] }));
                        }}
                        className="gap-2 mb-3"
                      >
                        {PRODUCER_CATEGORIES.map((category) => (
                          <ToggleGroupItem key={category.id} value={category.id}>
                            {category.name}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                      <div className="flex gap-2">
                        <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nueva categoria" />
                        <Button variant="secondary" size="md" onClick={handleAddCategory}>
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

      {/* Barra de guardado sticky – todos los breakpoints, para no obligar a volver
          arriba al editar secciones bajas de la pantalla (Categorías, Historia, etc.) */}
      {isEditing && (
        <div className={`fixed left-0 right-0 ${appShellBottomOffsetClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} lg:bottom-6 z-30 px-4 sm:px-6`}>
          <div className="mx-auto max-w-[680px] rounded-2xl border border-border-subtle bg-surface-alt/95 backdrop-blur-md p-3 shadow-lg">
            <div className="flex gap-2">
              <Button variant="ghost" size="md" className="flex-1" onClick={handleCancel}>
                <span className="flex items-center gap-2 whitespace-nowrap flex-nowrap">
                  <X className="w-4 h-4" />
                  Cancelar
                </span>
              </Button>
              <Button size="md" className="flex-1" onClick={handleSave} disabled={isSaving || isUploadingBanner || isUploadingLogo}>
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
