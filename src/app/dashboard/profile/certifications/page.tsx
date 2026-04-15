// 📁 /src/app/dashboard/profile/certifications/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { ProfileSectionNav } from '@/app/dashboard/profile/components/ProfileSectionNav';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { Button, Badge } from '@arcediano/ux-library';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { Progress } from '@arcediano/ux-library';
import { FileUpload, type UploadedFile } from '@/components/shared';
import { loadOnboardingData, saveCertificationDocuments } from '@/lib/api/onboarding';
import { uploadFile } from '@/lib/api/media';

// ─── Tipos locales ────────────────────────────────────────────────────────────

type DocStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';
type DocType = 'CIF' | 'SEGURO_RC' | 'MANIPULADOR_ALIMENTOS';

interface CertItem {
  certificationId: string;
  name: string;
  issuingBody: string;
  status: DocStatus | null; // null = no doc subido aún
  verifiedAt: string | null;
}

interface LegalDocItem {
  type: DocType;
  label: string;
  description: string;
  status: DocStatus | null;
  verifiedAt: string | null;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: DocStatus | null) {
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
  return <Badge variant="neutral" size="sm" className="w-fit">Pendiente de subir</Badge>;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<CertItem[]>([]);
  const [legalDocs, setLegalDocs] = useState<LegalDocItem[]>([]);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [savingFor, setSavingFor] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loadOnboardingData();

      // Certifications
      const certs: CertItem[] = (res.data.certifications ?? []).map((c) => ({
        certificationId: c.certificationId,
        name: c.name,
        issuingBody: c.issuingBody,
        status: c.documentDocId ? (c.status as DocStatus) : null,
        verifiedAt: c.verifiedAt ?? null,
      }));

      // Documentos legales obligatorios: construct from known types + merge API data
      const docMap = new Map<DocType, LegalDocItem>();
      for (const type of ['CIF', 'SEGURO_RC', 'MANIPULADOR_ALIMENTOS'] as DocType[]) {
        const meta = DOC_META[type];
        docMap.set(type, {
          type,
          label: meta.label,
          description: meta.description,
          status: null,
          verifiedAt: null,
          rejectedReason: null,
        });
      }
      for (const d of res.data.documents ?? []) {
        const existing = docMap.get(d.type as DocType);
        if (existing) {
          existing.status = d.status as DocStatus;
          existing.verifiedAt = d.verifiedAt ?? null;
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
  const verifiedCerts = certifications.filter(c => c.status === 'VERIFIED').length;
  const verifiedDocs = legalDocs.filter(d => d.status === 'VERIFIED').length;
  const totalItems = certifications.length + legalDocs.length;
  const overallProgress = totalItems > 0
    ? Math.round(((verifiedCerts + verifiedDocs) / totalItems) * 100)
    : 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">
        <PageHeader
          title="Certificaciones y documentos"
          description="Sube y gestiona tus certificados de calidad y la documentación obligatoria para acreditar tu tienda"
          badgeIcon={FileBadge}
          badgeText="Certificaciones"
          showBackButton={true}
          onBack={() => router.back()}
        />

        <ProfileSectionNav className="mt-3" />

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
                            {getStatusBadge(cert.status)}
                          </div>

                          {cert.status === 'VERIFIED' && cert.verifiedAt && (
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificada el {formatDate(cert.verifiedAt)}
                            </p>
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
                                Certificado rechazado. Por favor sube una nueva versión del documento.
                              </p>
                            </div>
                          )}

                          {(cert.status === null || cert.status === 'REJECTED') && (
                            <div className="mt-3">
                              {uploadingFor === cert.certificationId ? (
                                <FileUpload
                                  value={[]}
                                  onChange={(files) => handleCertUpload(cert.certificationId, files)}
                                  helperText="Sube el certificado en PDF, JPG o PNG (máx 5MB)"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  multiple={false}
                                  maxSize={5}
                                />
                              ) : (
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
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
                            {getStatusBadge(doc.status)}
                          </div>

                          {doc.status === 'VERIFIED' && doc.verifiedAt && (
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificado el {formatDate(doc.verifiedAt)}
                            </p>
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

                          {doc.status === 'VERIFIED' && (
                            <div className="mt-3 flex items-center gap-2 p-2 bg-surface rounded-lg">
                              <FileBadge className="w-4 h-4 text-text-subtle" />
                              <span className="text-sm text-muted-foreground flex-1">Documento subido</span>
                              <Button variant="ghost" size="icon-sm" aria-label="Ver documento">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" aria-label="Descargar documento">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          )}

                          {(doc.status === null || doc.status === 'REJECTED') && (
                            <div className="mt-3">
                              {uploadingFor === doc.type ? (
                                <FileUpload
                                  value={[]}
                                  onChange={(files) => handleLegalDocUpload(doc.type, files)}
                                  helperText="Sube el documento en PDF, JPG o PNG (máx 5MB)"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  multiple={false}
                                  maxSize={5}
                                />
                              ) : (
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
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
  );
}


