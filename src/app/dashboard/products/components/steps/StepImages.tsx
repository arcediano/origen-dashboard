/**
 * @component StepImages
 * @description Paso 2: Imágenes del producto
 */

'use client';

import { StepShell } from './StepShell';
import { ImageUploader } from '../../components/ImageUploader';
import { ImageFocusPicker } from '../../components/ImageFocusPicker';
import { Badge } from '@arcediano/ux-library';
import { Label } from '@arcediano/ux-library';
import { Tooltip } from '@arcediano/ux-library';
import {
  Camera,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Layers,
  Square,
  Palette,
  Sun,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGE_QUALITY_PRESETS, getImageQualityHint } from '@/lib/validations/image-quality';
import type { ProductImage } from '@/types/product';
import { FORM_STEPS, stepPosition } from '@/types/product';
import { SENSITIVE_FIELD_LABELS } from '@/lib/constants/sensitiveFields';

interface StepImagesProps {
  gallery?: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  completed?: boolean;
  /** Dentro de la pantalla de revisión del onboarding con IA: sin tarjeta ni cabecera propias. */
  embedded?: boolean;
  isPublishedProduct?: boolean;
}

// Checklist de estilo para fotos subidas a mano (petición del humano,
// 2026-10-17 — guía de imágenes A.1): hasta ahora la única guía visible
// era el texto de `getImageQualityHint` (resolución + proporción). Cosas
// como fondo, luz o marcas de agua no se pueden validar por código, así
// que viven aquí como checklist — el objetivo es que la foto manual se
// acerque al resultado ya estándar de las imágenes generadas por IA
// (FLUX, fondo blanco, 2000x2000, ver IMAGE_QUALITY_PRESETS.productImage).
const IMAGE_STYLE_CHECKLIST = [
  { icon: Square, label: 'Formato cuadrado (1:1), producto centrado' },
  { icon: Palette, label: 'Fondo liso y neutro — blanco o superficie lisa' },
  { icon: Sun, label: 'Luz natural o difusa, sin sombras duras' },
  { icon: Ban, label: 'Sin marcas de agua, texto ni marcos superpuestos' },
] as const;

function ImageStyleGuideline() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-alt/50 p-3">
      <p className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-2">
        Antes de subir tu foto
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {IMAGE_STYLE_CHECKLIST.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-1.5 text-xs text-text-subtle">
            <Icon className="h-3.5 w-3.5 shrink-0 text-hoja-tinta" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper para renderizar indicador de campo sensible
function SensitiveFieldIndicator({ fieldName }: { fieldName: string }) {
  const labels = SENSITIVE_FIELD_LABELS[fieldName];
  if (!labels) return null;

  return (
    <Tooltip
      content="Campo sensible"
      detailed="Editar este campo enviará el producto a revisión y lo ocultará del catálogo hasta que se apruebe."
      size="sm"
      className="[&_button]:text-feedback-warning [&_button:hover]:text-feedback-warning/80"
    />
  );
}

export function StepImages({
  gallery = [],
  onImagesChange,
  completed,
  embedded = false,
  isPublishedProduct = false,
}: StepImagesProps) {
  // La imagen principal es la marcada `isMain` (o la primera de la galería)
  const mainImage = gallery.find((img) => img.isMain) ?? gallery[0];
  const canSetFocus = !!mainImage?.url && !mainImage.uploading && !mainImage.error;

  const handleFocusChange = (focusX: number, focusY: number) => {
    onImagesChange(
      gallery.map((img) => (img.id === mainImage?.id ? { ...img, focusX, focusY } : img)),
    );
  };

  return (
    <StepShell embedded={embedded}>
        {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              completed ? "bg-origen-bosque text-white" : "bg-origen-pradera/10 text-origen-bosque"
            )}>
              {completed ? <CheckCircle className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Imágenes</h2>
              <p className="text-sm text-muted-foreground truncate">Añade fotos de tu producto</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {completed ? (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completado
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Pendiente
              </Badge>
            )}
            <Badge variant="leaf" size="sm" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Paso {stepPosition('images')} de {FORM_STEPS.length}
            </Badge>
          </div>
        </div>
        )}

        {/* Uploader */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-hoja-tinta" />
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">
                Galería de imágenes
              </Label>
              <span className="text-feedback-danger">*</span>
              {isPublishedProduct && (
                <div className="p-2 -m-2">
                  <SensitiveFieldIndicator fieldName="gallery" />
                </div>
              )}
            </div>
            <Tooltip
              content="Imágenes del producto"
              detailed={`Sube imagenes de alta calidad. La primera sera la principal. ${getImageQualityHint(IMAGE_QUALITY_PRESETS.productImage)}. Formatos: JPG, PNG, WebP. Maximo 5 imagenes, 10MB cada una.`}
              size="sm"
            />
          </div>
          <ImageStyleGuideline />
          <ImageUploader
            value={gallery}
            onChange={onImagesChange}
            maxFiles={5}
            maxSize={10}
            showMainBadge={true}
            uploadButtonText="Arrastra o haz clic para subir imágenes"
            qualityRequirement={IMAGE_QUALITY_PRESETS.productImage}
          />
        </div>

        {/* Punto focal de la imagen principal (recorte de las tarjetas) */}
        {canSetFocus && mainImage && (
          <div className="mt-6 border-t border-border pt-6">
            <ImageFocusPicker image={mainImage} onChange={handleFocusChange} />
          </div>
        )}
    </StepShell>
  );
}

