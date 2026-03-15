/**
 * @file file-upload.tsx
 * @description Componente de subida de archivos - Origen Marketplace v3.0
 * @version 1.0.0
 * @author Equipo de Desarrollo Origen
 *
 * Implementación según Manual de Marca v3.0 - Paleta "Bosque Profundo"
 *
 * @created Marzo 2026
 */

'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms/button';
import { Alert } from '@/components/ui/atoms/alert';

import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Download
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
}

export interface FileUploadProps {
  /** Archivos actualmente cargados */
  value: UploadedFile[];
  /** Callback cuando cambian los archivos */
  onChange: (files: UploadedFile[]) => void;
  /** Texto de ayuda para el usuario */
  helperText?: string;
  /** Tipos MIME aceptados (ej: "image/*", ".pdf", ".doc,.docx") */
  accept?: string;
  /** Si permite múltiples archivos */
  multiple?: boolean;
  /** Tamaño máximo en MB */
  maxSize?: number;
  /** Número máximo de archivos */
  maxFiles?: number;
  /** Clases CSS adicionales */
  className?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Texto personalizado para el botón de subida */
  buttonText?: string;
  /** Si mostrar previsualización de imágenes */
  showPreview?: boolean;
}

// ============================================================================
// UTILIDADES
// ============================================================================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const isImage = (type: string): boolean => {
  return type.startsWith('image/');
};

const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function FileUpload({
  value,
  onChange,
  helperText = 'Arrastra archivos o haz clic para subir',
  accept = '*/*',
  multiple = false,
  maxSize = 10,
  maxFiles = 10,
  className,
  disabled = false,
  buttonText = 'Subir archivos',
  showPreview = true,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Validar archivo
  const validateFile = useCallback(
    (file: File): string | null => {
      // Validar tamaño
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `El archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`;
      }

      // Validar tipo
      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const isValidType = acceptedTypes.some((type) => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.startsWith(type);
        });

        if (!isValidType) {
          return `El archivo ${file.name} no es un tipo válido`;
        }
      }

      return null;
    },
    [accept, maxSize]
  );

  // Procesar archivos
  const processFiles = useCallback(
    async (files: File[]) => {
      setError(null);
      const newFiles: UploadedFile[] = [];
      const errors: string[] = [];

      for (const file of files) {
        // Validar límite de archivos
        if (!multiple && newFiles.length + value.length >= 1) {
          errors.push('Solo se permite un archivo');
          break;
        }

        if (newFiles.length + value.length >= maxFiles) {
          errors.push(`Solo se permiten ${maxFiles} archivos como máximo`);
          break;
        }

        // Validar archivo
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(validationError);
          continue;
        }

        // Crear uploaded file
        const uploadedFile: UploadedFile = {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
        };

        // Crear preview para imágenes
        if (isImage(file.type) && showPreview) {
          uploadedFile.preview = await createPreview(file);
        }

        newFiles.push(uploadedFile);
      }

      if (errors.length > 0) {
        setError(errors[0]);
      }

      onChange([...value, ...newFiles]);
    },
    [value, onChange, validateFile, multiple, maxFiles, showPreview]
  );

  // Manejar drag & drop
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!disabled && e.dataTransfer.files) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    },
    [disabled, processFiles]
  );

  // Manejar input file
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(Array.from(e.target.files));
      }
      // Reset input
      e.target.value = '';
    },
    [processFiles]
  );

  // Eliminar archivo
  const handleRemoveFile = useCallback(
    (fileId: string) => {
      onChange(value.filter((f) => f.id !== fileId));
    },
    [value, onChange]
  );

  // Descargar archivo
  const handleDownloadFile = useCallback(
    (file: UploadedFile) => {
      const url = file.preview || URL.createObjectURL(file.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      if (!file.preview) {
        URL.revokeObjectURL(url);
      }
    },
    []
  );

  return (
    <div className={cn('w-full', className)}>
      {/* Área de subida */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200',
          isDragging
            ? 'border-origen-pradera bg-origen-pastel/50'
            : 'border-gray-300 hover:border-origen-pradera hover:bg-origen-crema/30',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        {/* Contenido del área de subida */}
        <div className="text-center">
          {/* Icono de subida con gradiente de marca */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md">
            <Upload className="w-8 h-8 text-white" />
          </div>

          {/* Título */}
          <h3 className="text-sm font-semibold text-origen-bosque mb-2">
            Sube tus archivos
          </h3>

          {/* Texto de ayuda */}
          <p className="text-xs text-gray-600 mb-4">
            {helperText}
          </p>

          {/* Información de límites */}
          <p className="text-[10px] text-gray-500 mb-4">
            Máximo {maxSize}MB por archivo • Máximo {maxFiles} archivos
          </p>

          {/* Botón de subida */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="border-origen-pradera text-origen-bosque hover:bg-origen-pastel/50"
          >
            {buttonText}
          </Button>
        </div>
      </div>

      {/* Error de validación */}
      {error && (
        <Alert
          variant="error"
          title="Error de validación"
          description={error}
          className="mt-3"
        />
      )}

      {/* Lista de archivos */}
      {value.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-origen-pradera" />
            Archivos cargados ({value.length}/{maxFiles})
          </p>

          {value.map((file) => (
            <div
              key={file.id}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-origen-pradera/30 transition-all"
            >
              {/* Preview o icono */}
              {file.preview && showPreview ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center flex-shrink-0">
                  {isImage(file.type) ? (
                    <ImageIcon className="w-8 h-8 text-origen-bosque" />
                  ) : (
                    <FileText className="w-8 h-8 text-origen-bosque" />
                  )}
                </div>
              )}

              {/* Información del archivo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-origen-oscuro truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadFile(file)}
                  className="text-gray-500 hover:text-origen-bosque h-8 w-8 p-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(file.id)}
                  className="text-gray-500 hover:text-red-600 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

FileUpload.displayName = 'FileUpload';
