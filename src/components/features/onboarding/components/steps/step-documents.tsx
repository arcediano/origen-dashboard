// 📁 /src/components/onboarding/steps/EnhancedStep5Documents.tsx
/**
 * @file EnhancedStep5Documents.tsx
 * @description Paso 5: Documentación y Verificación de Certificaciones
 * @version 1.0.0 - Integración con certificaciones seleccionadas en paso 2
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { FileUpload, type UploadedFile } from '@/components/shared';
import { Button } from '@/components/ui/atoms/button';

import {
  FileText,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  Lock,
  Download,
  Eye,
  X,
  Leaf,
  Award,
  Globe,
  Heart,
  Sprout,
  Recycle
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface CertificationDocument extends UploadedFile {
  certificationId: string;
  certificationName: string;
  issuingBody: string;
}

export interface EnhancedStep5DocumentsData {
  // Documentos obligatorios
  cif?: UploadedFile;
  seguroRC?: UploadedFile;
  manipuladorAlimentos?: UploadedFile;
  
  // Certificaciones seleccionadas en paso 2
  certifications: CertificationDocument[];
  
  // Estado de verificación
  verificationStatus: 'pending' | 'partial' | 'complete';
}

export interface EnhancedStep5DocumentsProps {
  data: EnhancedStep5DocumentsData;
  onChange: (data: EnhancedStep5DocumentsData) => void;
  selectedCertifications?: Array<{
    id: string;
    name: string;
    issuingBody: string;
  }>;
}

// ============================================================================
// MAPA DE ICONOS POR CERTIFICACIÓN
// ============================================================================

const CERTIFICATION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'ecologico': Leaf,
  'comercio_justo': Globe,
  'denominacion_origen': Award,
  'artesania': Heart,
  'produccion_integrada': Sprout,
  'bienestar_animal': Shield,
  'agricultura_regenerativa': Recycle,
  'sin_gluten': Leaf,
  'vegano': Leaf
};

const getCertificationIcon = (certId: string): React.ComponentType<{ className?: string }> => {
  return CERTIFICATION_ICON_MAP[certId] || FileText;
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStep5Documents({ 
  data, 
  onChange,
  selectedCertifications = []
}: EnhancedStep5DocumentsProps) {

  // ========================================================================
  // VALIDACIÓN
  // ========================================================================
  
  const hasCif = Boolean(data.cif);
  const hasSeguro = Boolean(data.seguroRC);
  const hasManipulador = Boolean(data.manipuladorAlimentos);
  
  const verifiedCertifications = data.certifications?.filter(cert => cert.status === 'verified') || [];
  const pendingCertifications = data.certifications?.filter(cert => cert.status === 'pending') || [];
  
  const totalRequired = 3 + selectedCertifications.length;
  const completedRequired = [hasCif, hasSeguro, hasManipulador, ...verifiedCertifications].filter(Boolean).length;
  const progress = (completedRequired / totalRequired) * 100;
  
  const isComplete = hasCif && hasSeguro && hasManipulador && 
    selectedCertifications.length === verifiedCertifications.length;

  // ========================================================================
  // MANEJADORES
  // ========================================================================
  
  const handleInputChange = (field: keyof EnhancedStep5DocumentsData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleDocumentUpload = (field: 'cif' | 'seguroRC' | 'manipuladorAlimentos', files: UploadedFile[]) => {
    if (files.length > 0) {
      handleInputChange(field, {
        ...files[0],
        status: 'pending'
      });
    }
  };

  const handleCertificationUpload = (certId: string, certName: string, issuingBody: string, files: UploadedFile[]) => {
    if (files.length === 0) return;
    
    const newCertDocuments: CertificationDocument[] = files.map(file => ({
      ...file,
      certificationId: certId,
      certificationName: certName,
      issuingBody: issuingBody,
      status: 'pending'
    }));

    const existingDocs = data.certifications?.filter(doc => doc.certificationId !== certId) || [];
    
    handleInputChange('certifications', [...existingDocs, ...newCertDocuments]);
  };

  const handleDeleteDocument = (certId: string) => {
    handleInputChange('certifications', data.certifications?.filter(doc => doc.certificationId !== certId) || []);
  };

  const handleDeleteRequired = (field: 'cif' | 'seguroRC' | 'manipuladorAlimentos') => {
    handleInputChange(field, undefined);
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
            <span className="text-sm font-medium text-origen-hoja">Documentación y certificaciones</span>
          </div>
          <span className="text-sm font-semibold text-origen-pradera">{completedRequired}/{totalRequired}</span>
        </div>
        <div className="h-2.5 bg-origen-crema rounded-full overflow-hidden">
          <div 
            className="h-full bg-origen-pradera rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            Verificación: 24-48h hábiles tras recibir los documentos
          </p>
        </div>
      </div>

      {/* ====================================================================
          CARD 1: DOCUMENTOS OBLIGATORIOS
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Documentos obligatorios</h2>
            <p className="text-sm text-muted-foreground">Necesarios para verificar tu negocio</p>
          </div>
        </div>

        <div className="space-y-6">

          {/* CIF / NIF */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Shield className="w-4 h-4 text-origen-pradera flex-shrink-0" />
                  <h3 className="font-medium text-origen-bosque">CIF / NIF</h3>
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">Obligatorio</span>
                  {data.cif?.status === 'verified' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground ml-6">El documento que identifica fiscalmente a tu negocio</p>
              </div>
            </div>
            {data.cif ? (
              <div className="flex items-center justify-between p-4 bg-origen-crema/20 rounded-xl border border-origen-pradera/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-origen-pradera" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-origen-bosque truncate">{data.cif.name}</p>
                    <p className="text-xs text-muted-foreground">{(data.cif.size / 1024).toFixed(1)} KB · Pendiente de verificación</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleDeleteRequired('cif')} className="text-text-subtle hover:text-foreground flex-shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <FileUpload value={[]} onChange={(files) => handleDocumentUpload('cif', files)}
                helperText="PDF, JPG o PNG · Máx. 5 MB" accept=".pdf,.jpg,.jpeg,.png" multiple={false} maxSize={5} />
            )}
          </div>

          {/* Seguro de Responsabilidad Civil */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Shield className="w-4 h-4 text-origen-pradera flex-shrink-0" />
                  <h3 className="font-medium text-origen-bosque">Seguro RC</h3>
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">Obligatorio</span>
                  {data.seguroRC?.status === 'verified' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground ml-6">Seguro de responsabilidad civil. Mín. 150.000€. Requerido para operar en el marketplace.</p>
              </div>
            </div>
            {data.seguroRC ? (
              <div className="flex items-center justify-between p-4 bg-origen-crema/20 rounded-xl border border-origen-pradera/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-origen-pradera" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-origen-bosque truncate">{data.seguroRC.name}</p>
                    <p className="text-xs text-muted-foreground">{(data.seguroRC.size / 1024).toFixed(1)} KB · Pendiente de verificación</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleDeleteRequired('seguroRC')} className="text-text-subtle hover:text-foreground flex-shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <FileUpload value={[]} onChange={(files) => handleDocumentUpload('seguroRC', files)}
                helperText="PDF, JPG o PNG · Máx. 5 MB" accept=".pdf,.jpg,.jpeg,.png" multiple={false} maxSize={5} />
            )}
          </div>

          {/* Manipulador de Alimentos */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Shield className="w-4 h-4 text-origen-pradera flex-shrink-0" />
                  <h3 className="font-medium text-origen-bosque">Manipulador de alimentos</h3>
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">Obligatorio</span>
                  {data.manipuladorAlimentos?.status === 'verified' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground ml-6">Necesario para cualquier productor de alimentos</p>
              </div>
            </div>
            {data.manipuladorAlimentos ? (
              <div className="flex items-center justify-between p-4 bg-origen-crema/20 rounded-xl border border-origen-pradera/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-origen-pradera" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-origen-bosque truncate">{data.manipuladorAlimentos.name}</p>
                    <p className="text-xs text-muted-foreground">{(data.manipuladorAlimentos.size / 1024).toFixed(1)} KB · Pendiente de verificación</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleDeleteRequired('manipuladorAlimentos')} className="text-text-subtle hover:text-foreground flex-shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <FileUpload value={[]} onChange={(files) => handleDocumentUpload('manipuladorAlimentos', files)}
                helperText="PDF, JPG o PNG · Máx. 5 MB" accept=".pdf,.jpg,.jpeg,.png" multiple={false} maxSize={5} />
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARD 2: CERTIFICACIONES SELECCIONADAS
      ==================================================================== */}
      {selectedCertifications.length > 0 && (
        <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-origen-pradera" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-origen-bosque">Certificaciones seleccionadas</h2>
              <p className="text-sm text-muted-foreground">
                Sube los documentos para verificar tus certificaciones
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {selectedCertifications.map((cert) => {
              const IconComponent = getCertificationIcon(cert.id);
              const uploadedDoc = data.certifications?.find(doc => doc.certificationId === cert.id);
              const isVerified = uploadedDoc?.status === 'verified';
              const isPending = uploadedDoc?.status === 'pending';
              
              return (
                <div key={cert.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-origen-pradera" />
                      </div>
                      <div>
                        <h3 className="font-medium text-origen-bosque">{cert.name}</h3>
                        <p className="text-xs text-muted-foreground">{cert.issuingBody}</p>
                      </div>
                      {isVerified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verificado
                        </span>
                      )}
                      {isPending && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>

                  {uploadedDoc ? (
                    <div className="flex items-center justify-between p-4 bg-origen-crema/20 rounded-xl border border-origen-pradera/30">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-origen-pradera" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-origen-bosque truncate">{uploadedDoc.name}</p>
                          <p className="text-xs text-muted-foreground">{(uploadedDoc.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteDocument(cert.id)}
                        className="text-text-subtle hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <FileUpload
                      value={[]}
                      onChange={(files) => handleCertificationUpload(cert.id, cert.name, cert.issuingBody, files)}
                      helperText={`Sube el certificado de ${cert.name}`}
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple={false}
                      maxSize={5}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          CARD 3: RESUMEN DE VERIFICACIÓN
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-origen-pradera/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-origen-pradera" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-origen-bosque">Estado de verificación</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Documentos obligatorios:</span>
                <span className="font-medium text-origen-bosque">
                  {[hasCif, hasSeguro, hasManipulador].filter(Boolean).length}/3
                </span>
              </div>
              {selectedCertifications.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-origen-pradera" />
                  <span className="text-muted-foreground">Certificaciones:</span>
                  <span className="font-medium text-origen-bosque">
                    {verifiedCertifications.length}/{selectedCertifications.length}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Pendientes de verificación:</span>
                <span className="font-medium text-origen-bosque">
                  {pendingCertifications.length + 
                   (data.cif?.status === 'pending' ? 1 : 0) +
                   (data.seguroRC?.status === 'pending' ? 1 : 0) +
                   (data.manipuladorAlimentos?.status === 'pending' ? 1 : 0)}
                </span>
              </div>
            </div>
            
            {isComplete && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Todos los documentos han sido subidos correctamente! Los verificaremos en 24-48h.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          TRUST BADGES
      ==================================================================== */}
      <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Cifrado SSL 256-bit</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Verificación 24-48h</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Documentos seguros</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep5Documents.displayName = 'EnhancedStep5Documents';

export default EnhancedStep5Documents;
