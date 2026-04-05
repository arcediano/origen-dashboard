/**
 * @component StepImages
 * @description Paso 2: Imágenes del producto
 */

'use client';

import { Card } from '@origen/ux-library';
import { ImageUploader } from '../../components/ImageUploader';
import { Badge } from '@origen/ux-library';
import { Tooltip } from '@/components/ui/atoms/tooltip';
import { 
  Camera, 
  CheckCircle, 
  Sparkles,
  AlertCircle,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { ProductImage } from '@/types/product';

interface StepImagesProps {
  gallery?: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  completed?: boolean;
}

export function StepImages({ 
  gallery = [], 
  onImagesChange,
  completed 
}: StepImagesProps) {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" hoverEffect="organic" className="p-4 sm:p-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              completed ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white" : "bg-origen-pradera/10 text-origen-hoja"
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
              Paso 2 de 8
            </Badge>
          </div>
        </div>

        {/* Uploader */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-origen-pradera" />
            <span className="text-sm font-medium text-foreground">
              Galería de imágenes
              <span className="text-red-500 ml-1">*</span>
            </span>
            <Tooltip 
              content="Imágenes del producto"
              detailed="Sube imágenes de alta calidad. La primera será la principal. Formatos: JPG, PNG, WebP. Máximo 5 imágenes, 10MB cada una."
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
          />
        </div>
      </Card>
    </motion.div>
  );
}