// 📁 /src/components/forms/FileUpload.tsx
/**
 * @file FileUpload.tsx
 * @description Subida de archivos - VERSIÓN ULTRA MINIMALISTA
 * @version 5.0.0 - SIN borde en contenedor principal, solo área de drop
 */

'use client';

import * as React from 'react';
import { cn, formatFileSize } from '@/lib/utils';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  status?: 'pending' | 'verified' | 'rejected';
  error?: string;
}

export interface FileUploadProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  helperText?: string;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  value = [],
  onChange,
  helperText = 'Arrastra archivos o haz clic para subir',
  multiple = false,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 5,
  className,
  disabled = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => file.size <= maxSize * 1024 * 1024);
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending'
    }));

    onChange(multiple ? [...value, ...newFiles] : newFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (id: string) => {
    onChange(value.filter(file => file.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => file.size <= maxSize * 1024 * 1024);
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending'
    }));

    onChange(multiple ? [...value, ...newFiles] : newFiles);
  };

  const getFileIcon = (file: UploadedFile) => {
    if (file.type?.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-origen-pradera" />;
    }
    return <FileText className="w-5 h-5 text-origen-bosque" />;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'rejected': return <AlertCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'verified': return 'Verificado';
      case 'rejected': return 'Rechazado';
      default: return 'Pendiente';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      
      {/* ====================================================================
          ÁREA DE SUBIDA - Único elemento con borde
          SIN contenedor padre con borde adicional
      ==================================================================== */}
      <div
        className={cn(
          'relative rounded-xl border transition-all',
          isDragging
            ? 'border-origen-pradera bg-origen-pradera/5'
            : 'border-gray-200 hover:border-origen-pradera hover:bg-gray-50/50',
          disabled && 'opacity-50 pointer-events-none bg-gray-50',
          value.length === 0 ? 'p-8' : 'p-6'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full flex flex-col items-center text-center cursor-pointer disabled:cursor-not-allowed"
        >
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all',
            isDragging
              ? 'bg-origen-pradera text-white scale-110'
              : 'bg-origen-crema text-origen-bosque'
          )}>
            <Upload className="w-6 h-6" />
          </div>
          
          <p className="text-sm font-medium text-origen-bosque mb-1">
            {helperText}
          </p>
          
          <p className="text-xs text-gray-500">
            {accept.replace(/\./g, '').toUpperCase()} • Máx {maxSize}MB
          </p>
        </button>
      </div>

      {/* ====================================================================
          LISTA DE ARCHIVOS - Sin borde adicional
      ==================================================================== */}
      {value.length > 0 && (
        <div className="mt-4 space-y-2">
          {value.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-origen-bosque truncate">
                      {file.name}
                    </p>
                    
                    <span className={cn(
                      'text-xs flex items-center gap-1',
                      getStatusColor(file.status)
                    )}>
                      {getStatusIcon(file.status)}
                      {getStatusText(file.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                    {file.error && (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {file.error}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Eliminar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

FileUpload.displayName = 'FileUpload';

export default FileUpload;