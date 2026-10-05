/**
 * @file step-visual.tsx
 * @description Paso 2 del onboarding: perfil visual (logo, cabecera, fotos del equipo y vídeo).
 */

'use client';

import * as React from 'react';
import { Input } from '@arcediano/ux-library';
import { FileUpload } from '@/components/shared';
import { IMAGE_QUALITY_PRESETS, getImageQualityHint } from '@/lib/validations/image-quality';
import { getVideoEmbedUrl, isValidVideoUrl } from '@/lib/onboarding/video';
import type { VisualData } from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';
import { Camera, ChevronDown, Image as ImageIcon, Users, Video } from 'lucide-react';
import { FieldError, FileRow, OptionalBadge } from '../FormBits';
import { StepSection } from '../StepSection';

export type { VisualData as EnhancedVisualData };

export interface EnhancedStep2VisualProps {
  data: VisualData;
  onChange: (data: VisualData) => void;
  errors?: Record<string, string>;
}

const kb = (size: number) => (size > 0 ? `${(size / 1024).toFixed(1)} KB` : undefined);

export function EnhancedStep2Visual({ data, onChange, errors = {} }: EnhancedStep2VisualProps) {
  const [videoExpanded, setVideoExpanded] = React.useState(Boolean(data.introVideo));
  const update = (patch: Partial<VisualData>) => onChange({ ...data, ...patch });

  const video = data.introVideo?.trim() ?? '';
  const videoValid = video !== '' && isValidVideoUrl(video);
  const embedUrl = videoValid ? getVideoEmbedUrl(video) : null;

  return (
    <div className="space-y-4">
      {/* ── Logo (obligatorio) ──────────────────────────────────────────── */}
      <StepSection
        icon={<ImageIcon className="h-5 w-5" />}
        title="Logo del negocio"
        description="Obligatorio. Un fondo transparente queda mejor."
      >
        <div id="onb-logo" tabIndex={-1} className="space-y-2 focus:outline-hidden">
          {data.logo ? (
            <FileRow
              name={data.logo.name}
              meta={kb(data.logo.size)}
              removeLabel="Quitar el logo"
              onRemove={() => update({ logo: null })}
              leading={
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.logo.preview ?? data.logo.url ?? ''} alt="Vista previa del logo" className="h-full w-full object-contain" />
              }
            />
          ) : (
            <FileUpload
              value={[]}
              onChange={(files) => files[0] && update({ logo: files[0] })}
              helperText="Arrastra tu logo o toca para subirlo"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple={false}
              maxSize={2}
              qualityRequirement={IMAGE_QUALITY_PRESETS.businessLogo}
              dimensionsHint={getImageQualityHint(IMAGE_QUALITY_PRESETS.businessLogo)}
            />
          )}
          <FieldError>{errors['onb-logo']}</FieldError>
        </div>
      </StepSection>

      {/* ── Cabecera (opcional) ─────────────────────────────────────────── */}
      <StepSection
        icon={<Camera className="h-5 w-5" />}
        title="Imagen de cabecera"
        description="Una foto panorámica (horizontal) y nítida para la parte superior de tu tienda. No sirve una imagen cuadrada."
        badge={<OptionalBadge />}
      >
        {data.banner ? (
          <div className="space-y-3">
            <div className="h-28 w-full overflow-hidden rounded-xl border border-border bg-surface sm:h-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.banner.preview ?? data.banner.url ?? ''} alt="Vista previa de la cabecera" className="h-full w-full object-cover" />
            </div>
            <FileRow
              name={data.banner.name}
              meta={kb(data.banner.size)}
              removeLabel="Quitar la imagen de cabecera"
              onRemove={() => update({ banner: null })}
            />
          </div>
        ) : (
          <FileUpload
            value={[]}
            onChange={(files) => files[0] && update({ banner: files[0] })}
            helperText="Arrastra tu imagen o toca para subirla"
            accept="image/jpeg,image/png,image/webp"
            multiple={false}
            maxSize={5}
            qualityRequirement={IMAGE_QUALITY_PRESETS.profileBanner}
            dimensionsHint={getImageQualityHint(IMAGE_QUALITY_PRESETS.profileBanner)}
          />
        )}
      </StepSection>

      {/* ── Fotos del equipo (opcional) ─────────────────────────────────── */}
      <StepSection
        icon={<Users className="h-5 w-5" />}
        title="Fotos del equipo"
        description="Hasta 3 fotos de las personas detrás de tus productos. Aparecen en tu perfil público y generan confianza."
        badge={<OptionalBadge />}
      >
        <FileUpload
          value={data.teamPhotos}
          onChange={(files) => update({ teamPhotos: files })}
          helperText="Arrastra imágenes o toca para subir (hasta 3)"
          accept="image/jpeg,image/png,image/webp"
          multiple
          maxFiles={3}
          maxSize={5}
          qualityRequirement={IMAGE_QUALITY_PRESETS.profileGallery}
          dimensionsHint={getImageQualityHint(IMAGE_QUALITY_PRESETS.profileGallery)}
        />
      </StepSection>

      {/* ── Vídeo de presentación (opcional, plegado) ───────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-alt shadow-xs">
        <button
          type="button"
          onClick={() => setVideoExpanded((e) => !e)}
          aria-expanded={videoExpanded}
          aria-controls="onb-video-panel"
          className="flex min-h-11 w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-origen-pradera/20 to-origen-hoja/20 text-hoja-tinta">
              <Video className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold leading-tight text-origen-bosque">Vídeo de presentación</span>
                <OptionalBadge />
              </span>
              <span className="block text-xs text-text-subtle sm:text-sm">Enlace de YouTube o Vimeo.</span>
            </span>
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-text-subtle transition-transform', videoExpanded && 'rotate-180')} />
        </button>
        {videoExpanded && (
          <div id="onb-video-panel" className="space-y-3 border-t border-border-subtle p-4 sm:p-5">
            <Input
              id="onb-video"
              label="Enlace del vídeo"
              value={data.introVideo || ''}
              onChange={(e) => update({ introVideo: e.target.value })}
              placeholder="https://youtube.com/watch?v=… o https://vimeo.com/…"
              inputMode="url"
              error={video && !videoValid ? 'Introduce un enlace válido de YouTube o Vimeo.' : errors['onb-video']}
            />
            {embedUrl && (
              <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black">
                <iframe src={embedUrl} className="h-full w-full" allowFullScreen title="Vista previa del vídeo" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

EnhancedStep2Visual.displayName = 'EnhancedStep2Visual';

export default EnhancedStep2Visual;
