/**
 * @file DocumentUploader.tsx
 * @description Componente para subir documentos
 */

'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// TIPOS - DEFINICIÓN ÚNICA (exportada para que product.ts la importe)
// ============================================================================

export interface DocumentFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  file?: File;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

export interface DocumentUploaderProps {
  value: DocumentFile[];
  onChange: (documents: DocumentFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedFormats?: string[];
  label?: string;
  showVerification?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function DocumentUploader({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 10,
  acceptedFormats = ['pdf', 'jpg', 'jpeg', 'png'],
  label = 'Documentos',
  showVerification = true,
  className,
}: DocumentUploaderProps) {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newDocuments: DocumentFile[] = acceptedFiles.map((file, index) => ({
      id: `doc-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      file,
      uploading: false,
      progress: 0,
    }));

    onChange([...value, ...newDocuments]);
  }, [value, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      if (format === 'pdf') acc['application/pdf'] = ['.pdf'];
      if (format === 'jpg' || format === 'jpeg') acc['image/jpeg'] = ['.jpg', '.jpeg'];
      if (format === 'png') acc['image/png'] = ['.png'];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles - value.length,
    maxSize: maxSize * 1024 * 1024,
    disabled: value.length >= maxFiles,
  });

  const handleRemove = (id: string) => {
    const docToRemove = value.find(doc => doc.id === id);
    if (docToRemove?.url.startsWith('blob:')) {
      URL.revokeObjectURL(docToRemove.url);
    }
    onChange(value.filter(doc => doc.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">
            {value.length} de {maxFiles}
          </span>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-4 transition-colors cursor-pointer',
          isDragActive
            ? 'border-origen-pradera bg-origen-pradera/5'
            : 'border-border hover:border-origen-pradera/50 hover:bg-surface',
          value.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <Upload className="w-6 h-6 text-text-subtle mb-1" />
          <p className="text-xs font-medium text-foreground">
            {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra o haz clic para subir'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {acceptedFormats.join(', ').toUpperCase()} hasta {maxSize}MB
          </p>
        </div>
      </div>

      {/* Lista de documentos */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-surface-alt rounded-lg border border-border hover:border-origen-pradera/30 transition-all group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-origen-pradera shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-[10px] text-text-subtle">{formatFileSize(doc.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {doc.uploading && (
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 text-origen-pradera animate-spin" />
                    <span className="text-[10px] text-muted-foreground">{doc.progress}%</span>
                  </div>
                )}
                {doc.error && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[10px]">{doc.error}</span>
                  </div>
                )}
                {showVerification && !doc.uploading && !doc.error && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                <button
                  onClick={() => handleRemove(doc.id)}
                  className="p-1 rounded-md text-text-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
