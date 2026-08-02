/**
 * @component StepImages
 * @description Paso 2: Imágenes del producto
 */

'use client';

import { Card } from '@arcediano/ux-library';
import { ImageUploader } from '../../components/ImageUploader';
import { Badge } from '@arcediano/ux-library';
import { Label } from '@arcediano/ux-library';
import { Tooltip } from '@arcediano/ux-library';
import {
  Camera,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGE_QUALITY_PRESETS, getImageQualityHint } from '@/lib/validations/image-quality';
import { motion } from 'framer-motion';
import type { ProductImage } from '@/types/product';
import { SENSITIVE_FIELD_LABELS } from '@/lib/constants/sensitiveFields';

interface StepImagesProps {
  gallery?: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  completed?: boolean;
  isPublishedProduct?: boolean;
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
  isPublishedProduct = false,
}: StepImagesProps) {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="p-4 sm:p-6">
        {/* Cabecera */}
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
              Paso 2 de 7
            </Badge>
          </div>
        </div>

        {/* Uploader */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-origen-pradera" />
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">
                Galería de imágenes
              </Label>
              <span className="text-red-500">*</span>
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
      </Card>
    </motion.div>
  );
}

