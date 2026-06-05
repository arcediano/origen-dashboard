// 📁 /src/app/dashboard/profile/certifications/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileBadge,
  Shield,
  Award,
  CheckCircle,
  Clock,
  Upload,
  Download,
  Eye,
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { Button, Badge } from '@arcediano/ux-library';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { Progress } from '@arcediano/ux-library';
import { ConfirmDialog } from '@arcediano/ux-library';
import { FileUpload, type UploadedFile } from '@/components/shared';
import { loadOnboardingData, updateProducerDocument, updateProducerCertification } from '@/lib/api/onboarding';
import { uploadFile } from '@/lib/api/media';
import { 
  type DocStatus,
  countDocumentStates,
  hasDocumentReference,
  isExpiringSoon,
  shouldConfirmReplacement,
  daysUntilExpiry,
  EXPIRING_SOON_DAYS,
} from './certification-utils';

type DocType = 'CIF' | 'SEGURO_RC' | 'MANIPULADOR_ALIMENTOS';

interface CertItem {
  certificationId: string;
  name: string;
  issuingBody: string;
  documentRef: string | null;
  documentUrl: string | null;
  status: DocStatus | null; // null = no doc subido aún
  verifiedAt: string | null;
  expiresAt: string | null;
  rejectedReason: string | null;
}

interface LegalDocItem {
  type: DocType;
  label: string;
  description: string;
  documentRef: string | null;
  documentUrl: string | null;
  status: DocStatus | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  rejectedReason: string | null;
}

const DOC_META: Record<DocType, { label: string; description: string; category: string }> = {
  CIF: {
    label: 'CIF / NIF',
    description: 'Documento de identificación fiscal',
    category: 'documents/cif',
  },
  SEGURO_RC: {
    label: 'Seguro de Responsabilidad Civil',
    description: 'Mínimo 150.000€ de cobertura',
    category: 'documents/seguro-rc',
  },
  MANIPULADOR_ALIMENTOS: {
    label: 'Manipulador de Alimentos',
    description: 'Certificado de formación',
    category: 'documents/manipulador-alimentos',
  },
};

function getStatusBadge(status: DocStatus | null, expiresAt: string | null = null) {
  if (status === 'VERIFIED' && isExpiringSoon(expiresAt)) {
    const days = daysUntilExpiry(expiresAt);
    return (
      <Badge variant="warning" size="sm" className="flex items-center gap-1 w-fit">
        <CalendarClock className="w-3 h-3" />
        Caduca en {days} día{days !== 1 ? 's' : ''}
      </Badge>
    );
  }
  if (status === 'VERIFIED') {
    return (
      <Badge variant="success" size="sm" className="flex items-center gap-1 w-fit">
        <CheckCircle className="w-3 h-3" /> Verificado
      </Badge>
    );
  }
  if (status === 'PENDING') {
    return (
      <Badge variant="warning" size="sm" className="flex items-center gap-1 w-fit">
        <Clock className="w-3 h-3" /> En revisión
      </Badge>
    );
  }
  if (status === 'REJECTED') {
    return (
      <Badge variant="danger" size="sm" className="flex items-center gap-1 w-fit">
        <AlertCircle className="w-3 h-3" /> Rechazado
      </Badge>
    );
  }
  if (status === 'EXPIRED') {
    return (
      <Badge variant="danger" size="sm" className="flex items-center gap-1 w-fit">
        <AlertTriangle className="w-3 h-3" /> Caducado
      </Badge>
    );
  }
  return <Badge variant="neutral" size="sm" className="w-fit">Pendiente de subir</Badge>;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function resolveDocumentUrl(documentRef: string | null, explicitUrl: string | null): string | null {
  if (explicitUrl && /^https?:\/\//i.test(explicitUrl)) return explicitUrl;
  if (documentRef && /^https?:\/\//i.test(documentRef)) return documentRef;
  return null;
}

function getCardTone(status: DocStatus | null, expiresAt: string | null = null): string {
  if (status === 'EXPIRED' || status === 'REJECTED') {
    return 'border-red-200 bg-red-50/60';
  }
  if (status === 'VERIFIED' && isExpiringSoon(expiresAt)) {
    return 'border-amber-200 bg-amber-50/60';
  }
  if (status === 'VERIFIED') {
    return 'border-green-200 bg-green-50/50';
  }
  if (status === 'PENDING') {
    return 'border-amber-200 bg-amber-50/40';
  }
  return 'border-border-subtle bg-surface';
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<CertItem[]>([]);
  const [legalDocs, setLegalDocs] = useState<LegalDocItem[]>([]);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [savingFor, setSavingFor] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);

  // Fechas de caducidad para nuevos uploads
  const [expiresAtInputs, setExpiresAtInputs] = useState<Partial<Record<DocType, string>>>({});
  const [expiresAtCertInputs, setExpiresAtCertInputs] = useState<Record<string, string>>({});

  // Confirmación de reemplazo de documento verificado
  const [confirmReplace, setConfirmReplace] = useState<{
    id: string;
    label: string;
    kind: 'cert' | 'doc';
  } | null>(null);

  const handleOpenDocument = useCallback(async (documentRef: string | null, explicitUrl: string | null, download = false) => {
    setSaveError(null);
    let actionUrl = resolveDocumentUrl(documentRef, explicitUrl);

    // Ruta lenta: clave S3 privada → obtener URL prefirmada del servidor
    if (!actionUrl) {
      if (!documentRef) {
        setSaveError('No se encontró la referencia del documento.');
        return;
      }
      setOpeningDoc(documentRef);
      try {
        const res = await fetch(`/api/document-download?key=${encodeURIComponent(documentRef)}`);
        const data = await res.json();
        if (!res.ok || !data.downloadUrl) {
          // El fichero ya no existe en S3 — limpiar la referencia del estado para
          // que el UI muestre "Subir documento" en lugar de los botones Ver/Descargar.
          if (res.status === 404) {
            setSaveError('El documento ya no está disponible en el servidor. Por favor, súbelo de nuevo.');
            setCertifications((prev) =>
              prev.map((c) =>
                c.documentRef === documentRef ? { ...c, documentRef: null, documentUrl: null } : c,
              ),
            );
            setLegalDocs((prev) =>
              prev.map((d) =>
                d.documentRef === documentRef ? { ...d, documentRef: null, documentUrl: null } : d,
              ),
            );
          } else {
            setSaveError(data.message ?? 'No se pudo obtener la URL del documento.');
          }
          return;
        }
        actionUrl = data.downloadUrl;
      } catch {
        setSaveError('Error al intentar abrir el documento. Inténtalo de nuevo.');
        return;
      } finally {
        setOpeningDoc(null);
      }
    }

    if (!actionUrl) return;

    if (download) {
      const link = document.createElement('a');
      link.href = actionUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    window.open(actionUrl, '_blank', 'noopener,noreferrer');
  }, []);

  // ── Solicitar reemplazo — con aviso si el doc está verificado ────────────────
  const requestReplace = useCallback(
    (id: string, label: string, kind: 'cert' | 'doc', status: DocStatus | null) => {
      if (shouldConfirmReplacement(status)) {
        setConfirmReplace({ id, label, kind });
      } else {
        setUploadingFor(id);
      }
    },
    [],
  );

  const handleConfirmReplace = useCallback(() => {
    if (!confirmReplace) return;
    setUploadingFor(confirmReplace.id);
    setConfirmReplace(null);
  }, [confirmReplace]);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loadOnboardingData();

      // Certifications
      const certs: CertItem[] = (res.data.certifications ?? []).map((c) => ({
        status: c.status as DocStatus,
        certificationId: c.certificationId,
        name: c.name,
        issuingBody: c.issuingBody,
        documentRef: c.documentKey ?? c.documentDocId ?? null,
        documentUrl: c.documentUrl ?? null,
        verifiedAt: c.verifiedAt ?? null,
        expiresAt: c.expiresAt ?? null,
        rejectedReason: c.rejectedReason ?? null,
      }));

      // Documentos legales obligatorios: construct from known types + merge API data
      const docMap = new Map<DocType, LegalDocItem>();
      for (const type of ['CIF', 'SEGURO_RC', 'MANIPULADOR_ALIMENTOS'] as DocType[]) {
        const meta = DOC_META[type];
        docMap.set(type, {
          type,
          label: meta.label,
          description: meta.description,
          documentRef: null,
          documentUrl: null,
          status: null,
          verifiedAt: null,
          expiresAt: null,
          rejectedReason: null,
        });
      }
      for (const d of res.data.documents ?? []) {
        const existing = docMap.get(d.type as DocType);
        if (existing) {
          existing.documentRef = d.documentKey ?? d.docServiceId ?? null;
          existing.documentUrl = d.documentUrl ?? null;
          existing.status = d.status as DocStatus;
          existing.verifiedAt = d.verifiedAt ?? null;
          existing.expiresAt = d.expiresAt ?? null;
          existing.rejectedReason = d.rejectedReason ?? null;
        }
      }

      // Verificar existencia en S3 de todas las referencias privadas en paralelo.
      // Se hace antes del primer render para que los botones Ver/Descargar solo
      // aparezcan si el fichero realmente existe en almacenamiento.
      const s3CheckItems: Array<{ key: string; kind: 'cert'; certId: string } | { key: string; kind: 'doc'; type: DocType }> = [];

      for (const cert of certs) {
        if (cert.documentRef && isValidDocumentRef(cert.documentRef) && !/^https?:\/\//i.test(cert.documentRef)) {
          s3CheckItems.push({ key: cert.documentRef, kind: 'cert', certId: cert.certificationId });
        }
      }
      for (const [type, doc] of docMap.entries()) {
        if (doc.documentRef && isValidDocumentRef(doc.documentRef) && !/^https?:\/\//i.test(doc.documentRef)) {
          s3CheckItems.push({ key: doc.documentRef, kind: 'doc', type });
        }
      }

      if (s3CheckItems.length > 0) {
        const checkResults = await Promise.all(
          s3CheckItems.map(async (item) => {
            try {
              const r = await fetch(`/api/document-download?key=${encodeURIComponent(item.key)}`);
              return { item, exists: r.ok };
            } catch {
              return { item, exists: false };
            }
          }),
        );

        const missingCertIds = new Set<string>();
        const missingDocTypes = new Set<DocType>();

        for (const { item, exists } of checkResults) {
          if (!exists) {
            if (item.kind === 'cert') missingCertIds.add(item.certId);
            else missingDocTypes.add(item.type);
          }
        }

        if (missingCertIds.size > 0) {
          for (const cert of certs) {
            if (missingCertIds.has(cert.certificationId)) {
              cert.documentRef = null;
              cert.documentUrl = null;
            }
          }
        }
        if (missingDocTypes.size > 0) {
          for (const type of missingDocTypes) {
            const doc = docMap.get(type);
            if (doc) {
              doc.documentRef = null;
              doc.documentUrl = null;
            }
          }
        }
      }

      setCertifications(certs);
      setLegalDocs(Array.from(docMap.values()));
    } catch {
      setError('No se pudieron cargar los datos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ── Upload de documentos legales ────────────────────────────────────────────
  const handleLegalDocUpload = async (type: DocType, files: UploadedFile[]) => {
    if (files.length === 0) return;
    const nativeFile = (files[0] as unknown as { file?: File }).file;
    if (!nativeFile) return;

    setSavingFor(type);
    setSaveError(null);
    setUploadingFor(null);
    try {
      const { key } = await uploadFile(nativeFile, DOC_META[type].category);
      await updateProducerDocument(type, key, expiresAtInputs[type] ?? undefined);
      // Limpiar la fecha de caducidad después de subir
      setExpiresAtInputs((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
      await fetchData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el documento.');
    } finally {
      setSavingFor(null);
    }
  };

  // ── Upload de certificaciones ───────────────────────────────────────────────
  const handleCertUpload = async (certificationId: string, files: UploadedFile[]) => {
    if (files.length === 0) return;
    const nativeFile = (files[0] as unknown as { file?: File }).file;
    if (!nativeFile) return;

    setSavingFor(certificationId);
    setSaveError(null);
    setUploadingFor(null);
    try {
      const { key } = await uploadFile(nativeFile, `documents/certifications/${certificationId}`);
      await updateProducerCertification(
        certificationId,
        key,
        expiresAtCertInputs[certificationId] ?? undefined,
      );
      // Limpiar la fecha de caducidad después de subir
      setExpiresAtCertInputs((prev) => {
        const next = { ...prev };
        delete next[certificationId];
        return next;
      });
      await fetchData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el certificado.');
    } finally {
      setSavingFor(null);
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const certificationStats = countDocumentStates(certifications);
  const legalDocStats = countDocumentStates(legalDocs);
  const verifiedCerts = certificationStats.verified;
  const verifiedDocs = legalDocStats.verified;
  const pendingCount = certificationStats.pending + legalDocStats.pending;
  const rejectedCount = certificationStats.rejected + legalDocStats.rejected;
  const expiredCount = certificationStats.expired + legalDocStats.expired;
  const expiringSoonCount = certificationStats.expiringSoon + legalDocStats.expiringSoon;
  const totalItems = certifications.length + legalDocs.length;
  const overallProgress = totalItems > 0
    ? Math.round(((verifiedCerts + verifiedDocs) / totalItems) * 100)
    : 0;
  const today = new Date().toISOString().split('T')[0];
  const firstExpiredTarget = legalDocs.find((doc) => doc.status === 'EXPIRED')?.type
    ?? certifications.find((cert) => cert.status === 'EXPIRED')?.certificationId
    ?? null;
  const firstRejectedTarget = legalDocs.find((doc) => doc.status === 'REJECTED')?.type
    ?? certifications.find((cert) => cert.status === 'REJECTED')?.certificationId
    ?? null;
  const firstExpiringTarget = legalDocs.find((doc) => doc.status === 'VERIFIED' && isExpiringSoon(doc.expiresAt))?.type
    ?? certifications.find((cert) => cert.status === 'VERIFIED' && isExpiringSoon(cert.expiresAt))?.certificationId
    ?? null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="w-full">
      <PageHeader
        title="Certificaciones y documentos"
        description="Sube y gestiona tus certificados de calidad y la documentación obligatoria para acreditar tu tienda"
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">
        <div className="mt-6 space-y-6">
          {/* Error global de carga */}
          {error && (
            <Alert variant="error">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Error al guardar */}
          {saveError && (
            <Alert variant="error">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {/* Aviso global — documentos críticos */}
          {!loading && !error && expiredCount > 0 && (
            <Alert variant="error">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong>⚠️ Tienes {expiredCount} documento{expiredCount > 1 ? 's' : ''} caducado{expiredCount > 1 ? 's' : ''}.</strong>{' '}
                  Tu perfil y productos están ocultos en la plataforma hasta que renueves y sean verificados.
                </span>
                {firstExpiredTarget && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setUploadingFor(firstExpiredTarget)}
                  >
                    Ir al documento
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && rejectedCount > 0 && (
            <Alert variant="error">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong>{rejectedCount} documento{rejectedCount > 1 ? 's' : ''} ha{rejectedCount > 1 ? 'n' : ''} sido rechazado{rejectedCount > 1 ? 's' : ''}.</strong>{' '}
                  Revisa el motivo y sube el documento correcto.
                </span>
                {firstRejectedTarget && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setUploadingFor(firstRejectedTarget)}
                  >
                    Revisar
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && expiringSoonCount > 0 && expiredCount === 0 && (
            <Alert variant="warning">
              <CalendarClock className="w-4 h-4" />
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Tienes <strong>{expiringSoonCount} documento{expiringSoonCount > 1 ? 's' : ''}</strong> que caduca{expiringSoonCount === 1 ? '' : 'n'} en menos de {EXPIRING_SOON_DAYS} días. Renuévalos ahora para evitar interrupciones.
                </span>
                {firstExpiringTarget && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setUploadingFor(firstExpiringTarget)}
                  >
                    Renovar ahora
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Barra de progreso */}
          {!loading && !error && (
            <Card className="border-origen-pradera/20">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-origen-bosque">Estado de verificación</h3>
                      <p className="text-sm text-muted-foreground">
                        {verifiedCerts + verifiedDocs} de {totalItems} elementos verificados
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-full sm:w-48">
                        <Progress value={overallProgress} className="h-2.5" />
                      </div>
                      <span className="text-lg font-bold text-origen-pradera">{overallProgress}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {verifiedCerts + verifiedDocs > 0 && <Badge variant="success">✅ {verifiedCerts + verifiedDocs} verificados</Badge>}
                      {pendingCount > 0 && <Badge variant="warning">⏳ {pendingCount} en revisión</Badge>}
                      {rejectedCount > 0 && <Badge variant="danger">❌ {rejectedCount} rechazados</Badge>}
                      {expiredCount > 0 && <Badge variant="danger">⚠️ {expiredCount} caducados</Badge>}
                      {expiringSoonCount > 0 && <Badge variant="warning">🔔 {expiringSoonCount} próximos a caducar</Badge>}
                    </div>
                  </div>
                  {overallProgress === 100 && expiredCount === 0 && rejectedCount === 0 && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      Toda la documentación está en orden.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && (
            <Card className="border-border-subtle">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-semibold text-origen-bosque">Resumen documental</h3>
                    <p className="text-sm text-muted-foreground">
                      Revisa que esta validado, que sigue en revision y que necesita renovacion.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[36rem]">
                    <div className="rounded-xl border border-border-subtle bg-surface px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-text-subtle">Validados</p>
                      <p className="mt-1 text-xl font-semibold text-origen-bosque">{verifiedCerts + verifiedDocs}</p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-surface px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-text-subtle">En revisión</p>
                      <p className="mt-1 text-xl font-semibold text-origen-bosque">{pendingCount}</p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-surface px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-text-subtle">Caducados</p>
                      <p className="mt-1 text-xl font-semibold text-origen-bosque">{expiredCount}</p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-surface px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-text-subtle">Rechazados</p>
                      <p className="mt-1 text-xl font-semibold text-origen-bosque">{rejectedCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentación legal obligatoria */}
          {!loading && !error && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-origen-pradera" />
                  Documentación legal obligatoria
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estos 3 documentos son necesarios para operar en la plataforma.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {legalDocs.map((doc) => (
                    (() => {
                      const hasUploadedDocument = hasDocumentReference(doc.documentRef, doc.documentUrl);
                      const showUploadZone = uploadingFor === doc.type;
                      const showUploadButton = !hasUploadedDocument && !showUploadZone;
                      return (
                    <div
                      key={doc.type}
                      className={`rounded-2xl border p-4 transition-all ${getCardTone(doc.status, doc.expiresAt)}`}
                    >
                      <div className="flex flex-col gap-4 h-full">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                            <FileBadge className="w-6 h-6 text-origen-pradera" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-2">
                              <div>
                                <h3 className="font-semibold text-origen-bosque">{doc.label}</h3>
                                <p className="text-sm text-muted-foreground">{doc.description}</p>
                              </div>
                              <div role="status">{getStatusBadge(doc.status, doc.expiresAt)}</div>
                              {doc.expiresAt && (
                                <p className={`text-xs ${doc.status === 'EXPIRED' ? 'text-red-700' : isExpiringSoon(doc.expiresAt) ? 'text-amber-700' : 'text-muted-foreground'}`}>
                                  Caduca el {formatDate(doc.expiresAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                          {doc.status === 'VERIFIED' && doc.verifiedAt && (
                            <p className="text-xs text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificado el {formatDate(doc.verifiedAt)}
                            </p>
                          )}

                          {doc.status === 'REJECTED' && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>{doc.rejectedReason ?? 'Documento rechazado. Sube una nueva versión.'}</span>
                            </div>
                          )}

                          {doc.status === 'EXPIRED' && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>Este documento caducó el {formatDate(doc.expiresAt)}. Renuévalo para recuperar visibilidad.</span>
                            </div>
                          )}

                          {doc.status === 'PENDING' && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
                              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>Documento en revisión. Te avisaremos cuando esté verificado.</span>
                            </div>
                          )}

                          {hasUploadedDocument && !showUploadZone && (
                            <div className="mt-auto flex flex-wrap gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Ver documento ${doc.label}`}
                                disabled={openingDoc === doc.documentRef}
                                onClick={() => handleOpenDocument(doc.documentRef, doc.documentUrl, false)}
                              >
                                <Eye className="w-4 h-4 mr-2" />Ver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Descargar documento ${doc.label}`}
                                disabled={openingDoc === doc.documentRef}
                                onClick={() => handleOpenDocument(doc.documentRef, doc.documentUrl, true)}
                              >
                                <Download className="w-4 h-4 mr-2" />Descargar
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={savingFor === doc.type}
                                onClick={() => requestReplace(doc.type, doc.label, 'doc', doc.status)}
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-2" />Reemplazar
                              </Button>
                            </div>
                          )}

                          {showUploadZone && (
                            <div className="rounded-2xl border border-dashed border-origen-pradera/40 bg-origen-pradera/5 p-4 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-origen-bosque mb-1" htmlFor={`expires-${doc.type}`}>
                                  Fecha de caducidad del documento <span className="text-red-500">*</span>
                                </label>
                                <input
                                  id={`expires-${doc.type}`}
                                  type="date"
                                  min={today}
                                  value={expiresAtInputs[doc.type] ?? ''}
                                  onChange={(e) => setExpiresAtInputs((prev) => ({ ...prev, [doc.type]: e.target.value }))}
                                  className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-origen-pradera"
                                  required
                                />
                              </div>
                              <FileUpload
                                value={[]}
                                onChange={(files) => handleLegalDocUpload(doc.type, files)}
                                helperText="Arrastra o haz clic para seleccionar. PDF, JPG o PNG · Máx 5MB"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple={false}
                                maxSize={5}
                              />
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {savingFor === doc.type ? 'Subiendo documento…' : 'Arrastra o haz clic para seleccionar'}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setUploadingFor(null)}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}

                          {showUploadButton && (
                            <div className="mt-auto">
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={savingFor === doc.type}
                                onClick={() => setUploadingFor(doc.type)}
                              >
                                <Upload className="w-3.5 h-3.5 mr-2" />Subir documento
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                      );
                    })()
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificaciones */}
          {!loading && !error && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5 text-origen-pradera" />
                  Certificaciones de calidad
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Certificados de calidad que avalan tus productos.
                </p>
              </CardHeader>
              <CardContent>
                {certifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border-subtle bg-surface p-6 text-sm text-muted-foreground">
                    Aún no has declarado certificaciones de calidad en tu perfil.
                  </div>
                ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {certifications.map((cert) => (
                    (() => {
                      const hasUploadedDocument = hasDocumentReference(cert.documentRef, cert.documentUrl);
                      const showUploadZone = uploadingFor === cert.certificationId;
                      const showUploadButton = !hasUploadedDocument && !showUploadZone;
                      return (
                    <div
                      key={cert.certificationId}
                      className={`rounded-2xl border p-4 transition-all ${getCardTone(cert.status, cert.expiresAt)}`}
                    >
                      <div className="flex flex-col gap-4 h-full">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                            <Award className="w-6 h-6 text-origen-pradera" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-2">
                              <div>
                                <h3 className="font-semibold text-origen-bosque">{cert.name}</h3>
                                <p className="text-sm text-muted-foreground">{cert.issuingBody}</p>
                              </div>
                              <div role="status">{getStatusBadge(cert.status, cert.expiresAt)}</div>
                              {cert.expiresAt && (
                                <p className={`text-xs ${cert.status === 'EXPIRED' ? 'text-red-700' : isExpiringSoon(cert.expiresAt) ? 'text-amber-700' : 'text-muted-foreground'}`}>
                                  Caduca el {formatDate(cert.expiresAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          {cert.status === 'VERIFIED' && cert.verifiedAt && (
                            <p className="text-xs text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificada el {formatDate(cert.verifiedAt)}
                            </p>
                          )}

                          {cert.status === 'REJECTED' && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>{cert.rejectedReason ?? 'Certificado rechazado. Por favor sube una nueva versión del documento.'}</span>
                            </div>
                          )}

                          {cert.status === 'EXPIRED' && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>Este certificado caducó el {formatDate(cert.expiresAt)}. Renuévalo antes de volver a usarlo.</span>
                            </div>
                          )}

                          {cert.status === 'PENDING' && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
                              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>Tu certificado está siendo revisado. Te notificaremos cuando esté verificado.</span>
                            </div>
                          )}

                          {hasUploadedDocument && !showUploadZone && (
                            <div className="mt-auto flex flex-wrap gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Ver documento ${cert.name}`}
                                disabled={openingDoc === cert.documentRef}
                                onClick={() => handleOpenDocument(cert.documentRef, cert.documentUrl, false)}
                              >
                                <Eye className="w-4 h-4 mr-2" />Ver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Descargar documento ${cert.name}`}
                                disabled={openingDoc === cert.documentRef}
                                onClick={() => handleOpenDocument(cert.documentRef, cert.documentUrl, true)}
                              >
                                <Download className="w-4 h-4 mr-2" />Descargar
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={savingFor === cert.certificationId}
                                onClick={() => requestReplace(cert.certificationId, cert.name, 'cert', cert.status)}
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-2" />Reemplazar
                              </Button>
                            </div>
                          )}

                          {showUploadZone && (
                            <div className="rounded-2xl border border-dashed border-origen-pradera/40 bg-origen-pradera/5 p-4 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-origen-bosque mb-1" htmlFor={`expires-cert-${cert.certificationId}`}>
                                  Fecha de caducidad (opcional)
                                </label>
                                <input
                                  id={`expires-cert-${cert.certificationId}`}
                                  type="date"
                                  min={today}
                                  value={expiresAtCertInputs[cert.certificationId] ?? ''}
                                  onChange={(e) => setExpiresAtCertInputs((prev) => ({ ...prev, [cert.certificationId]: e.target.value }))}
                                  className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-origen-pradera"
                                />
                              </div>
                              <FileUpload
                                value={[]}
                                onChange={(files) => handleCertUpload(cert.certificationId, files)}
                                helperText="Arrastra o haz clic para seleccionar. PDF, JPG o PNG (máx 5MB)"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple={false}
                                maxSize={5}
                              />
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {savingFor === cert.certificationId ? 'Subiendo certificado…' : 'Arrastra o haz clic para seleccionar'}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setUploadingFor(null)}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}

                          {showUploadButton && (
                            <div className="mt-auto">
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={savingFor === cert.certificationId}
                                onClick={() => setUploadingFor(cert.certificationId)}
                              >
                                <Upload className="w-3.5 h-3.5 mr-2" />Subir certificado
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                      );
                    })()
                  ))}
                </div>)}
              </CardContent>
            </Card>
          )}

          {/* Skeleton de carga */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          <Alert className="mt-6">
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Los documentos verificados aparecen con un sello de confianza en tu perfil público,
              lo que aumenta la credibilidad con los compradores.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>

      {/* ── Dialog de confirmación de reemplazo ──────────────────────────────── */}
      <ConfirmDialog
        open={confirmReplace !== null}
        onOpenChange={(open) => { if (!open) setConfirmReplace(null); }}
        title="¿Reemplazar documento verificado?"
        description={confirmReplace?.label}
        icon={<AlertTriangle className="w-5 h-5" />}
        body="Al subir un nuevo documento, tus productos dejarán de ser visibles en la plataforma mientras el equipo de Origen revisa y verifica el nuevo archivo. El cambio deja al productor en PENDING_VERIFICATION y la verificación suele tardar entre 24 y 48 horas."
        highlightLabel="Impacto"
        highlightValue="Productos ocultos hasta nueva verificación"
        confirmLabel="Sí, reemplazar documento"
        confirmVariant="danger"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmReplace}
        onCancel={() => setConfirmReplace(null)}
      />
    </>
  );
}


