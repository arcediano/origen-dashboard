/**
 * @file step-documents.tsx
 * @description Paso 4 del onboarding: documentación legal y certificaciones.
 *
 * El productor sube los 3 documentos legales (cada uno con su caducidad,
 * obligatoria) y DECLARA sus certificaciones del catálogo (cada una puede llevar
 * documento, opcional). Todo se rehidrata desde `GET onboarding/data`: lo ya
 * subido no hay que volver a subirlo y la caducidad se puede editar sin archivo nuevo.
 */

'use client';

import * as React from 'react';
import { Alert, Badge, DateInput, SelectableCard } from '@arcediano/ux-library';
import { FileUpload, type UploadedFile } from '@/components/shared';
import {
  CERTIFICATION_CATALOG,
  getCertificationName,
} from '@/lib/onboarding/certification-catalog';
import type {
  CertificationSlot,
  DocumentSlot,
  DocumentStatus,
  DocumentsData,
  LegalDocumentKey,
} from '@/lib/onboarding/types';
import { todayISO } from '@/lib/onboarding/validation';
import {
  Award,
  Clock,
  FileText,
  Globe,
  Heart,
  Leaf,
  Recycle,
  Shield,
  Sprout,
} from 'lucide-react';
import { FieldError, FileRow } from '../FormBits';
import { StepSection } from '../StepSection';

export type { DocumentsData as EnhancedDocumentsData };

const CERT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ecologico: Leaf,
  comercio_justo: Globe,
  denominacion_origen: Award,
  artesania: Heart,
  produccion_integrada: Sprout,
  bienestar_animal: Shield,
  agricultura_regenerativa: Recycle,
  sin_gluten: Leaf,
  vegano: Leaf,
};

const LEGAL_DOCS: Array<{ key: LegalDocumentKey; title: string; description: string }> = [
  { key: 'cif', title: 'CIF / NIF', description: 'El documento que identifica fiscalmente a tu negocio.' },
  { key: 'seguroRc', title: 'Seguro de responsabilidad civil', description: 'Cobertura mínima de 150.000 €. Es obligatorio para vender en Origen.' },
  { key: 'manipulador', title: 'Manipulador de alimentos', description: 'Necesario para cualquier productor de alimentos.' },
];

const STATUS_BADGE: Record<DocumentStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  VERIFIED: { label: 'Verificado', variant: 'success' },
  PENDING: { label: 'En revisión', variant: 'warning' },
  REJECTED: { label: 'Rechazado', variant: 'danger' },
  EXPIRED: { label: 'Caducado', variant: 'danger' },
};

const kb = (size: number) => (size > 0 ? `${(size / 1024).toFixed(1)} KB` : undefined);

interface DocumentFieldProps {
  idBase: string;
  title: string;
  description?: string;
  slot: DocumentSlot;
  onChange: (slot: DocumentSlot) => void;
  errors: Record<string, string>;
  /** Mostrar la insignia "Obligatorio" (documentos legales). */
  required?: boolean;
  uploadHelper?: string;
}

/** Un documento: subida (o archivo ya guardado) + caducidad. */
function DocumentField({ idBase, title, description, slot, onChange, errors, required, uploadHelper }: DocumentFieldProps) {
  const today = todayISO();
  const verified = slot.status === 'VERIFIED';
  const badge = slot.status ? STATUS_BADGE[slot.status] : undefined;
  const dateError = errors[`${idBase}-expires`];

  const handleUpload = (files: UploadedFile[]) => {
    if (files.length === 0) return;
    // Un archivo nuevo se revisa de nuevo: se descarta el estado/fecha del anterior.
    onChange({ file: { ...files[0], status: 'pending' }, expiresAt: undefined, originalExpiresAt: null, status: undefined });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-origen-bosque sm:text-base">{title}</h3>
          {required && !slot.file && <Badge variant="danger" size="xs">Obligatorio</Badge>}
          {slot.file && badge && <Badge variant={badge.variant} size="xs">{badge.label}</Badge>}
        </div>
        {description && <p className="mt-0.5 text-xs text-text-subtle sm:text-sm">{description}</p>}
      </div>

      {slot.status === 'REJECTED' && !slot.file && (
        <Alert variant="error">
          Este documento fue rechazado{slot.rejectedReason ? `: ${slot.rejectedReason}` : ''}. Sube uno nuevo.
        </Alert>
      )}
      {slot.status === 'EXPIRED' && !slot.file && (
        <Alert variant="warning">Este documento ha caducado. Sube la versión renovada.</Alert>
      )}

      <div id={idBase} tabIndex={-1} className="space-y-3 focus:outline-hidden">
        {slot.file ? (
          <>
            <FileRow
              name={slot.file.name}
              meta={[kb(slot.file.size), verified ? 'Verificado por Origen' : 'Pendiente de verificación'].filter(Boolean).join(' · ')}
              removeLabel={`Quitar el documento ${title}`}
              onRemove={() => onChange({})}
            />
            <div className="max-w-xs">
              <DateInput
                id={`${idBase}-expires`}
                label="Fecha de caducidad"
                required
                min={today}
                value={slot.expiresAt ?? ''}
                disabled={verified}
                onChange={(e) => onChange({ ...slot, expiresAt: e.target.value || undefined })}
                error={dateError}
                helperText={
                  verified
                    ? 'Documento verificado: para cambiar la caducidad, quítalo y sube el renovado.'
                    : 'Te avisaremos antes de que caduque.'
                }
              />
            </div>
          </>
        ) : (
          <FileUpload
            value={[]}
            onChange={handleUpload}
            helperText={uploadHelper ?? 'PDF, JPG o PNG · máx. 5 MB'}
            accept=".pdf,.jpg,.jpeg,.png"
            multiple={false}
            maxSize={5}
          />
        )}
        <FieldError>{errors[idBase]}</FieldError>
      </div>
    </div>
  );
}

export interface EnhancedStep4DocumentsProps {
  data: DocumentsData;
  onChange: (data: DocumentsData) => void;
  errors?: Record<string, string>;
}

export function EnhancedStep4Documents({ data, onChange, errors = {} }: EnhancedStep4DocumentsProps) {
  const setLegal = (key: LegalDocumentKey, slot: DocumentSlot) => onChange({ ...data, [key]: slot });

  const toggleCertification = (id: string) => {
    const existing = data.certifications.find((c) => c.certificationId === id);
    if (existing) {
      // Las verificadas por Origen solo las retira el equipo de Origen.
      if (existing.status === 'VERIFIED') return;
      onChange({ ...data, certifications: data.certifications.filter((c) => c.certificationId !== id) });
    } else {
      onChange({ ...data, certifications: [...data.certifications, { certificationId: id }] });
    }
  };

  const setCertification = (id: string, slot: DocumentSlot) =>
    onChange({
      ...data,
      certifications: data.certifications.map((c): CertificationSlot => (c.certificationId === id ? { certificationId: id, ...slot } : c)),
    });

  return (
    <div className="space-y-4">
      <Alert variant="info" className="items-start">
        <span className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Revisamos tus documentos en 24-48 h laborables. Mientras tanto puedes seguir completando tu tienda.</span>
        </span>
      </Alert>

      {/* ── Documentos legales ──────────────────────────────────────────── */}
      <StepSection
        icon={<FileText className="h-5 w-5" />}
        title="Documentos obligatorios"
        description="Necesarios para verificar tu negocio. Cada uno con su fecha de caducidad."
      >
        <div className="divide-y divide-border-subtle">
          {LEGAL_DOCS.map((doc) => (
            <div key={doc.key} className="py-4 first:pt-0 last:pb-0">
              <DocumentField
                idBase={`onb-doc-${doc.key}`}
                title={doc.title}
                description={doc.description}
                slot={data[doc.key]}
                onChange={(slot) => setLegal(doc.key, slot)}
                errors={errors}
                required
              />
            </div>
          ))}
        </div>
      </StepSection>

      {/* ── Certificaciones ─────────────────────────────────────────────── */}
      <StepSection
        icon={<Award className="h-5 w-5" />}
        title="Certificaciones"
        description="Opcional. Marca las que tengas: aparecerán en tu perfil cuando las verifiquemos. Puedes subir el certificado ahora o más tarde."
        badge={<Badge variant="neutral" size="xs">Opcional</Badge>}
      >
        <div role="group" aria-label="Certificaciones disponibles" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {CERTIFICATION_CATALOG.map((cert) => {
            const Icon = CERT_ICONS[cert.id] ?? Award;
            const slot = data.certifications.find((c) => c.certificationId === cert.id);
            return (
              <SelectableCard
                key={cert.id}
                layout="detailed"
                icon={<Icon className="h-5 w-5" />}
                label={cert.name}
                description={slot?.status === 'VERIFIED' ? 'Verificada por Origen' : cert.description}
                selected={Boolean(slot)}
                disabled={slot?.status === 'VERIFIED'}
                onSelect={() => toggleCertification(cert.id)}
              />
            );
          })}
        </div>

        {data.certifications.length > 0 && (
          <div className="mt-5 space-y-5 border-t border-border-subtle pt-5">
            {data.certifications.map((cert) => {
              const Icon = CERT_ICONS[cert.certificationId] ?? Award;
              return (
                <div key={cert.certificationId} className="space-y-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-origen-bosque">
                    <Icon className="h-4 w-4 text-hoja-tinta" aria-hidden="true" />
                    {getCertificationName(cert.certificationId)}
                  </p>
                  <DocumentField
                    idBase={`onb-cert-${cert.certificationId}`}
                    title="Certificado"
                    description="Adjunta el documento para que lo verifiquemos (opcional)."
                    slot={cert}
                    onChange={(slot) => setCertification(cert.certificationId, slot)}
                    errors={errors}
                    uploadHelper={`Sube el certificado de ${getCertificationName(cert.certificationId)} · PDF, JPG o PNG · máx. 5 MB`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </StepSection>
    </div>
  );
}

EnhancedStep4Documents.displayName = 'EnhancedStep4Documents';

export default EnhancedStep4Documents;
