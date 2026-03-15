// 📁 /src/components/onboarding/steps/EnhancedStep3Visual.tsx
/**
 * @file EnhancedStep3Visual.tsx
 * @description Paso 3: Perfil Visual + Video
 * @version 4.0.0 - CORREGIDO: imports, manejadores y tipos
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/atoms/input';
import { Button } from '@/components/ui/atoms/button';
import { FileUpload, type UploadedFile } from '@/components/shared';

import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Heart,
  Info,
  X,
  Video,
  Sparkles
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface EnhancedVisualData {
  logo: UploadedFile | null;
  banner: UploadedFile | null;
  productImages: UploadedFile[];
  introVideo?: string;
}

export interface EnhancedStep3VisualProps {
  data: EnhancedVisualData;
  onChange: (data: EnhancedVisualData) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStep3Visual({ data, onChange }: EnhancedStep3VisualProps) {

  // ========================================================================
  // VALIDACIÓN
  // ========================================================================
  
  const hasLogo = Boolean(data.logo);
  const hasBanner = Boolean(data.banner);
  const hasProductImages = data.productImages?.length > 0;
  
  const totalSteps = 4;
  const completedSteps = [hasLogo, hasBanner, hasProductImages].filter(Boolean).length;
  const progress = (completedSteps / totalSteps) * 100;

  // ========================================================================
  // MANEJADORES
  // ========================================================================
  
  const handleInputChange = (field: keyof EnhancedVisualData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleDeleteLogo = () => {
    onChange({ ...data, logo: null });
  };

  const handleDeleteBanner = () => {
    onChange({ ...data, banner: null });
  };

  const handleDeleteProductImage = (id: string) => {
    onChange({ 
      ...data, 
      productImages: data.productImages.filter(img => img.id !== id) 
    });
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
            <span className="text-sm font-medium text-origen-hoja">Perfil visual</span>
          </div>
          <span className="text-sm font-semibold text-origen-pradera">{completedSteps}/{totalSteps}</span>
        </div>
        <div className="h-2.5 bg-origen-crema rounded-full overflow-hidden">
          <div 
            className="h-full bg-origen-pradera rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-origen-pradera" />
          Las imágenes generan confianza. Un perfil completo multiplica las visitas.
        </p>
      </div>

      {/* ====================================================================
          CARD 1: LOGO DEL NEGOCIO (OBLIGATORIO)
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-origen-pradera" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-origen-bosque">Logo del negocio</h2>
              <p className="text-sm text-gray-600">PNG, JPG o SVG • Fondo transparente ideal</p>
            </div>
          </div>
          {hasLogo && (
            <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Subido
            </span>
          )}
        </div>

        {data.logo ? (
          <div className="flex items-center gap-4 p-4 bg-origen-crema/20 rounded-xl border border-origen-pradera/30">
            <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
              <div className="w-12 h-12 bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 rounded" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-origen-bosque truncate">{data.logo.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{(data.logo.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleDeleteLogo}
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <FileUpload
            value={[]}
            onChange={async (files) => {
              if (files.length > 0) {
                handleInputChange('logo', files[0]);
              }
            }}
            helperText="Arrastra tu logo o haz clic para subir"
            accept="image/*,.svg"
            multiple={false}
            maxSize={2}
          />
        )}
      </div>

      {/* ====================================================================
          CARD 2: IMAGEN DE CABECERA (OPCIONAL)
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
              <Camera className="w-6 h-6 text-origen-pradera" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-origen-bosque">Imagen de cabecera</h2>
                <span className="text-xs bg-origen-crema/80 text-gray-600 px-2 py-1 rounded-full">Opcional</span>
              </div>
              <p className="text-sm text-gray-600">Recomendado: 1200x400px • JPG o PNG</p>
            </div>
          </div>
          {hasBanner && (
            <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Subido
            </span>
          )}
        </div>

        {data.banner ? (
          <div className="flex items-center gap-4 p-4 bg-origen-crema/20 rounded-xl border border-gray-200">
            <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-origen-bosque truncate">{data.banner.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{(data.banner.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleDeleteBanner}
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <FileUpload
            value={[]}
            onChange={async (files) => {
              if (files.length > 0) {
                handleInputChange('banner', files[0]);
              }
            }}
            helperText="Arrastra tu imagen de cabecera o haz clic para subir"
            accept="image/*"
            multiple={false}
            maxSize={5}
          />
        )}
      </div>

      {/* ====================================================================
          CARD 3: FOTOS DE PRODUCTOS (OBLIGATORIO - MÍNIMO 1)
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-origen-pradera" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-origen-bosque">Fotos de tus productos</h2>
              <p className="text-sm text-gray-600">JPG o PNG • Máx 5MB • La primera será la principal</p>
            </div>
          </div>
          {hasProductImages && (
            <span className="text-xs bg-origen-pradera/10 text-origen-pradera px-3 py-1.5 rounded-full font-medium">
              {data.productImages.length} {data.productImages.length === 1 ? 'foto' : 'fotos'}
            </span>
          )}
        </div>

        {data.productImages?.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {data.productImages.map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-lg border-2 border-gray-200 overflow-hidden group"
              >
                <div className="w-full h-full bg-gradient-to-br from-origen-crema to-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                {index === 0 && (
                  <div className="absolute top-1 left-1">
                    <span className="text-[10px] bg-origen-pradera text-white px-1.5 py-0.5 rounded-full">
                      Principal
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteProductImage(image.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-gray-800/70 hover:bg-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <FileUpload
          value={data.productImages || []}
          onChange={(files) => handleInputChange('productImages', files)}
          helperText="Arrastra fotos de tus productos o haz clic para añadir"
          accept="image/*"
          multiple={true}
          maxSize={5}
        />

        {!hasProductImages && (
          <div className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Necesitas al menos una foto de producto
              </p>
              <p className="text-xs text-red-600 mt-1">
                Sube una foto para que los compradores puedan ver tus productos
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 flex items-center gap-2 bg-origen-crema/50 p-3 rounded-lg">
          <Info className="w-4 h-4 text-origen-pradera flex-shrink-0" />
          <span>
            <strong>Consejo:</strong> Los productos con fotos de calidad reciben un 40% más de visitas.
          </span>
        </div>
      </div>

      {/* ====================================================================
          CARD 4: VIDEO DE PRESENTACIÓN (OPCIONAL)
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-origen-bosque">Video de presentación</h2>
              <span className="text-xs bg-origen-crema/80 text-gray-600 px-2 py-1 rounded-full">Recomendado</span>
            </div>
            <p className="text-sm text-gray-600">
              Los perfiles con video reciben +80% más visitas. Cuéntanos tu historia en 1 minuto.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            value={data.introVideo || ''}
            onChange={(e) => handleInputChange('introVideo', e.target.value)}
            placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
            className="h-12 text-base border-gray-200 focus:border-origen-pradera focus:ring-2 focus:ring-origen-pradera/20"
          />
          
          <div className="flex items-start gap-2 p-3 bg-origen-crema/30 rounded-lg">
            <Sparkles className="w-4 h-4 text-origen-pradera flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">
              <span className="font-medium">Consejo:</span> Un video auténtico, sin producción profesional, 
              genera más confianza que uno muy editado. Muestra tu taller, tus manos trabajando, 
              tu huerta... ¡Sé tú mismo!
            </p>
          </div>
        </div>
      </div>

      {/* ====================================================================
          TRUST BADGES
      ==================================================================== */}
      <div className="flex items-center gap-4 pt-2 text-xs text-gray-500 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          <span>✅ {hasLogo ? 'Logo subido' : 'Logo pendiente'}</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <span>📸 {hasProductImages ? `${data.productImages.length} productos` : 'Sin fotos'}</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep3Visual.displayName = 'EnhancedStep3Visual';

export default EnhancedStep3Visual;