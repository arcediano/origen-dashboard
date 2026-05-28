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
import { loadOnboardingData, saveCertificationDocuments } from '@/lib/api/onboarding';
import { uploadFile } from '@/lib/api/media';
import { 
  type DocStatus,
  countDocumentStates,
  hasDocumentReference,
  isExpiringSoon,
  shouldConfirmReplacement,
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

  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE_URL;
  if (!cdnBase || !documentRef) return null;

  const normalizedBase = cdnBase.endsWith('/') ? cdnBase.slice(0, -1) : cdnBase;
  const normalizedRef = documentRef.startsWith('/') ? documentRef.slice(1) : documentRef;
  return `${normalizedBase}/${normalizedRef}`;
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

  // Confirmación de reemplazo de documento verificado
  const [confirmReplace, setConfirmReplace] = useState<{
    id: string;
    label: string;
    kind: 'cert' | 'doc';
  } | null>(null);

  const handleOpenDocument = useCallback((documentRef: string | null, explicitUrl: string | null, download = false) => {
    const actionUrl = resolveDocumentUrl(documentRef, explicitUrl);

    if (!actionUrl) {
      setSaveError('No se pudo resolver la URL del documento. Contacta con soporte si el problema persiste.');
      return;
    }

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
      await saveCertificationDocuments({
        ...(type === 'CIF' && { cifKey: key }),
        ...(type === 'SEGURO_RC' && { seguroRcKey: key }),
        ...(type === 'MANIPULADOR_ALIMENTOS' && { manipuladorAlimentosKey: key }),
        certificationDocuments: [],
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
      await saveCertificationDocuments({
        certificationDocuments: [{ certificationId, documentKey: key }],
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

          {/* Aviso global — documentos caducados */}
          {!loading && !error && expiredCount > 0 && (
            <Alert variant="error">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>{expiredCount} documento{expiredCount > 1 ? 's' : ''} caducado{expiredCount > 1 ? 's' : ''}.</strong>{' '}
                Tus productos no serán visibles hasta que renueves la documentación y sea verificada.
              </AlertDescription>
            </Alert>
          )}

          {/* Aviso global — próximos a caducar */}
          {!loading && !error && expiringSoonCount > 0 && expiredCount === 0 && (
            <Alert variant="warning">
              <CalendarClock className="w-4 h-4" />
              <AlertDescription>
                <strong>{expiringSoonCount} documento{expiringSoonCount > 1 ? 's' : ''}</strong> caduca{expiringSoonCount === 1 ? '' : 'n'} en menos de {EXPIRING_SOON_DAYS} días.
                Renuévalos con antelación para evitar interrupciones.
              </AlertDescription>
            </Alert>
          )}

          {/* Barra de progreso */}
          {!loading && !error && (
            <Card className="border-origen-pradera/20">
              <CardContent className="p-6">
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

          {/* Certificaciones */}
          {!loading && !error && certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5 text-origen-pradera" />
                  Certificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    (() => {
                      const hasUploadedDocument = hasDocumentReference(cert.documentRef, cert.documentUrl);
                      const showUploadZone = uploadingFor === cert.certificationId;
                      const showUploadButton = !hasUploadedDocument && !showUploadZone;
                      return (
                    <div
                      key={cert.certificationId}
                      className="border border-border rounded-xl p-4 hover:border-origen-pradera transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-origen-pradera" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-origen-bosque">{cert.name}</h3>
                              <p className="text-sm text-muted-foreground">{cert.issuingBody}</p>
                            </div>
                            {getStatusBadge(cert.status, cert.expiresAt)}
                          </div>

                          {cert.status === 'VERIFIED' && cert.verifiedAt && (
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificada el {formatDate(cert.verifiedAt)}{cert.expiresAt && !isExpiringSoon(cert.expiresAt) && (<> · Válida hasta {formatDate(cert.expiresAt)}</>)}
                            </p>
                          )}

                          {cert.status === 'VERIFIED' && isExpiringSoon(cert.expiresAt) && (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-700 flex items-center gap-2">
                                <CalendarClock className="w-3.5 h-3.5" />
                                Este certificado caduca el {formatDate(cert.expiresAt)}. Renuévalo antes de esa fecha.
                              </p>
                            </div>
                          )}

                          {cert.status === 'EXPIRED' && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-xs text-red-700 flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Este certificado caducó el {formatDate(cert.expiresAt)}. Tus productos no serán visibles hasta que lo renueves y sea verificado.
                              </p>
                            </div>
                          )}

                          {cert.status === 'PENDING' && (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-700 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                Tu certificado está siendo revisado. Te notificaremos cuando esté verificado.
                              </p>
                            </div>
                          )}

                          {cert.status === 'REJECTED' && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-xs text-red-700 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {cert.rejectedReason ?? 'Certificado rechazado. Por favor sube una nueva versión del documento.'}
                              </p>
                            </div>
                          )}

                          {hasUploadedDocument && !showUploadZone && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 p-2 bg-surface rounded-lg">
                              <FileBadge className="w-4 h-4 text-text-subtle" />
                              <span className="text-sm text-muted-foreground flex-1">Documento subido</span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Ver documento"
                                onClick={() => handleOpenDocument(cert.documentRef, cert.documentUrl, false)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Descargar documento"
                                onClick={() => handleOpenDocument(cert.documentRef, cert.documentUrl, true)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={savingFor === cert.certificationId}
                                onClick={() => requestReplace(cert.certificationId, cert.name, 'cert', cert.status)}
                              >
                                <span className="flex items-center gap-2">
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  {savingFor === cert.certificationId ? 'Guardando…' : 'Reemplazar'}
                                </span>
                              </Button>
                            </div>
                          )}

                          {showUploadZone && (
                            <div className="mt-3">
                              <FileUpload
                                value={[]}
                                onChange={(files) => handleCertUpload(cert.certificationId, files)}
                                helperText="Sube el certificado en PDF, JPG o PNG (máx 5MB)"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple={false}
                                maxSize={5}
                              />
                            </div>
                          )}

                          {showUploadButton && (
                            <div className="mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={savingFor === cert.certificationId}
                                onClick={() => setUploadingFor(cert.certificationId)}
                              >
                                <span className="flex items-center gap-2">
                                  <Upload className="w-3.5 h-3.5" />
                                  {savingFor === cert.certificationId ? 'Guardando…' : 'Subir certificado'}
                                </span>
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

          {/* Documentos obligatorios */}
          {!loading && !error && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-origen-pradera" />
                  Documentos obligatorios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {legalDocs.map((doc) => (
                    (() => {
                      const hasUploadedDocument = hasDocumentReference(doc.documentRef, doc.documentUrl);
                      const showUploadZone = uploadingFor === doc.type;
                      const showUploadButton = !hasUploadedDocument && !showUploadZone;
                      return (
                    <div key={doc.type} className="border border-border rounded-xl p-4">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                          <FileBadge className="w-5 h-5 text-origen-pradera" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-origen-bosque">{doc.label}</h3>
                              <p className="text-sm text-muted-foreground">{doc.description}</p>
                            </div>
                            {getStatusBadge(doc.status, doc.expiresAt)}
                          </div>

                          {doc.status === 'VERIFIED' && doc.verifiedAt && (
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificado el {formatDate(doc.verifiedAt)}{doc.expiresAt && !isExpiringSoon(doc.expiresAt) && (<> · Válido hasta {formatDate(doc.expiresAt)}</>)}
                            </p>
                          )}

                          {doc.status === 'VERIFIED' && isExpiringSoon(doc.expiresAt) && (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-700 flex items-center gap-2">
                                <CalendarClock className="w-3.5 h-3.5" />
                                Este documento caduca el {formatDate(doc.expiresAt)}. Renuévalo antes de esa fecha.
                              </p>
                            </div>
                          )}

                          {doc.status === 'EXPIRED' && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-xs text-red-700 flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Este documento caducó el {formatDate(doc.expiresAt)}. Tus productos no serán visibles hasta que lo renueves y sea verificado.
                              </p>
                            </div>
                          )}

                          {doc.status === 'PENDING' && (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-700 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                Documento en revisión. Te avisaremos cuando esté verificado.
                              </p>
                            </div>
                          )}

                          {doc.status === 'REJECTED' && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-xs text-red-700 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {doc.rejectedReason ?? 'Documento rechazado. Sube una nueva versión.'}
                              </p>
                            </div>
                          )}

                          {hasUploadedDocument && !showUploadZone && (
                            <div className="mt-3 flex items-center gap-2 p-2 bg-surface rounded-lg">
                              <FileBadge className="w-4 h-4 text-text-subtle" />
                              <span className="text-sm text-muted-foreground flex-1">Documento subido</span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Ver documento"
                                onClick={() => handleOpenDocument(doc.documentRef, doc.documentUrl, false)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Descargar documento"
                                onClick={() => handleOpenDocument(doc.documentRef, doc.documentUrl, true)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={savingFor === doc.type}
                                onClick={() => requestReplace(doc.type, doc.label, 'doc', doc.status)}
                              >
                                <span className="flex items-center gap-2">
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  {savingFor === doc.type ? 'Guardando…' : 'Reemplazar'}
                                </span>
                              </Button>
                            </div>
                          )}

                          {showUploadZone && (
                            <div className="mt-3">
                              <FileUpload
                                value={[]}
                                onChange={(files) => handleLegalDocUpload(doc.type, files)}
                                helperText="Sube el documento en PDF, JPG o PNG (máx 5MB)"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple={false}
                                maxSize={5}
                              />
                            </div>
                          )}

                          {showUploadButton && (
                            <div className="mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={savingFor === doc.type}
                                onClick={() => setUploadingFor(doc.type)}
                              >
                                <span className="flex items-center gap-2">
                                  <Upload className="w-3.5 h-3.5" />
                                  {savingFor === doc.type ? 'Guardando…' : 'Subir documento'}
                                </span>
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


