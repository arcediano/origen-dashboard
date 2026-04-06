/**
 * @file ImageUploader.tsx
 * @description Componente para subir imágenes - USA ProductImage
 */

'use client';

import React, { useCallback, useState } from 'react';
import { type FileRejection, useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@arcediano/ux-library';
import {
  buildImageResolutionError,
  getImageDimensions,
  getImageQualityHint,
  type ImageQualityRequirement,
} from '@/lib/validations/image-quality';
import { Upload, X, Image as ImageIcon, Star } from 'lucide-react';
import { type ProductImage } from '@/types/product';

// ============================================================================
// TIPOS
// ============================================================================

export interface ImageUploaderProps {
  /** Array de imágenes (usa el mismo tipo que el producto) */
  value: ProductImage[];
  /** Callback cuando cambian las imágenes */
  onChange: (images: ProductImage[]) => void;
  /** Número máximo de archivos */
  maxFiles?: number;
  /** Tamaño máximo por archivo en MB */
  maxSize?: number;
  /** Mostrar badge de imagen principal */
  showMainBadge?: boolean;
  /** Texto del botón de subida */
  uploadButtonText?: string;
  /** Clase CSS adicional */
  className?: string;
  /** Aceptar solo imágenes */
  accept?: Record<string, string[]>;
  /** Regla de calidad de imagen para superficies publicas */
  qualityRequirement?: ImageQualityRequirement;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ImageUploader({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 10,
  showMainBadge = true,
  uploadButtonText = "Arrastra o haz clic para subir imágenes",
  className,
  qualityRequirement,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
  }
}: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);

    const newImages: ProductImage[] = [];
    const errors: string[] = [];

    for (const [index, file] of acceptedFiles.entries()) {
      let dimensions;

      if (qualityRequirement) {
        try {
          dimensions = await getImageDimensions(file);

          if (
            dimensions.width < qualityRequirement.minDimensions.width ||
            dimensions.height < qualityRequirement.minDimensions.height
          ) {
            errors.push(buildImageResolutionError(file.name, dimensions, qualityRequirement));
            continue;
          }
        } catch {
          errors.push(`No hemos podido comprobar la resolucion de "${file.name}". Intentalo con otra imagen.`);
          continue;
        }
      }

      newImages.push({
        id: `temp-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        url: URL.createObjectURL(file),
        file,
        isMain: value.length === 0 && index === 0,
        sortOrder: value.length + index,
        uploading: false,
        progress: 0,
        size: file.size,
        type: file.type,
        width: dimensions?.width,
        height: dimensions?.height,
      });
    }

    if (errors.length > 0) {
      setError(errors[0]);
    }

    if (newImages.length > 0) {
      onChange([...value, ...newImages]);
    }
  }, [qualityRequirement, value, onChange]);

  const handleDropRejected = useCallback((rejections: FileRejection[]) => {
    const firstRejection = rejections[0];
    const firstError = firstRejection?.errors[0];

    if (!firstError) {
      setError('No hemos podido subir esa imagen. Intentalo de nuevo.');
      return;
    }

    switch (firstError.code) {
      case 'file-too-large':
        setError(`La imagen "${firstRejection.file.name}" supera el limite de ${maxSize} MB.`);
        break;
      case 'too-many-files':
        setError(`Solo puedes subir hasta ${maxFiles} imagenes en este bloque.`);
        break;
      case 'file-invalid-type':
        setError(`El archivo "${firstRejection.file.name}" no tiene un formato valido. Usa JPG, PNG, WebP o GIF.`);
        break;
      default:
        setError(`No hemos podido subir "${firstRejection.file.name}". Revisa el archivo e intentalo de nuevo.`);
    }
  }, [maxFiles, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: handleDropRejected,
    accept,
    maxFiles: maxFiles - value.length,
    maxSize: maxSize * 1024 * 1024,
    disabled: value.length >= maxFiles,
  });

  const handleRemove = (id: string) => {
    const imageToRemove = value.find(img => img.id === id);
    if (imageToRemove?.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    onChange(value.filter(img => img.id !== id));
  };

  const handleSetMain = (id: string) => {
    onChange(value.map(img => ({
      ...img,
      isMain: img.id === id,
    })));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onChange(value.map(img =>
      img.id === id ? { ...img, caption } : img
    ));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer',
          isDragActive
            ? 'border-origen-pradera bg-origen-pradera/5'
            : 'border-border hover:border-origen-pradera/50 hover:bg-surface',
          value.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <Upload className="w-8 h-8 text-text-subtle mb-2" />
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? 'Suelta las imágenes aquí' : uploadButtonText}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WebP hasta {maxSize}MB
          </p>
          {qualityRequirement && (
            <p className="text-xs text-muted-foreground mt-1">
              {getImageQualityHint(qualityRequirement)}
            </p>
          )}
          <p className="text-xs text-text-subtle mt-2">
            {value.length} de {maxFiles} imágenes
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <AlertTitle>Imagen rechazada</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Grid de imágenes */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg border border-border overflow-hidden bg-surface"
            >
              {/* Imagen */}
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.alt || 'Producto'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-border" />
                </div>
              )}

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {showMainBadge && !image.isMain && (
                  <button
                    onClick={() => handleSetMain(image.id)}
                    className="p-1.5 bg-surface-alt rounded-lg hover:bg-origen-crema transition-colors"
                    title="Marcar como principal"
                  >
                    <Star className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => handleRemove(image.id)}
                  className="p-1.5 bg-surface-alt rounded-lg hover:bg-red-50 transition-colors"
                  title="Eliminar"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>

              {/* Badge de imagen principal */}
              {showMainBadge && image.isMain && (
                <div className="absolute top-1 left-1 bg-origen-pradera text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  Principal
                </div>
              )}

              {/* Indicador de subida */}
              {image.uploading && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-border">
                  <div
                    className="h-full bg-origen-pradera transition-all duration-300"
                    style={{ width: `${image.progress || 0}%` }}
                  />
                </div>
              )}

              {/* Input para caption */}
              <input
                type="text"
                value={image.caption || ''}
                onChange={(e) => handleCaptionChange(image.id, e.target.value)}
                placeholder="Añadir título..."
                className="absolute bottom-0 inset-x-0 p-1 text-[10px] bg-surface-alt/90 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
