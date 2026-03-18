// 📁 /src/components/onboarding/steps/EnhancedStep2Story.tsx
/**
 * @file EnhancedStep2Story.tsx
 * @description Paso 2: Historia + Filosofía + Certificaciones + Valores
 * @version 5.1.0 - CORREGIDO: Todos los imports, iconos reemplazados
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/atoms/input';
import { Textarea } from '@/components/ui/atoms/textarea';
import { FileUpload, type UploadedFile } from '@/components/shared';

import {
  Building,
  Heart,
  Camera,
  CheckCircle2,
  AlertCircle,
  Quote,
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
  Droplet,
  Recycle,
  Sun,
  Wind,
  TreePine,
  MapPin,
  Store,
  Package,
  Instagram,
  Link,
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
    <div className="space-y-6">
      
      {/* ====================================================================
          PROGRESS BAR
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Building className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Nombre y eslogan</h2>
            <p className="text-sm text-gray-600">Cómo quieres que te conozcan</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-origen-bosque flex items-center gap-2">
              Nombre del negocio <span className="text-red-500">*</span>
            </label>
            <Input
              value={data.businessName || ''}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Ej: Huerta Orgánica del Valle"
              inputSize="lg"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-origen-bosque flex items-center gap-2">
              <Quote className="w-4 h-4 text-origen-pradera" />
              Eslogan o frase descriptiva
              <span className="text-xs text-gray-500 font-normal">(opcional)</span>
            </label>
            <Input
              value={data.tagline || ''}
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              placeholder="Una frase que capture la esencia de tu marca"
              inputSize="lg"
            />
            <p className="text-xs text-gray-500">
              Ej: &ldquo;El sabor de la tradición&rdquo;, &ldquo;De nuestra huerta a tu mesa&rdquo;, &ldquo;Artesanía con corazón&rdquo;
            </p>
          </div>

          {/* Presencia digital */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <p className="text-sm font-medium text-origen-bosque flex items-center gap-2">
              <Globe className="w-4 h-4 text-origen-pradera" />
              Presencia digital
              <span className="text-xs text-gray-500 font-normal">(opcional)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Link className="w-3.5 h-3.5" />
                  Sitio web
                </label>
                <Input
                  value={data.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.tunegocio.com"
                  type="url"
                  inputSize="md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">@</span>
                  <Input
                    value={data.instagramHandle || ''}
                    onChange={(e) => handleInputChange('instagramHandle', e.target.value.replace(/^@/, ''))}
                    placeholder="tunegocio"
                    inputSize="md"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARD 2: DESCRIPCIÓN / HISTORIA
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Cuéntanos tu historia</h2>
            <p className="text-sm text-gray-600">Los compradores conectan con personas, no solo con productos</p>
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
                : "border-gray-200 focus:border-origen-pradera focus:ring-origen-pradera/20"
            )}
            maxLength={500}
          />

          {/* Barra de progreso hasta 50 chars */}
          {charCount < 50 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{charCount} / 50 mínimos</span>
                <span>{charCount}/500</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
              <span className="text-xs text-gray-400">{charCount}/500</span>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          CARD 3: FILOSOFÍA DE PRODUCCIÓN
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Sprout className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-origen-bosque">Filosofía de producción</h2>
              <span className="text-xs bg-origen-crema/80 text-gray-600 px-2 py-1 rounded-full">Recomendado</span>
            </div>
            <p className="text-sm text-gray-600">Cuenta tus métodos, valores y compromiso con la calidad</p>
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            value={data.productionPhilosophy || ''}
            onChange={(e) => handleInputChange('productionPhilosophy', e.target.value)}
            placeholder="Ej: Cultivamos siguiendo métodos biodinámicos, respetando los ciclos naturales y sin químicos sintéticos. Cosechamos a mano y fermentamos de forma tradicional..."
            className="min-h-[100px]"
            maxLength={500}
          />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {philosophyCharCount}/500 caracteres
            </span>
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

      {/* ====================================================================
          CARD 4: VALORES
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Valores</h2>
            <p className="text-sm text-gray-600">Selecciona los que mejor te representen</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CORE_VALUES.map((value) => {
            const IconComponent = value.icon;
            const isSelected = data.values?.includes(value.id);
            return (
              <button
                key={value.id}
                type="button"
                onClick={() => handleValueSelect(value.id)}
                className={cn(
                  "group relative bg-white rounded-xl p-4 border-2 transition-all",
                  "hover:shadow-lg hover:scale-[1.02]",
                  "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
                  isSelected
                    ? "border-origen-pradera bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5 shadow-md"
                    : "border-gray-200 hover:border-origen-pradera"
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-origen-pradera flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all",
                    isSelected
                      ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white shadow-md"
                      : "bg-origen-crema text-origen-bosque group-hover:scale-110"
                  )}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-origen-bosque" : "text-gray-700"
                  )}>
                    {value.name}
                  </span>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {value.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {!hasValues && (
          <div className="mt-6 p-4 bg-red-50/50 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
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
          CARD 5: CERTIFICACIONES
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <FileBadge className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-origen-bosque">Certificaciones y sellos de calidad</h2>
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-200">
                Requiere verificación
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Añade certificaciones oficiales. Nuestro equipo verificará los documentos en el paso 5.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_CERTIFICATIONS.map((cert) => {
            const IconComponent = cert.icon;
            const isSelected = data.certifications?.some(c => c.id === cert.id);
            const isVerified = data.certifications?.find(c => c.id === cert.id)?.verified;
            
            return (
              <button
                key={cert.id}
                type="button"
                onClick={() => handleCertificationToggle(cert.id)}
                className={cn(
                  "relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left",
                  "hover:shadow-md hover:scale-[1.01]",
                  "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
                  isSelected
                    ? "border-origen-pradera bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5"
                    : "border-gray-200 hover:border-origen-pradera bg-white"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                  isSelected
                    ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white shadow-md"
                    : "bg-origen-crema text-origen-bosque"
                )}>
                  <IconComponent className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-origen-bosque">{cert.name}</h3>
                    {isVerified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verificado
                      </span>
                    )}
                    {isSelected && !isVerified && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{cert.issuingBody}</p>
                  <p className="text-xs text-gray-600 mt-1">{cert.description}</p>
                </div>

                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 rounded-full bg-origen-pradera flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50/30 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Proceso de verificación:</strong> En el paso 5 (Documentación) podrás subir los certificados oficiales. 
              Una vez verificados, aparecerán con un sello de confianza en tu perfil público.
            </span>
          </p>
        </div>
        
        {data.certifications && data.certifications.length > 0 && (
          <div className="mt-4 p-3 bg-origen-pradera/5 rounded-lg border border-origen-pradera/30">
            <p className="text-xs text-origen-bosque flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-origen-pradera" />
              Has seleccionado {data.certifications.length} certificación(es). Recuerda subir los documentos en el paso 5.
            </p>
          </div>
        )}
      </div>

      {/* ====================================================================
          CARD 6: FOTOS DEL EQUIPO
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Camera className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-origen-bosque">Fotos del equipo o proceso</h2>
              <span className="text-xs bg-origen-crema/80 text-gray-600 px-2 py-1 rounded-full">Recomendado</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Las imágenes generan confianza. Los perfiles con fotos del productor reciben <span className="font-semibold text-origen-pradera">+40% visitas</span>.
            </p>
          </div>
        </div>

        <FileUpload
          value={data.photos || []}
          onChange={(files) => handleInputChange('photos', files)}
          helperText="Arrastra fotos de tu equipo, taller o proceso de elaboración"
          accept="image/*"
          multiple={true}
          maxSize={5}
        />
        
        <div className="mt-4 text-xs text-gray-500 flex items-center gap-2 bg-origen-crema/30 p-3 rounded-lg">
          <Info className="w-4 h-4 text-origen-pradera flex-shrink-0" />
          <span>
            <strong>Consejo:</strong> Una foto tuya, de tus manos trabajando o de tu equipo genera mucha más confianza que solo productos.
          </span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep2Story.displayName = 'EnhancedStep2Story';

export default EnhancedStep2Story;