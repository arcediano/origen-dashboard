// 📁 /src/components/onboarding/steps/EnhancedStep2Story.tsx
/**
 * @file EnhancedStep2Story.tsx
 * @description Paso 2: Historia + Filosofía + Certificaciones + Valores
 * @version 5.1.0 - CORREGIDO: Todos los imports, iconos reemplazados
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Input, InputAffixField } from '@arcediano/ux-library';
import { Textarea } from '@arcediano/ux-library';
import { FileUpload, type UploadedFile } from '@/components/shared';
import { IMAGE_QUALITY_PRESETS, getImageQualityHint } from '@/lib/validations/image-quality';

import {
  Building,
  Heart,
  Camera,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info,
  Sprout,
  Shield,
  Leaf,
  Award,
  Globe,
  Users,
  Clock,
  Sparkles,
  FileBadge,
  BookOpen,
  Recycle,
  MapPin,
} from 'lucide-react';

// ============================================================================
// CONSTANTES - VALORES (CORE_VALUES)
// ============================================================================

const CORE_VALUES = [
  { id: 'sostenibilidad', name: 'Sostenibilidad', icon: Leaf, description: 'Compromiso con el medio ambiente' },
  { id: 'calidad', name: 'Calidad', icon: Award, description: 'Excelencia en cada producto' },
  { id: 'tradicion', name: 'Tradición', icon: Clock, description: 'Saberes heredados' },
  { id: 'innovacion', name: 'Innovación', icon: Sparkles, description: 'Nuevas formas de hacer' },
  { id: 'local', name: 'Local', icon: MapPin, description: 'Cercanía y comunidad' },
  { id: 'artesanal', name: 'Artesanal', icon: Heart, description: 'Hecho a mano' },
  { id: 'ecologico', name: 'Ecológico', icon: Sprout, description: 'Respeto por la tierra' },
  { id: 'familiar', name: 'Familiar', icon: Users, description: 'Negocio de generaciones' }
];

// ============================================================================
// CERTIFICACIONES DISPONIBLES
// ============================================================================

const AVAILABLE_CERTIFICATIONS = [
  {
    id: 'ecologico',
    name: 'Agricultura Ecológica',
    issuingBody: 'CCAE / CAAE',
    icon: Leaf,
    description: 'Certificado oficial de producción ecológica'
  },
  {
    id: 'comercio_justo',
    name: 'Comercio Justo',
    issuingBody: 'WFTO',
    icon: Globe,
    description: 'Prácticas de comercio ético y justo'
  },
  {
    id: 'denominacion_origen',
    name: 'Denominación de Origen',
    issuingBody: 'DOP / IGP',
    icon: Award,
    description: 'Producto con denominación de origen protegida'
  },
  {
    id: 'artesania',
    name: 'Producto Artesano',
    issuingBody: 'Junta de Andalucía / CCAA',
    icon: Heart,
    description: 'Certificado de elaboración artesanal'
  },
  {
    id: 'produccion_integrada',
    name: 'Producción Integrada',
    issuingBody: 'Consejería Agricultura',
    icon: Sprout,
    description: 'Sistema sostenible de producción'
  },
  {
    id: 'bienestar_animal',
    name: 'Bienestar Animal',
    issuingBody: 'Welfair / AENOR',
    icon: Shield,
    description: 'Certificación en bienestar animal'
  },
  {
    id: 'agricultura_regenerativa',
    name: 'Agricultura Regenerativa',
    issuingBody: 'Regenerative Organic',
    icon: Recycle,
    description: 'Prácticas que regeneran el suelo'
  },
  {
    id: 'sin_gluten',
    name: 'Sin Gluten',
    issuingBody: 'FACE',
    icon: Sprout, // ✅ CORREGIDO: Wheat → Sprout
    description: 'Certificación de producto sin gluten'
  },
  {
    id: 'vegano',
    name: 'Vegano',
    issuingBody: 'V-Label',
    icon: Leaf,
    description: 'Producto apto para veganos'
  }
];

// ============================================================================
// TIPOS
// ============================================================================

export interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  document?: UploadedFile;
  verified: boolean;
}

export interface EnhancedStoryData {
  // Información básica
  businessName: string;
  tagline: string;
  description: string;
  values: string[];
  photos: UploadedFile[];

  // Presencia digital (opcional)
  website?: string;
  instagramHandle?: string;

  // Filosofía de producción
  productionPhilosophy?: string;

  // Certificaciones
  certifications?: Certification[];
}

export interface EnhancedStep2StoryProps {
  data: EnhancedStoryData;
  onChange: (data: EnhancedStoryData) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStep2Story({ data, onChange }: EnhancedStep2StoryProps) {
  const [charCount, setCharCount] = React.useState(data.description?.length || 0);
  const [philosophyCharCount, setPhilosophyCharCount] = React.useState(data.productionPhilosophy?.length || 0);
  const [filosofiaExpanded, setFilosofiaExpanded] = React.useState(false);
  const [certificacionesExpanded, setCertificacionesExpanded] = React.useState(false);
  const [fotosExpanded, setFotosExpanded] = React.useState(false);

  // Validaciones URL e Instagram — solo al perder el foco
  const [websiteTouched, setWebsiteTouched] = React.useState(false);
  const [instagramTouched, setInstagramTouched] = React.useState(false);

  const websiteError = React.useMemo(() => {
    if (!data.website?.trim()) return undefined; // campo opcional
    if (!/^https?:\/\/[^\s]+\.[a-z]{2,}/i.test(data.website.trim())) {
      return 'La URL debe empezar por http:// o https:// e incluir un dominio válido';
    }
    return undefined;
  }, [data.website]);

  const instagramError = React.useMemo(() => {
    if (!data.instagramHandle?.trim()) return undefined; // campo opcional
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(data.instagramHandle.trim())) {
      return 'Solo letras, números, puntos y guiones bajos. Máximo 30 caracteres';
    }
    return undefined;
  }, [data.instagramHandle]);

  const hasBusinessName = Boolean(data.businessName?.trim());
  const hasDescription = data.description?.length >= 50;
  const hasValues = data.values?.length > 0;
  
  const totalSteps = 4;
  const completedSteps = [hasBusinessName, hasDescription, hasValues].filter(Boolean).length;
  const progress = (completedSteps / totalSteps) * 100;

  // ========================================================================
  // MANEJADORES
  // ========================================================================
  
  const handleInputChange = (field: keyof EnhancedStoryData, value: any) => {
    if (field === 'description') setCharCount(value.length);
    if (field === 'productionPhilosophy') setPhilosophyCharCount(value.length);
    onChange({ ...data, [field]: value });
  };
  
  const handleValueSelect = (valueId: string) => {
    const isSelected = data.values?.includes(valueId);
    const newValues = isSelected
      ? data.values.filter(id => id !== valueId)
      : [...(data.values || []), valueId];
    handleInputChange('values', newValues);
  };

  const handleCertificationToggle = (certId: string) => {
    const current = data.certifications || [];
    const exists = current.find(c => c.id === certId);
    
    if (exists) {
      handleInputChange('certifications', current.filter(c => c.id !== certId));
    } else {
      const cert = AVAILABLE_CERTIFICATIONS.find(c => c.id === certId)!;
      handleInputChange('certifications', [
        ...current,
        {
          id: cert.id,
          name: cert.name,
          issuingBody: cert.issuingBody,
          verified: false
        }
      ]);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="space-y-4">
      
      {/* ====================================================================
          PROGRESS BAR
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-3 md:p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-origen-pradera animate-pulse" />
            <span className="text-sm font-medium text-origen-hoja">Historia y valores</span>
          </div>
          <span className="text-sm font-semibold text-origen-pradera">{completedSteps}/3</span>
        </div>
        <div className="h-2.5 bg-origen-crema rounded-full overflow-hidden">
          <div 
            className="h-full bg-origen-pradera rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ====================================================================
          CARD 1: NOMBRE Y ESLOGAN
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-4 md:p-5 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center flex-shrink-0">
            <Building className="w-5 h-5 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-origen-bosque">Nombre y eslogan</h2>
            <p className="text-xs text-muted-foreground">Cómo quieres que te conozcan</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Nombre del negocio"
            required
            value={data.businessName || ''}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            inputSize="md"
          />

          <Input
            label="Eslogan o frase descriptiva"
            value={data.tagline || ''}
            onChange={(e) => handleInputChange('tagline', e.target.value)}
            placeholder="Una frase que capture la esencia de tu marca"
            inputSize="md"
            helperText={'Ej: "El sabor de la tradición"'}
          />

          {/* Presencia digital */}
          <div className="pt-3 border-t border-border-subtle space-y-3">
            <p className="text-sm font-medium text-origen-bosque flex items-center gap-2">
              <Globe className="w-4 h-4 text-origen-pradera" />
              Presencia digital
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Sitio web"
                value={data.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                onBlur={() => setWebsiteTouched(true)}
                placeholder="https://www.tunegocio.com"
                type="url"
                inputSize="md"
                error={websiteTouched ? websiteError : undefined}
              />
              <div>
                <InputAffixField
                  label="Instagram"
                  value={data.instagramHandle || ''}
                  onChange={(e) => handleInputChange('instagramHandle', e.target.value.replace(/^@/, ''))}
                  onBlur={() => setInstagramTouched(true)}
                  placeholder="tunegocio"
                  inputSize="md"
                  affixLeft="@"
                  error={instagramTouched ? instagramError : undefined}
                  maxLength={30}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARD 2: DESCRIPCIÓN / HISTORIA
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-4 md:p-5 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-origen-bosque">Cuéntanos tu historia</h2>
            <p className="text-xs text-muted-foreground">Los compradores conectan con personas, no solo con productos</p>
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            value={data.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Comparte tu pasión, tus valores, lo que te motiva... (mínimo 50 caracteres)"
            className={cn(
              "min-h-[120px] text-base focus:ring-2",
              charCount >= 50
                ? "border-green-400 focus:border-green-500 focus:ring-green-200"
                : "border-border focus:border-origen-pradera focus:ring-origen-pradera/20"
            )}
            maxLength={500}
          />

          {/* Barra de progreso hasta 50 chars */}
          {charCount < 50 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-text-subtle mb-1">
                <span>{charCount} / 50 mínimos</span>
                <span>{charCount}/500</span>
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-origen-pradera rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((charCount / 50) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {50 - charCount} caracteres más para poder continuar
              </p>
            </div>
          )}

          {charCount >= 50 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ¡Listo! Ya puedes continuar
              </span>
              <span className="text-xs text-text-subtle">{charCount}/500</span>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          CARD 3: FILOSOFÍA DE PRODUCCIÓN (colapsable)
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => setFilosofiaExpanded((e) => !e)}
          className="w-full flex items-center justify-between p-4 md:p-5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center flex-shrink-0">
              <Sprout className="w-5 h-5 text-origen-pradera" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-origen-bosque">Filosofía de producción</h2>
                <span className="text-xs bg-origen-crema/80 text-muted-foreground px-2 py-0.5 rounded-full">Recomendado</span>
                {data.productionPhilosophy && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
              </div>
              <p className="text-xs text-muted-foreground">Métodos, valores y compromiso con la calidad</p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
              filosofiaExpanded && "rotate-180"
            )}
          />
        </button>
        {filosofiaExpanded && (
          <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-border-subtle">
            <div className="pt-4 space-y-3">
              <Textarea
                value={data.productionPhilosophy || ''}
                onChange={(e) => handleInputChange('productionPhilosophy', e.target.value)}
                placeholder="Ej: Cultivamos siguiendo métodos biodinámicos, respetando los ciclos naturales y sin químicos sintéticos. Cosechamos a mano y fermentamos de forma tradicional..."
                className="min-h-[90px]"
                maxLength={500}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{philosophyCharCount}/500</span>
                {data.productionPhilosophy && data.productionPhilosophy.length > 50 && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gracias por compartir
                  </span>
                )}
              </div>

              <div className="p-3 bg-origen-crema/30 rounded-lg border border-origen-pradera/30">
                <p className="text-xs text-origen-bosque flex items-center gap-2">
                  <Info className="w-4 h-4 text-origen-pradera" />
                  Los compradores valoran la transparencia. Sé específico sobre tus métodos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          CARD 4: VALORES
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-4 md:p-5 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-origen-bosque">Valores</h2>
            <p className="text-xs text-muted-foreground">Selecciona los que mejor te representen</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CORE_VALUES.map((value) => {
            const IconComponent = value.icon;
            const isSelected = data.values?.includes(value.id);
            return (
              <button
                key={value.id}
                type="button"
                onClick={() => handleValueSelect(value.id)}
                className={cn(
                  "group relative bg-surface-alt rounded-xl p-2.5 border-2 transition-all",
                  "hover:shadow-lg hover:scale-[1.02]",
                  "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
                  isSelected
                    ? "border-origen-pradera bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5 shadow-md"
                    : "border-border hover:border-origen-pradera"
                )}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5">
                    <div className="w-4 h-4 rounded-full bg-origen-pradera flex items-center justify-center">
                      <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 transition-all",
                    isSelected
                      ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white shadow-md"
                      : "bg-origen-crema text-origen-bosque group-hover:scale-110"
                  )}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-origen-bosque" : "text-foreground"
                  )}>
                    {value.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {!hasValues && (
          <div className="mt-6 p-4 bg-feedback-danger-subtle/50 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-feedback-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Selecciona al menos un valor
              </p>
              <p className="text-xs text-red-600 mt-1">
                Los valores ayudan a los compradores a conectar con tu marca
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          CARD 5: CERTIFICACIONES (colapsable)
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => setCertificacionesExpanded(e => !e)}
          className="w-full flex items-center justify-between p-4 md:p-5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center flex-shrink-0">
              <FileBadge className="w-5 h-5 text-origen-pradera" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-origen-bosque">Certificaciones</h2>
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">Requiere verificación</span>
                {data.certifications && data.certifications.length > 0 && (
                  <span className="text-xs text-green-600 font-medium">{data.certifications.length} seleccionada(s)</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Sellos de calidad que verificamos en el Paso 6</p>
            </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform flex-shrink-0", certificacionesExpanded && "rotate-180")} />
        </button>
        {certificacionesExpanded && (
          <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-border-subtle">
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_CERTIFICATIONS.map((cert) => {
                const IconComponent = cert.icon;
                const isSelected = data.certifications?.some(c => c.id === cert.id);
                return (
                  <button
                    key={cert.id}
                    type="button"
                    onClick={() => handleCertificationToggle(cert.id)}
                    className={cn(
                      "relative flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                      "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
                      isSelected
                        ? "border-origen-pradera bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5"
                        : "border-border hover:border-origen-pradera bg-surface-alt"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected
                        ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white"
                        : "bg-origen-crema text-origen-bosque"
                    )}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-origen-bosque">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">{cert.issuingBody}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-origen-pradera flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          CARD 6: FOTOS DEL EQUIPO (colapsable)
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => setFotosExpanded(e => !e)}
          className="w-full flex items-center justify-between p-4 md:p-5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-origen-pradera" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-origen-bosque">Fotos del equipo o proceso</h2>
                <span className="text-xs bg-origen-crema/80 text-muted-foreground px-2 py-0.5 rounded-full">Recomendado</span>
                {data.photos && data.photos.length > 0 && (
                  <span className="text-xs text-green-600">{data.photos.length} foto(s)</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Los perfiles con fotos reciben +40% visitas</p>
            </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform flex-shrink-0", fotosExpanded && "rotate-180")} />
        </button>
        {fotosExpanded && (
          <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-border-subtle">
            <div className="pt-4">
              <FileUpload
                value={data.photos || []}
                onChange={(files) => handleInputChange('photos', files)}
                helperText="Arrastra fotos de tu equipo, taller o proceso de elaboración"
                accept="image/*"
                multiple={true}
                maxSize={5}
                qualityRequirement={IMAGE_QUALITY_PRESETS.profileGallery}
                dimensionsHint={getImageQualityHint(IMAGE_QUALITY_PRESETS.profileGallery)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

EnhancedStep2Story.displayName = 'EnhancedStep2Story';

export default EnhancedStep2Story;

