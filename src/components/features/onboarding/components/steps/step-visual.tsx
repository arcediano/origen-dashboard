// 📁 /src/components/onboarding/steps/EnhancedStep3Visual.tsx
/**
 * @file EnhancedStep3Visual.tsx
 * @description Paso 3: Perfil Visual + Video
 * @version 4.0.0 - CORREGIDO: imports, manejadores y tipos
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Input, Button } from '@arcediano/ux-library';
import { FileUpload, type UploadedFile } from '@/components/shared';

import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Info,
  X,
  Video,
  Sparkles,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

// ============================================================================
// HELPERS
// ============================================================================

function getVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

function isValidVideoUrl(url: string): boolean {
  return /(youtube\.com|youtu\.be|vimeo\.com)/.test(url);
}

// ============================================================================
// TIPOS
// ============================================================================

export interface EnhancedVisualData {
  logo: UploadedFile | null;
  banner: UploadedFile | null;
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

  const totalSteps = 3;
  const completedSteps = [hasLogo, hasBanner].filter(Boolean).length;
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
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-origen-pradera" />
          Las imágenes generan confianza. Un perfil completo multiplica las visitas.
        </p>
      </div>

      {/* ====================================================================
          CARD 1: LOGO DEL NEGOCIO (OBLIGATORIO)
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-origen-pradera" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-origen-bosque">Logo del negocio</h2>
              <p className="text-sm text-muted-foreground">PNG, JPG, WebP o GIF • Fondo transparente ideal</p>
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
            <div className="w-16 h-16 rounded-lg bg-surface-alt border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.logo.preview ?? (data.logo.file ? URL.createObjectURL(data.logo.file) : '')}
                alt="Logo preview"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-origen-bosque truncate">{data.logo.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{(data.logo.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleDeleteLogo}
              className="text-text-subtle hover:text-foreground"
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
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={false}
            maxSize={2}
            minDimensions={{ width: 200, height: 200 }}
            dimensionsHint="200×200 px mín."
          />
        )}
      </div>

      {/* ====================================================================
          CARD 2: IMAGEN DE CABECERA (OPCIONAL)
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
              <Camera className="w-6 h-6 text-origen-pradera" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-origen-bosque">Imagen de cabecera</h2>
                <span className="text-xs bg-origen-crema/80 text-muted-foreground px-2 py-1 rounded-full">Opcional</span>
              </div>
              <p className="text-sm text-muted-foreground">Recomendado: 1200x400px • JPG o PNG</p>
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
          <div className="space-y-3">
            <div className="w-full h-28 rounded-xl overflow-hidden border border-border bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.banner.preview ?? (data.banner.file ? URL.createObjectURL(data.banner.file) : '')}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-3 px-1">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-origen-bosque truncate">{data.banner.name}</p>
                <p className="text-xs text-muted-foreground">{(data.banner.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleDeleteBanner}
                className="text-text-subtle hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
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
            accept="image/jpeg,image/png,image/webp"
            multiple={false}
            maxSize={5}
            minDimensions={{ width: 1200, height: 400 }}
            dimensionsHint="1200×400 px recomendado"
          />
        )}
      </div>

      {/* ====================================================================
          CARD 3: VIDEO DE PRESENTACIÓN (OPCIONAL)
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-origen-bosque">Video de presentación</h2>
              <span className="text-xs bg-origen-crema/80 text-muted-foreground px-2 py-1 rounded-full">Recomendado</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Los perfiles con video reciben +80% más visitas. Cuéntanos tu historia en 1 minuto.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              value={data.introVideo || ''}
              onChange={(e) => handleInputChange('introVideo', e.target.value)}
              placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
              className={cn(
                "h-12 text-base focus:ring-2",
                data.introVideo && isValidVideoUrl(data.introVideo)
                  ? "border-green-400 focus:border-green-500 focus:ring-green-200"
                  : data.introVideo && !isValidVideoUrl(data.introVideo)
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-border focus:border-origen-pradera focus:ring-origen-pradera/20"
              )}
            />
            {data.introVideo && isValidVideoUrl(data.introVideo) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {data.introVideo && !isValidVideoUrl(data.introVideo) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
            )}
          </div>

          {data.introVideo && !isValidVideoUrl(data.introVideo) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Introduce una URL válida de YouTube o Vimeo
            </p>
          )}

          {/* Embed preview */}
          {data.introVideo && isValidVideoUrl(data.introVideo) && getVideoEmbedUrl(data.introVideo) && (
            <div className="rounded-xl overflow-hidden border border-green-200 bg-black aspect-video">
              <iframe
                src={getVideoEmbedUrl(data.introVideo)!}
                className="w-full h-full"
                allowFullScreen
                title="Video preview"
              />
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-origen-crema/30 rounded-lg">
            <Sparkles className="w-4 h-4 text-origen-pradera flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
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
      <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center gap-1.5">
          <span>✅ {hasLogo ? 'Logo subido' : 'Logo pendiente'}</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1.5">
          <span>🖼️ {hasBanner ? 'Cabecera subida' : 'Cabecera opcional'}</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep3Visual.displayName = 'EnhancedStep3Visual';

export default EnhancedStep3Visual;

