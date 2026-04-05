// 📁 /src/components/onboarding/steps/EnhancedStep4Capacity.tsx
/**
 * @file EnhancedStep4Capacity.tsx
 * @description Paso 4: Logística - Rutas, áreas de entrega y precios
 * @version 6.0.0 - REDISEÑO COMPLETO: Lógica de rutas, zonas por CP
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Input, Button } from '@arcediano/ux-library';

import {
  Truck,
  MapPin,
  Euro,
  CheckCircle2,
  AlertCircle,
  Lock,
  Clock,
  Store,
  Zap,
  Leaf,
  Info,
  Package,
  Compass,
  Route,
  Plus,
  X,
  Recycle,
  TrendingUp,
  Users
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface ShippingZone {
  id: string;
  type: 'province' | 'postal' | 'custom';
  value: string; // Provincia, código postal o descripción
  label: string;
}

export interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Nivel logístico detectado por CP */
export type LogisticsLevel = 'centralized' | 'transport' | 'own';

export interface EnhancedCapacityData {
  // ¿Está en ruta de Origen?
  isInOriginRoute: boolean;

  /** Nivel logístico detectado: centralizado / transporte concertado / propio */
  logisticsLevel?: LogisticsLevel;

  /** Solo nivel 'transport': ¿usa el transporte concertado de Origen? */
  useCentralizedTransport?: boolean;

  // Opciones de envío (personalizadas si no está en ruta)
  deliveryOptions: DeliveryOption[];

  // Zonas de entrega (donde SÍ entrega)
  includedZones: ShippingZone[];

  // Zonas de exclusión (donde NO entrega - opcional)
  excludedZones?: ShippingZone[];

  // Pedido mínimo
  minOrderAmount: number;

  // Packaging sostenible
  sustainablePackaging?: boolean;
  packagingDescription?: string;
}

export interface EnhancedStep4CapacityProps {
  data: EnhancedCapacityData;
  onChange: (data: EnhancedCapacityData) => void;
  // Datos del productor del paso 1
  producerLocation?: {
    province: string;
    city: string;
    postalCode: string;
  };
}

// ============================================================================
// CONSTANTES
// ============================================================================

// Rutas predefinidas de Origen (simulado)
const ORIGEN_ROUTES = [
  { id: 'route-north', name: 'Ruta Norte', provinces: ['cantabria', 'asturias', 'galicia'] },
  { id: 'route-east', name: 'Ruta Este', provinces: ['barcelona', 'girona', 'tarragona', 'lleida'] },
  { id: 'route-south', name: 'Ruta Sur', provinces: ['sevilla', 'cadiz', 'cordoba', 'granada', 'malaga'] },
  { id: 'route-center', name: 'Ruta Centro', provinces: ['madrid', 'toledo', 'guadalajara', 'cuenca'] }
];

// Opciones de envío predeterminadas para productores fuera de ruta
const DEFAULT_DELIVERY_OPTIONS: DeliveryOption[] = [
  { 
    id: 'standard', 
    name: 'Envío estándar', 
    description: 'Entrega en 2-3 días laborables',
    price: 5.90, 
    estimatedDays: '2-3',
    icon: Truck 
  },
  { 
    id: 'express', 
    name: 'Envío exprés', 
    description: 'Entrega en 24 horas',
    price: 8.90, 
    estimatedDays: '1',
    icon: Zap 
  },
  { 
    id: 'pickup', 
    name: 'Recogida en local', 
    description: 'Sin coste de envío',
    price: 0, 
    estimatedDays: 'Mismo día',
    icon: Store 
  }
];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface ZoneSelectorProps {
  includedZones: ShippingZone[];
  excludedZones?: ShippingZone[];
  onAddZone: (zone: ShippingZone) => void;
  onRemoveZone: (id: string) => void;
  onToggleExclude?: (zoneId: string) => void;
}

// Parser de entradas de código postal
function parsePostalInput(raw: string): ShippingZone[] {
  const zones: ShippingZone[] = [];
  const entries = raw.split(',').map(s => s.trim()).filter(Boolean);

  for (const entry of entries) {
    if (entry.includes('-') && !entry.includes('*')) {
      // Rango: 28000-28050
      const parts = entry.split('-');
      const from = parseInt(parts[0]);
      const to = parseInt(parts[1]);
      if (!isNaN(from) && !isNaN(to) && to >= from) {
        const count = to - from + 1;
        if (count <= 100) {
          // Expande hasta 100 códigos
          for (let cp = from; cp <= to; cp++) {
            const val = String(cp).padStart(5, '0');
            zones.push({ id: `postal-${Date.now()}-${val}`, type: 'postal', value: val, label: val });
          }
        } else {
          // Rango grande → agrupa como descripción
          zones.push({ id: `postal-${Date.now()}-range`, type: 'postal', value: entry, label: `CPs ${entry}` });
        }
      }
    } else if (entry.includes('*')) {
      // Wildcard: 280*
      zones.push({ id: `postal-${Date.now()}-${entry}`, type: 'postal', value: entry, label: `CPs ${entry}` });
    } else if (/^\d{5}$/.test(entry)) {
      // Código individual
      zones.push({ id: `postal-${Date.now()}-${entry}`, type: 'postal', value: entry, label: entry });
    }
  }
  return zones;
}

const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  includedZones,
  excludedZones = [],
  onAddZone,
  onRemoveZone,
  onToggleExclude
}) => {
  const [zoneType, setZoneType] = React.useState<'province' | 'postal' | 'named'>('province');
  const [zoneValue, setZoneValue] = React.useState('');
  const [zoneName, setZoneName] = React.useState('');
  const [parseError, setParseError] = React.useState('');

  const handleAddZone = () => {
    if (!zoneValue.trim()) return;
    setParseError('');

    if (zoneType === 'postal') {
      const parsed = parsePostalInput(zoneValue);
      if (parsed.length === 0) {
        setParseError('Formato no reconocido. Usa: 28001, 280*, 28000-28050');
        return;
      }
      parsed.forEach(zone => onAddZone(zone));
    } else if (zoneType === 'named') {
      if (!zoneName.trim()) return;
      const parsed = parsePostalInput(zoneValue);
      if (parsed.length === 0) {
        setParseError('Añade al menos un código postal para definir la cobertura de esta zona');
        return;
      }
      // Crea una sola zona con nombre y los CPs como valor compuesto
      onAddZone({
        id: `named-${Date.now()}`,
        type: 'custom',
        value: zoneValue,
        label: zoneName.trim(),
      });
    } else {
      onAddZone({
        id: `province-${Date.now()}-${zoneValue}`,
        type: 'province',
        value: zoneValue,
        label: zoneValue
      });
    }
    setZoneValue('');
    setZoneName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddZone();
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs de tipo — colores de marca */}
      <div className="flex gap-0 border border-border rounded-xl overflow-hidden">
        {(['province', 'postal', 'named'] as const).map((type, i) => (
          <button
            key={type}
            type="button"
            onClick={() => { setZoneType(type); setParseError(''); setZoneValue(''); setZoneName(''); }}
            className={cn(
              "flex-1 py-2.5 px-2 text-xs font-semibold transition-all",
              i > 0 && "border-l border-border",
              zoneType === type
                ? "bg-origen-pradera text-white"
                : "bg-surface-alt text-muted-foreground hover:bg-origen-crema/40 hover:text-origen-bosque"
            )}
          >
            {type === 'province' ? 'Provincia' : type === 'postal' ? 'Cód. Postal' : 'Zona con nombre'}
          </button>
        ))}
      </div>

      {/* Input con contexto */}
      <div className="space-y-2">
        {/* Zona con nombre: nombre + CPs */}
        {zoneType === 'named' && (
          <Input
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            placeholder="Nombre de la zona (ej: Área metropolitana de Madrid)"
          />
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={zoneValue}
              onChange={(e) => { setZoneValue(e.target.value); setParseError(''); }}
              onKeyDown={handleKeyDown}
              placeholder={
                zoneType === 'province' ? 'Ej: Madrid, Barcelona, Sevilla...' :
                zoneType === 'postal' ? 'Ej: 28001, 280*, 28000-28050' :
                'Códigos postales cubiertos (ej: 28001, 280*, 28000-28050)'
              }
              className={cn(parseError && "border-red-300 focus:border-red-400")}
            />
          </div>
          <Button
            type="button"
            onClick={handleAddZone}
            disabled={zoneType === 'named' ? (!zoneName.trim() || !zoneValue.trim()) : !zoneValue.trim()}
            variant="primary"
            className="flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {zoneType === 'named' && (
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-origen-pradera" />
            <span>Asigna un nombre a la zona y los códigos postales que cubre. Ej: nombre <em>"Cuenca"</em>, CPs <em>16001, 160*</em></span>
          </p>
        )}

        {parseError && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {parseError}
          </p>
        )}

        {(zoneType === 'postal' || zoneType === 'named') && !parseError && (
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-origen-pradera" />
            <span>
              <strong>Formatos CP:</strong> individual <code className="bg-surface px-1 rounded">28001</code>,
              comodín <code className="bg-surface px-1 rounded">280*</code>,
              rango <code className="bg-surface px-1 rounded">28000-28050</code>
            </span>
          </p>
        )}
      </div>

      {/* Acceso rápido para provincia: "Toda España" */}
      {zoneType === 'province' && !includedZones.some(z => z.value === 'ES') && (
        <button
          type="button"
          onClick={() => onAddZone({ id: `custom-ES-${Date.now()}`, type: 'custom', value: 'ES', label: 'Toda España' })}
          className="text-xs text-origen-pradera hover:text-origen-bosque underline underline-offset-2"
        >
          + Añadir toda España de una vez
        </button>
      )}

      {/* Lista de zonas incluidas */}
      {includedZones.length > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-medium text-origen-bosque mb-2">
            Zonas donde SÍ entregas ({includedZones.length})
          </h4>
          {/* Para muchas zonas (>8), usar chips horizontales */}
          {includedZones.length > 8 ? (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-surface rounded-lg">
              {includedZones.map((zone) => (
                <span key={zone.id} className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt text-xs text-origen-bosque border border-border rounded-full">
                  {zone.label}
                  <button type="button" onClick={() => onRemoveZone(zone.id)} className="text-text-subtle hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
          <div className="space-y-2">
            {includedZones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between p-3 bg-origen-crema/20 rounded-lg border border-origen-pradera/30"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-origen-pradera" />
                  <div>
                    <p className="text-sm font-medium text-origen-bosque">{zone.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {zone.type === 'province' && 'Provincia'}
                      {zone.type === 'postal' && 'Código Postal'}
                      {zone.type === 'custom' && 'Zona personalizada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onToggleExclude && (
                    <button
                      type="button"
                      onClick={() => onToggleExclude(zone.id)}
                      className={cn(
                        "p-1.5 rounded-lg text-xs font-medium transition-colors",
                        excludedZones.some(z => z.id === zone.id)
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-surface text-muted-foreground hover:bg-border"
                      )}
                    >
                      {excludedZones.some(z => z.id === zone.id) ? 'Excluido' : 'Excluir'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveZone(zone.id)}
                    className="p-1.5 rounded-lg text-text-subtle hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStep4Capacity({ 
  data, 
  onChange,
  producerLocation 
}: EnhancedStep4CapacityProps) {

  // ========================================================================
  // ESTADO LOCAL
  // ========================================================================
  
  const [editingOption, setEditingOption] = React.useState<string | null>(null);
  const [detectingZone, setDetectingZone] = React.useState(false);

  // Detectar zona logística cuando cambia el CP del productor
  React.useEffect(() => {
    const postalCode = producerLocation?.postalCode;
    if (!postalCode || postalCode.length !== 5) return;

    setDetectingZone(true);
    fetch(`/api/v1/producers/logistics/zone-check?postalCode=${postalCode}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((res: { data?: { centralizedLogistics: boolean; centralizedTransport: boolean } }) => {
        const d = res.data;
        if (!d) return;
        const level: LogisticsLevel = d.centralizedLogistics
          ? 'centralized'
          : d.centralizedTransport
            ? 'transport'
            : 'own';
        onChange({
          ...data,
          isInOriginRoute: d.centralizedLogistics,
          logisticsLevel: level,
        });
      })
      .catch(() => { /* sin cambios si falla */ })
      .finally(() => setDetectingZone(false));
  // Solo re-ejecutar cuando cambia el CP — no incluir data/onChange en deps para evitar loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producerLocation?.postalCode]);

  // ========================================================================
  // VALIDACIÓN
  // ========================================================================
  
  const hasDeliveryOptions = data.deliveryOptions?.length > 0;
  const hasIncludedZones = data.includedZones?.length > 0;
  const hasMinOrder = data.minOrderAmount > 0;
  const minOrderError = data.minOrderAmount !== undefined && data.minOrderAmount <= 0
    ? 'El pedido mínimo debe ser mayor de 0 €'
    : undefined;
  
  const totalSteps = 3;
  const completedSteps = [hasDeliveryOptions, hasIncludedZones, hasMinOrder].filter(Boolean).length;
  const progress = (completedSteps / totalSteps) * 100;

  // ========================================================================
  // MANEJADORES
  // ========================================================================
  
  const handleInputChange = (field: keyof EnhancedCapacityData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAddZone = (zone: ShippingZone) => {
    handleInputChange('includedZones', [...data.includedZones, zone]);
  };

  const handleRemoveZone = (id: string) => {
    handleInputChange('includedZones', data.includedZones.filter(z => z.id !== id));
    if (data.excludedZones) {
      handleInputChange('excludedZones', data.excludedZones.filter(z => z.id !== id));
    }
  };

  const handleToggleExclude = (zoneId: string) => {
    const currentExcluded = data.excludedZones || [];
    const isExcluded = currentExcluded.some(z => z.id === zoneId);
    
    if (isExcluded) {
      handleInputChange('excludedZones', currentExcluded.filter(z => z.id !== zoneId));
    } else {
      const zone = data.includedZones.find(z => z.id === zoneId);
      if (zone) {
        handleInputChange('excludedZones', [...currentExcluded, zone]);
      }
    }
  };

  const handleDeliveryOptionChange = (optionId: string, field: keyof DeliveryOption, value: any) => {
    const updatedOptions = data.deliveryOptions.map(opt =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    );
    handleInputChange('deliveryOptions', updatedOptions);
  };

  const handleAddCustomDeliveryOption = () => {
    const newOption: DeliveryOption = {
      id: `custom-${Date.now()}`,
      name: 'Nuevo envío',
      description: 'Describe tu método de envío',
      price: 5.90,
      estimatedDays: '2-3',
      icon: Package
    };
    handleInputChange('deliveryOptions', [...data.deliveryOptions, newOption]);
    setEditingOption(newOption.id);
  };

  const handleRemoveDeliveryOption = (optionId: string) => {
    handleInputChange('deliveryOptions', data.deliveryOptions.filter(opt => opt.id !== optionId));
  };

  // Determinar si el productor está en ruta (simulado)
  React.useEffect(() => {
    if (producerLocation?.province) {
      const isInRoute = ORIGEN_ROUTES.some(route =>
        route.provinces.includes(producerLocation.province.toLowerCase())
      );
      
      // Si está en ruta, forzamos opciones de Origen
      if (isInRoute && !data.isInOriginRoute) {
        handleInputChange('isInOriginRoute', true);
        handleInputChange('deliveryOptions', [{
          id: 'origen-route',
          name: 'Envío con Origen',
          description: 'Entrega en ruta semanal',
          price: 3.90,
          estimatedDays: '1-2',
          icon: Route
        }]);
      } else if (!isInRoute && !data.deliveryOptions?.length) {
        handleInputChange('isInOriginRoute', false);
        handleInputChange('deliveryOptions', DEFAULT_DELIVERY_OPTIONS);
      }
    }
  }, [producerLocation]);

  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="space-y-6">
      
      {/* ====================================================================
          PROGRESS BAR
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-origen-pradera animate-pulse" />
            <span className="text-sm font-medium text-origen-hoja">Logística y envíos</span>
          </div>
          <span className="text-sm font-semibold text-origen-pradera">{completedSteps}/{totalSteps}</span>
        </div>
        <div className="h-2.5 bg-origen-crema rounded-full overflow-hidden">
          <div 
            className="h-full bg-origen-pradera rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ====================================================================
          BANNER LOGÍSTICO — nivel detectado por CP (mobile-first)
      ==================================================================== */}
      {detectingZone && (
        <div className="flex items-center gap-3 p-4 bg-origen-crema/40 border border-border rounded-2xl animate-pulse">
          <Compass className="w-5 h-5 text-origen-pradera flex-shrink-0" />
          <p className="text-sm text-muted-foreground">Detectando disponibilidad logística para tu zona...</p>
        </div>
      )}

      {!detectingZone && data.logisticsLevel === 'centralized' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <div className="flex items-start gap-3 flex-1">
            <Route className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Logística centralizada disponible</p>
              <p className="text-xs text-green-700 mt-0.5">
                Origen recoge los pedidos en tu dirección de producción y gestiona la entrega al comprador. No necesitas configurar transportistas.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200 whitespace-nowrap">
            Nivel 1 · Ruta Origen
          </span>
        </div>
      )}

      {!detectingZone && data.logisticsLevel === 'transport' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex items-start gap-3 flex-1">
            <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Transporte concertado disponible en tu zona</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Tu zona no tiene logística centralizada, pero puedes usar nuestro transportista concertado. Tú preparas el pedido, nosotros lo enviamos.
              </p>
              {/* Toggle para usar transporte concertado */}
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.useCentralizedTransport ?? true}
                  onChange={(e) => onChange({ ...data, useCentralizedTransport: e.target.checked })}
                  className="w-4 h-4 rounded border-border accent-blue-600"
                />
                <span className="text-xs font-medium text-blue-800">Usar el transportista concertado de Origen</span>
              </label>
            </div>
          </div>
          <span className="self-start sm:self-center text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 whitespace-nowrap">
            Nivel 2 · Transporte
          </span>
        </div>
      )}

      {!detectingZone && data.logisticsLevel === 'own' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-origen-crema/50 border border-border rounded-2xl">
          <div className="flex items-start gap-3 flex-1">
            <Package className="w-5 h-5 text-origen-bosque flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-origen-bosque">Gestión propia de envíos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tu zona no tiene cobertura de logística o transporte de Origen. Configura tus propias opciones de envío a continuación.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center text-xs font-medium bg-surface text-muted-foreground px-2.5 py-1 rounded-full border border-border whitespace-nowrap">
            Nivel 3 · Propio
          </span>
        </div>
      )}

      {/* ====================================================================
          CARD 1: ESTADO DE RUTA
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Compass className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Rutas de Origen</h2>
            <p className="text-sm text-muted-foreground">
              {data.isInOriginRoute
                ? '¡Tu negocio está en nuestra ruta de reparto!'
                : 'Actualmente no estás en nuestras rutas de reparto'}
            </p>
          </div>
        </div>

        <div className={cn(
          "p-5 rounded-xl border",
          data.isInOriginRoute
            ? "bg-green-50 border-green-200"
            : "bg-amber-50 border-amber-200"
        )}>
          <div className="flex items-start gap-3">
            {data.isInOriginRoute ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={cn(
                "text-sm font-medium",
                data.isInOriginRoute ? "text-green-800" : "text-amber-800"
              )}>
                {data.isInOriginRoute
                  ? 'Envío gestionado por Origen'
                  : 'Configura tus propios envíos'}
              </p>
              <p className={cn(
                "text-xs mt-1",
                data.isInOriginRoute ? "text-green-700" : "text-amber-700"
              )}>
                {data.isInOriginRoute
                  ? 'Tus productos se entregarán a través de nuestra ruta semanal. Precio fijo: 3.90€ por pedido.'
                  : 'Al no estar en ruta, puedes configurar tus propios métodos de envío, precios y zonas de entrega.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARD 2: OPCIONES DE ENVÍO (SOLO SI NO ESTÁ EN RUTA)
      ==================================================================== */}
      {!data.isInOriginRoute && (
        <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
                <Truck className="w-6 h-6 text-origen-pradera" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-origen-bosque">Tus métodos de envío</h2>
                <p className="text-sm text-muted-foreground">Configura precios y tiempos</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCustomDeliveryOption}
              className="border-origen-pradera text-origen-pradera hover:bg-origen-pradera/10 flex-shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1.5 inline-block" />
              Añadir método
            </Button>
          </div>

          <div className="space-y-4">
            {data.deliveryOptions.map((option) => {
              const Icon = option.icon;
              const isEditing = editingOption === option.id;
              
              return (
                <div
                  key={option.id}
                  className="p-5 bg-surface-alt rounded-xl border-2 border-border hover:border-origen-pradera/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-origen-pradera" />
                    </div>
                    
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={option.name}
                            onChange={(e) => handleDeliveryOptionChange(option.id, 'name', e.target.value)}
                            className="h-10 text-base font-medium"
                          />
                          <Input
                            value={option.description}
                            onChange={(e) => handleDeliveryOptionChange(option.id, 'description', e.target.value)}
                            className="h-10 text-sm"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Precio (€)</label>
                              <Input
                                type="number"
                                value={option.price}
                                onChange={(e) => handleDeliveryOptionChange(option.id, 'price', parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.5}
                                className="h-10 text-base"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Tiempo estimado</label>
                              <Input
                                value={option.estimatedDays}
                                onChange={(e) => handleDeliveryOptionChange(option.id, 'estimatedDays', e.target.value)}
                                placeholder="Ej: 2-3 días"
                                className="h-10 text-base"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-origen-bosque">{option.name}</h3>
                            <span className="text-xl font-bold text-origen-pradera">{option.price.toFixed(2)}€</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Entrega: {option.estimatedDays} días</p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingOption(isEditing ? null : option.id)}
                        className="p-2 text-text-subtle hover:text-origen-bosque transition-colors"
                      >
                        {isEditing ? '✓' : '✎'}
                      </button>
                      {option.id.startsWith('custom-') && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliveryOption(option.id)}
                          className="p-2 text-text-subtle hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!hasDeliveryOptions && (
            <div className="mt-6 p-4 bg-feedback-danger-subtle/50 rounded-xl border border-red-200">
              <p className="text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Añade al menos un método de envío para continuar
              </p>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          CARD 3: ZONAS DE ENTREGA (SIEMPRE VISIBLE)
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Zonas de entrega</h2>
            <p className="text-sm text-muted-foreground">
              {data.isInOriginRoute
                ? 'Tu ruta está definida por Origen, pero puedes excluir zonas'
                : 'Selecciona dónde entregas (y opcionalmente dónde no)'}
            </p>
          </div>
        </div>

        <ZoneSelector
          includedZones={data.includedZones}
          excludedZones={data.excludedZones}
          onAddZone={handleAddZone}
          onRemoveZone={handleRemoveZone}
          onToggleExclude={!data.isInOriginRoute ? handleToggleExclude : undefined}
        />

        {!hasIncludedZones && (
          <div className="mt-6 p-4 bg-feedback-danger-subtle/50 rounded-xl border border-red-200">
            <p className="text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Añade al menos una zona de entrega para continuar
            </p>
          </div>
        )}

        {data.isInOriginRoute && (
          <div className="mt-4 p-3 bg-blue-50/30 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Al estar en ruta de Origen, solo puedes excluir zonas. Las zonas incluidas se entregan automáticamente.
            </p>
          </div>
        )}
      </div>

      {/* ====================================================================
          CARD 4: PEDIDO MÍNIMO
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Euro className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Pedido mínimo</h2>
            <p className="text-sm text-muted-foreground">Importe mínimo por pedido</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
            <Input
              type="number"
              value={data.minOrderAmount || ''}
              onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value) || 0)}
              min={1}
              step={5}
              inputSize="lg"
              className={cn('pl-8', minOrderError && 'border-red-500 focus:ring-red-500')}
              aria-invalid={!!minOrderError}
              aria-describedby={minOrderError ? 'min-order-error' : 'min-order-hint'}
            />
          </div>
          <span className="text-sm text-muted-foreground">euros</span>
        </div>

        {minOrderError ? (
          <p id="min-order-error" className="text-xs text-red-600 flex items-center gap-1 mt-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {minOrderError}
          </p>
        ) : (
          <p id="min-order-hint" className="text-xs text-muted-foreground mt-3">
            Recomendado: 20-30 € para venta al público general
          </p>
        )}
      </div>

      {/* ====================================================================
          CARD 5: PACKAGING SOSTENIBLE (OPCIONAL)
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Recycle className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-origen-bosque">Packaging sostenible</h2>
              <span className="text-xs bg-origen-crema/80 text-muted-foreground px-2 py-1 rounded-full">Recomendado</span>
            </div>
            <p className="text-sm text-muted-foreground">
              El 73% de los consumidores prefiere marcas con embalaje ecológico
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleInputChange('sustainablePackaging', !data.sustainablePackaging)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
              data.sustainablePackaging
                ? "border-origen-pradera bg-origen-pradera/5"
                : "border-border hover:border-origen-pradera bg-surface-alt"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                data.sustainablePackaging
                  ? "bg-origen-pradera text-white"
                  : "bg-origen-crema text-origen-bosque"
              )}>
                <Leaf className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-origen-bosque">Uso packaging sostenible</p>
                <p className="text-xs text-muted-foreground">Materiales reciclados, compostables o reutilizables</p>
              </div>
            </div>
            {data.sustainablePackaging && (
              <CheckCircle2 className="w-6 h-6 text-origen-pradera" />
            )}
          </button>

          {data.sustainablePackaging && (
            <div className="pl-4 animate-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-medium text-origen-bosque block mb-2">
                Describe tu packaging
                <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
              </label>
              <Input
                value={data.packagingDescription || ''}
                onChange={(e) => handleInputChange('packagingDescription', e.target.value)}
                placeholder="Ej: Cajas de cartón 100% reciclado, papel kraft, etiquetas compostables..."
                inputSize="md"
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Esta información aparecerá destacada en tu perfil
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          TRUST BADGES
      ==================================================================== */}
      <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Configuración guardada</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Puedes modificarlo después</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep4Capacity.displayName = 'EnhancedStep4Capacity';

export default EnhancedStep4Capacity;
