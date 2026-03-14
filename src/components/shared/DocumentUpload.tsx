// 📁 /src/components/forms/DocumentUpload.tsx
/**
 * @file DocumentUpload.tsx
 * @description Subida de documentos - WRAPPER ESPECIALIZADO
 * @version 7.0.0 - SIN líneas discontinuas, bordes sólidos elegantes
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FileUpload, FileUploadProps, UploadedFile } from './FileUpload';
import { Shield, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface DocumentUploadProps extends Omit<FileUploadProps, 'helperText' | 'accept'> {
  title?: string;
  description?: string;
  showVerificationSummary?: boolean;
}

export function DocumentUpload({
  value = [],
  onChange,
  title = 'Documentación',
  description = 'Sube los documentos requeridos para verificar tu negocio',
  showVerificationSummary = true,
  multiple = true,
  maxSize = 5,
  className,
  disabled = false,
  ...props
}: DocumentUploadProps) {
  
  const verifiedCount = value.filter(doc => doc.status === 'verified').length;
  const pendingCount = value.filter(doc => doc.status === 'pending').length;
  const rejectedCount = value.filter(doc => doc.status === 'rejected').length;
  const totalCount = value.length;
  
  const isComplete = value.length > 0 && value.every(doc => doc.status === 'verified');

  return (
    <div className={cn('w-full space-y-5', className)}>
      
      {/* ====================================================================
          HEADER - Título + descripción + resumen
      ==================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-origen-bosque">
            {title}
            {totalCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({totalCount} {totalCount === 1 ? 'archivo' : 'archivos'})
              </span>
            )}
          </h3>
          
          {isComplete && (
            <span className="text-xs text-green-600 flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Verificado
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          {description}
        </p>
        
        {showVerificationSummary && totalCount > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            {verifiedCount > 0 && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {verifiedCount} verificados
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {pendingCount} pendientes
              </span>
            )}
            {rejectedCount > 0 && (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {rejectedCount} rechazados
              </span>
            )}
          </div>
        )}
      </div>

      {/* ====================================================================
          COMPONENTE BASE - FileUpload (SIN DASHED)
      ==================================================================== */}
      <FileUpload
        value={value}
        onChange={onChange}
        helperText="Arrastra documentos o haz clic para subir"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple={multiple}
        maxSize={maxSize}
        disabled={disabled}
        {...props}
      />

      {/* ====================================================================
          FOOTER - Información de verificación
      ==================================================================== */}
      <div className="flex items-start gap-2.5 pt-1 text-xs text-gray-500 border-t border-gray-100">
        <Shield className="w-3.5 h-3.5 text-origen-pradera flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-gray-600">
            <span className="font-medium text-origen-bosque">Verificación en 24-48h</span> • 
            Los documentos se revisan en horario laboral
          </p>
          <div className="flex items-center gap-2 text-gray-400">
            <Info className="w-3 h-3" />
            <span>Formatos: PDF, JPG, PNG • Máx 5MB</span>
          </div>
        </div>
      </div>
    </div>
  );
}

DocumentUpload.displayName = 'DocumentUpload';

export default DocumentUpload;