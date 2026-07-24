/**
 * @page Logística y Envíos
 * @version 2.0.0 — sustituye el mock estático por datos reales de
 * GET /producers/onboarding/data y guarda con POST /producers/onboarding/step/4
 * (saveStep4), reutilizado del wizard de onboarding.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardIconHeader,
  CardTitle,
  Input,
  InputAffixField,
  Label,
  PageError,
  PageLoader,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  type BadgeVariant,
} from '@arcediano/ux-library';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import { loadOnboardingData, saveStep4 } from '@/lib/api/onboarding';
import type {
  DeliveryOption as OnboardingDeliveryOption,
  ShippingZone as OnboardingShippingZone,
  EnhancedCapacityData,
} from '@/components/features/onboarding/components/steps/step-capacity';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Euro,
  Info,
  Leaf,
  Loader2,
  Lock,
  MapPin,
  Package,
  Pencil,
  Plus,
  Recycle,
  Route,
  Save,
  Store,
  Truck,
  X,
  Zap,
} from 'lucide-react';

// ─── Tipos locales ──────────────────────────────────────────────────────────

type LogisticsLevel = 'centralized' | 'transport' | 'own';
type ZoneType = 'PROVINCE' | 'POSTAL' | 'CUSTOM';

interface DeliveryOptionRow {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

interface ShippingZoneRow {
  id: string;
  type: ZoneType;
  value: string;
  label: string;
  isExcluded: boolean;
}

// ─── Copy de los 3 modos de cobertura Origen (Etapa 3 del plan de diseño) ──
// Reutiliza literal el copy ya validado en step-capacity.tsx, no se redacta de nuevo.

const LEVEL_CONFIG: Record<
  LogisticsLevel,
  { label: string; badgeVariant: BadgeVariant; icon: typeof Route; description: string }
> = {
  centralized: {
    label: 'Logística centralizada · Nivel 1',
    badgeVariant: 'success',
    icon: Route,
    description:
      'Origen recoge los pedidos en tu dirección de producción y gestiona la entrega al comprador. No necesitas configurar transportistas.',
  },
  transport: {
    label: 'Transporte concertado · Nivel 2',
    badgeVariant: 'info',
    icon: Truck,
    description:
      'Tu zona no tiene logística centralizada, pero puedes usar nuestro transportista concertado. Tú preparas el pedido, nosotros lo enviamos.',
  },
  own: {
    label: 'Gestión propia · Nivel 3',
    badgeVariant: 'neutral',
    icon: Package,
    description:
      'Tu zona no tiene cobertura de logística o transporte de Origen. Configura tus propias opciones de envío a continuación.',
  },
};

function pickDeliveryIcon(option: { price: number; estimatedDays: string }) {
  if (option.price === 0) return Store;
  if (/^1$|24/.test(option.estimatedDays)) return Zap;
  return Truck;
}

let localIdCounter = 0;
function nextLocalId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-${Date.now()}-${localIdCounter}`;
}

export default function EnviosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Cobertura Origen — solo lectura, calculada por el backend
  const [isInOriginRoute, setIsInOriginRoute] = useState(false);
  const [logisticsLevel, setLogisticsLevel] = useState<LogisticsLevel>('own');
  const [profilePubliclyReady, setProfilePubliclyReady] = useState(false);

  // Configuración editable del productor
  const [useCentralizedTransport, setUseCentralizedTransport] = useState(true);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [sustainablePackaging, setSustainablePackaging] = useState(false);
  const [packagingDescription, setPackagingDescription] = useState('');
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptionRow[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZoneRow[]>([]);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  // Alta de nueva zona
  const [zoneType, setZoneType] = useState<'PROVINCE' | 'POSTAL'>('PROVINCE');
  const [zoneValue, setZoneValue] = useState('');
  const [zoneError, setZoneError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await loadOnboardingData();
      const logistics = response?.data?.logistics ?? null;

      setProfilePubliclyReady(Boolean(response?.data?.profilePubliclyReady));
      setIsInOriginRoute(Boolean(logistics?.isInOriginRoute));
      setLogisticsLevel((logistics?.logisticsLevel as LogisticsLevel) ?? 'own');
      setUseCentralizedTransport(logistics?.useCentralizedTransport ?? true);
      setMinOrderAmount(Number(logistics?.minOrderAmount ?? 0));
      setSustainablePackaging(Boolean(logistics?.sustainablePackaging));
      setPackagingDescription(logistics?.packagingDescription ?? '');
      setDeliveryOptions(
        (logistics?.deliveryOptions ?? []).map((opt) => ({
          id: nextLocalId('option'),
          name: opt.name,
          description: opt.description ?? '',
          price: Number(opt.price),
          estimatedDays: String(opt.estimatedDays),
        })),
      );
      setShippingZones(
        (logistics?.shippingZones ?? []).map((zone) => ({
          id: nextLocalId('zone'),
          type: zone.type,
          value: zone.value,
          label: zone.label,
          isExcluded: Boolean(zone.isExcluded),
        })),
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar tu configuración de logística.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!saveSuccess) return undefined;
    const t = setTimeout(() => setSaveSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  const hasDeliveryOptions = deliveryOptions.length > 0;

  // ─── Métodos de envío ───────────────────────────────────────────────────

  const handleAddDeliveryOption = () => {
    const newOption: DeliveryOptionRow = {
      id: nextLocalId('option'),
      name: 'Nuevo método de envío',
      description: 'Describe cómo entregas tus productos',
      price: 5.9,
      estimatedDays: '2-3',
    };
    setDeliveryOptions((prev) => [...prev, newOption]);
    setEditingOptionId(newOption.id);
  };

  const handleDeliveryOptionChange = (id: string, field: keyof DeliveryOptionRow, value: string | number) => {
    setDeliveryOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt)));
  };

  const handleRemoveDeliveryOption = (id: string) => {
    setDeliveryOptions((prev) => prev.filter((opt) => opt.id !== id));
    if (editingOptionId === id) setEditingOptionId(null);
  };

  // ─── Zonas de envío propias ─────────────────────────────────────────────

  const handleAddZone = () => {
    const trimmed = zoneValue.trim();
    if (!trimmed) return;

    if (zoneType === 'POSTAL' && !/^\d{5}$/.test(trimmed)) {
      setZoneError('Introduce un código postal válido de 5 dígitos (ej: 28001).');
      return;
    }
    if (zoneType === 'PROVINCE' && shippingZones.some((z) => z.type === 'PROVINCE' && z.value === trimmed)) {
      setZoneError('Esa provincia ya está en tu lista de zonas.');
      return;
    }

    setZoneError(null);
    setShippingZones((prev) => [
      ...prev,
      { id: nextLocalId('zone'), type: zoneType, value: trimmed, label: trimmed, isExcluded: false },
    ]);
    setZoneValue('');
  };

  const handleRemoveZone = (id: string) => {
    setShippingZones((prev) => prev.filter((z) => z.id !== id));
  };

  // ─── Guardado ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const toOnboardingDeliveryOption = (opt: DeliveryOptionRow): OnboardingDeliveryOption => ({
      id: opt.id,
      name: opt.name,
      description: opt.description,
      price: opt.price,
      estimatedDays: opt.estimatedDays,
      icon: pickDeliveryIcon(opt),
    });

    const toOnboardingZone = (zone: ShippingZoneRow): OnboardingShippingZone => ({
      id: zone.id,
      type: zone.type.toLowerCase() as 'province' | 'postal' | 'custom',
      value: zone.value,
      label: zone.label,
    });

    const payload: EnhancedCapacityData = {
      isInOriginRoute,
      logisticsLevel,
      useCentralizedTransport: logisticsLevel === 'transport' ? useCentralizedTransport : undefined,
      deliveryOptions: deliveryOptions.map(toOnboardingDeliveryOption),
      includedZones: shippingZones.filter((z) => !z.isExcluded).map(toOnboardingZone),
      excludedZones: shippingZones.filter((z) => z.isExcluded).map(toOnboardingZone),
      minOrderAmount,
      sustainablePackaging,
      packagingDescription: sustainablePackaging ? packagingDescription : undefined,
    };

    try {
      await saveStep4(payload);
      setSaveSuccess('Configuración de logística guardada correctamente.');
      setEditingOptionId(null);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'No se pudo guardar tu configuración de logística.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageLoader message="Cargando tu configuración de logística..." />;

  if (loadError) {
    return <PageError message={loadError} onRetry={loadData} />;
  }

  const level = LEVEL_CONFIG[logisticsLevel];
  const LevelIcon = level.icon;

  return (
    <div className="w-full">
      <PageHeader
        title="Logística"
        description="Organiza métodos de entrega, zonas activas y la experiencia de envío para tus clientes"
        badgeIcon={Truck}
        badgeText="Logística"
        tooltip="Logística"
        tooltipDetailed="Configura cómo entregas tus productos y qué zonas mantienes activas para la venta."
        actions={
          <div className="hidden lg:block">
            <Button onClick={handleSave} disabled={isSaving}>
              <span className="inline-flex items-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
              </span>
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8 space-y-6">
        <div className="rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
              <Truck className="h-5 w-5 text-origen-pradera" />
            </div>
            <div>
              <p className="text-sm font-semibold text-origen-bosque leading-tight">Entrega sin fricción</p>
              <p className="mt-1 text-xs text-text-subtle sm:text-sm">Agrupa aquí todo lo relacionado con métodos de envío, recogida y cobertura geográfica.</p>
            </div>
          </div>
        </div>

        {saveError && (
          <Alert className="border-feedback-danger/30 bg-feedback-danger/10">
            <AlertCircle className="w-4 h-4 text-feedback-danger" />
            <AlertDescription className="text-origen-oscuro">
              {saveError}
              {saveError.toLowerCase().includes('publicad') && (
                <span className="block mt-1 text-xs text-feedback-danger/90">
                  Añade al menos un método de envío activo en la sección &quot;Métodos de envío&quot; antes de guardar.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className="border-origen-pradera/30 bg-origen-pastel/40">
            <CheckCircle2 className="w-4 h-4 text-origen-pradera" />
            <AlertDescription className="text-origen-bosque">{saveSuccess}</AlertDescription>
          </Alert>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            COBERTURA ORIGEN — solo lectura, calculada por el backend por CP
        ══════════════════════════════════════════════════════════════════ */}
        <Card variant="default" padding="md" className="border-dashed border-border-strong bg-surface">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt border border-border-subtle flex-shrink-0">
              <Lock className="h-4 w-4 text-text-subtle" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-origen-bosque">Cobertura Origen</h2>
                <Badge variant={level.badgeVariant} size="sm" icon={<LevelIcon className="w-3 h-3" />}>
                  {level.label}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{level.description}</p>
              <p className="mt-3 text-xs text-text-subtle flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-origen-pradera" />
                <span>
                  Este valor se calcula automáticamente a partir de tu código postal de producción. Si necesitas
                  revisarlo,{' '}
                  <Link href="/dashboard/profile/business" className="text-origen-pradera underline underline-offset-2 hover:text-origen-bosque">
                    actualiza tu dirección en Mi negocio
                  </Link>
                  .
                </span>
              </p>
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            TRANSPORTE CENTRALIZADO — solo si logisticsLevel === 'transport'
        ══════════════════════════════════════════════════════════════════ */}
        {logisticsLevel === 'transport' && (
          <Card variant="section" padding="md">
            <CardIconHeader
              icon={<Truck className="h-5 w-5" />}
              title="Transporte centralizado de Origen"
              description="Elige si quieres que gestionemos el transporte por ti"
            />
            <CardContent>
              <button
                type="button"
                onClick={() => setUseCentralizedTransport(!useCentralizedTransport)}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border-subtle hover:border-origen-pradera/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera/45"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-origen-bosque">Usar el transportista concertado de Origen</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tú preparas el pedido, nosotros lo enviamos. Si lo desactivas, gestionarás tu propio envío con los
                    métodos que configures abajo.
                  </p>
                </div>
                <Switch
                  checked={useCentralizedTransport}
                  onCheckedChange={setUseCentralizedTransport}
                  className="flex-shrink-0 ml-4"
                />
              </button>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PEDIDO MÍNIMO
        ══════════════════════════════════════════════════════════════════ */}
        <Card variant="section" padding="md">
          <CardIconHeader icon={<Euro className="h-5 w-5" />} title="Pedido mínimo" description="Importe mínimo por pedido" />
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <InputAffixField
                  type="number"
                  value={minOrderAmount || ''}
                  onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={5}
                  inputSize="md"
                  affixLeft="€"
                />
              </div>
              <span className="text-sm text-muted-foreground">euros</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Recomendado: 20-30 € para venta al público general</p>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            MÉTODOS DE ENVÍO — lista editable
        ══════════════════════════════════════════════════════════════════ */}
        <Card variant="section" padding="md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CardIconHeader
              icon={<Truck className="h-5 w-5" />}
              title="Métodos de envío"
              description="Precios y tiempos que ofreces a tus clientes"
              className="mb-0 flex-1"
            />
            <Button variant="secondary" size="sm" onClick={handleAddDeliveryOption} className="w-full justify-center sm:w-auto">
              <span className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Añadir método</span>
              </span>
            </Button>
          </div>

          <CardContent className="space-y-4">
            {deliveryOptions.map((option) => {
              const Icon = pickDeliveryIcon(option);
              const isEditing = editingOptionId === option.id;

              return (
                <div key={option.id} className="rounded-xl border-2 border-border-subtle bg-surface-alt p-4 transition-all hover:border-origen-pradera/50">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="w-9 h-9 rounded-lg bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-origen-pradera" />
                    </div>

                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={option.name}
                            onChange={(e) => handleDeliveryOptionChange(option.id, 'name', e.target.value)}
                            inputSize="md"
                            className="text-base font-medium"
                            aria-label="Nombre del método de envío"
                          />
                          <Input
                            value={option.description}
                            onChange={(e) => handleDeliveryOptionChange(option.id, 'description', e.target.value)}
                            inputSize="md"
                            className="text-sm"
                            aria-label="Descripción del método de envío"
                          />
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Input
                              label="Precio (€)"
                              type="number"
                              value={option.price > 0 ? option.price : ''}
                              onChange={(e) => handleDeliveryOptionChange(option.id, 'price', parseFloat(e.target.value) || 0)}
                              min={0}
                              step={0.5}
                              inputSize="md"
                            />
                            <Input
                              label="Tiempo estimado"
                              value={option.estimatedDays}
                              onChange={(e) => handleDeliveryOptionChange(option.id, 'estimatedDays', e.target.value)}
                              placeholder="2-3 días"
                              inputSize="md"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-base font-semibold text-origen-bosque sm:text-lg">{option.name}</h3>
                            <span className="text-lg font-bold text-origen-pradera sm:text-xl">{option.price.toFixed(2)}€</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Entrega: {option.estimatedDays} días</p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingOptionId(isEditing ? null : option.id)}
                        aria-label={isEditing ? 'Confirmar cambios' : 'Editar método de envío'}
                        className={
                          isEditing
                            ? 'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-origen-pradera text-white hover:bg-origen-bosque transition-colors'
                            : 'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-text-subtle hover:text-origen-bosque hover:bg-surface transition-colors'
                        }
                      >
                        {isEditing ? <Check className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliveryOption(option.id)}
                        aria-label="Eliminar método de envío"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-text-subtle hover:text-feedback-danger hover:bg-feedback-danger/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!hasDeliveryOptions && (
              <div className="p-5 bg-origen-crema/30 rounded-xl border-2 border-dashed border-border-subtle text-center">
                <Truck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-origen-bosque mb-1">Sin métodos de envío configurados</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Define cómo vas a entregar tus pedidos: precio, tiempo estimado y descripción.
                </p>
                <Button variant="secondary" size="sm" onClick={handleAddDeliveryOption}>
                  <span className="inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Añadir método</span>
                  </span>
                </Button>
                {profilePubliclyReady && (
                  <p className="text-xs text-feedback-danger mt-3 flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Tu tienda está publicada — necesitas al menos un método activo para poder guardar
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            ZONAS DE ENVÍO PROPIAS — lista editable
        ══════════════════════════════════════════════════════════════════ */}
        <Card variant="section" padding="md">
          <CardIconHeader
            icon={<MapPin className="h-5 w-5" />}
            title="Zonas de envío propias"
            description="Provincias y códigos postales donde entregas directamente"
          />
          <CardContent className="space-y-4">
            <ToggleGroup
              type="single"
              variant="segmented"
              value={zoneType}
              onValueChange={(v) => {
                if (v) setZoneType(v as 'PROVINCE' | 'POSTAL');
                setZoneError(null);
              }}
            >
              <ToggleGroupItem value="PROVINCE">Provincia</ToggleGroupItem>
              <ToggleGroupItem value="POSTAL">Código postal</ToggleGroupItem>
            </ToggleGroup>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                {zoneType === 'PROVINCE' ? (
                  <Select value={zoneValue} onValueChange={(v) => { setZoneValue(v); setZoneError(null); }}>
                    <SelectTrigger className="w-full" aria-label="Selecciona una provincia">
                      <SelectValue placeholder="Selecciona una provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCIAS_ESPANA.map((province) => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={zoneValue}
                    onChange={(e) => { setZoneValue(e.target.value.replace(/\D/g, '').slice(0, 5)); setZoneError(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddZone(); } }}
                    placeholder="Ej: 28001"
                    aria-label="Código postal"
                  />
                )}
              </div>
              <Button
                type="button"
                onClick={handleAddZone}
                disabled={!zoneValue.trim()}
                variant="primary"
                className="w-full sm:w-auto sm:flex-shrink-0 whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  Añadir zona
                </span>
              </Button>
            </div>

            {zoneError && (
              <p className="text-xs text-feedback-danger flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {zoneError}
              </p>
            )}

            {shippingZones.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {shippingZones.map((zone) => (
                  <Badge key={zone.id} variant="leaf" size="sm" className="gap-2">
                    {zone.label}
                    <button
                      type="button"
                      onClick={() => handleRemoveZone(zone.id)}
                      aria-label={`Quitar ${zone.label}`}
                      className="hover:text-feedback-danger"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-origen-crema/30 rounded-xl border-2 border-dashed border-border-subtle text-center">
                <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-sm text-muted-foreground">Aún no has añadido zonas de envío propias</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            EMPAQUETADO SOSTENIBLE
        ══════════════════════════════════════════════════════════════════ */}
        <Card variant="section" padding="md">
          <CardIconHeader
            icon={<Recycle className="h-5 w-5" />}
            title="Packaging sostenible"
            description="El 73% de los consumidores prefiere marcas con embalaje ecológico"
          />
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={() => setSustainablePackaging(!sustainablePackaging)}
              className={
                sustainablePackaging
                  ? 'w-full flex items-center justify-between p-4 rounded-xl border-2 border-origen-pradera bg-origen-pradera/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera/45'
                  : 'w-full flex items-center justify-between p-4 rounded-xl border-2 border-border-subtle hover:border-origen-pradera bg-surface-alt transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera/45'
              }
            >
              <div className="flex items-center gap-3">
                <div className={sustainablePackaging ? 'w-10 h-10 rounded-lg flex items-center justify-center bg-origen-pradera text-white' : 'w-10 h-10 rounded-lg flex items-center justify-center bg-origen-crema text-origen-bosque'}>
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-origen-bosque">Uso packaging sostenible</p>
                  <p className="text-xs text-muted-foreground">Materiales reciclados, compostables o reutilizables</p>
                </div>
              </div>
              {sustainablePackaging && <CheckCircle2 className="w-6 h-6 text-origen-pradera flex-shrink-0" />}
            </button>

            {sustainablePackaging && (
              <div className="pl-4">
                <Label htmlFor="packagingDescription">Describe tu packaging</Label>
                <Input
                  id="packagingDescription"
                  value={packagingDescription}
                  onChange={(e) => setPackagingDescription(e.target.value)}
                  placeholder="Cajas de cartón 100% reciclado, papel kraft, etiquetas compostables..."
                  className="mt-1.5"
                />
                {!packagingDescription.trim() ? (
                  <p className="text-xs text-feedback-danger mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Obligatorio para continuar
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Esta información aparecerá destacada en tu perfil
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:hidden">
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            <span className="inline-flex items-center gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
