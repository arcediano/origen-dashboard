// ðŸ“ /src/app/dashboard/profile/certifications/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileBadge, 
  Shield, 
  Award, 
  Leaf,
  Globe,
  Heart,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Download,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { Button, Badge } from '@arcediano/ux-library';
import { Alert, AlertDescription } from '@arcediano/ux-library';
import { Progress } from '@arcediano/ux-library';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@arcediano/ux-library';
import { FileUpload, type UploadedFile } from '@/components/shared';

interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  description: string;
  icon: any;
  status: 'verified' | 'pending' | 'not_submitted';
  verifiedDate?: string;
  document?: UploadedFile;
}

interface LegalDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: 'verified' | 'pending' | 'not_submitted';
  document?: UploadedFile;
  expiryDate?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25
    }
  }
};

export default function CertificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('certifications');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // Datos mock
  const [certifications] = useState<Certification[]>([
    {
      id: '1',
      name: 'Agricultura EcolÃ³gica',
      issuingBody: 'CCAE / CAAE',
      description: 'Certificado oficial de producciÃ³n ecolÃ³gica',
      icon: Leaf,
      status: 'verified',
      verifiedDate: '15/01/2024'
    },
    {
      id: '2',
      name: 'DenominaciÃ³n de Origen',
      issuingBody: 'DOP Queso Payoyo',
      description: 'Producto con denominaciÃ³n de origen protegida',
      icon: Award,
      status: 'pending'
    },
    {
      id: '3',
      name: 'Bienestar Animal',
      issuingBody: 'Welfair',
      description: 'CertificaciÃ³n en bienestar animal',
      icon: Shield,
      status: 'verified',
      verifiedDate: '03/02/2024'
    },
    {
      id: '4',
      name: 'Comercio Justo',
      issuingBody: 'WFTO',
      description: 'PrÃ¡cticas de comercio Ã©tico y justo',
      icon: Globe,
      status: 'not_submitted'
    },
    {
      id: '5',
      name: 'Producto Artesano',
      issuingBody: 'Junta de AndalucÃ­a',
      description: 'Certificado de elaboraciÃ³n artesanal',
      icon: Heart,
      status: 'not_submitted'
    }
  ]);

  const [documents] = useState<LegalDocument[]>([
    {
      id: 'doc1',
      name: 'CIF / NIF',
      description: 'Documento de identificaciÃ³n fiscal',
      required: true,
      status: 'verified',
      document: { id: 'f1', name: 'cif_elgazpacho.pdf', size: 245760, type: 'application/pdf', url: '#' }
    },
    {
      id: 'doc2',
      name: 'Seguro de Responsabilidad Civil',
      description: 'MÃ­nimo 150.000â‚¬ de cobertura',
      required: true,
      status: 'verified',
      document: { id: 'f2', name: 'seguro_rc_2024.pdf', size: 524288, type: 'application/pdf', url: '#' }
    },
    {
      id: 'doc3',
      name: 'Manipulador de Alimentos',
      description: 'Certificado de formaciÃ³n',
      required: true,
      status: 'pending',
      document: { id: 'f3', name: 'manipulador_maria.pdf', size: 102400, type: 'application/pdf', url: '#' }
    },
    {
      id: 'doc4',
      name: 'Licencia de Actividad',
      description: 'Licencia municipal de apertura',
      required: false,
      status: 'not_submitted'
    }
  ]);

  const stats = {
    verifiedCerts: certifications.filter(c => c.status === 'verified').length,
    pendingCerts: certifications.filter(c => c.status === 'pending').length,
    verifiedDocs: documents.filter(d => d.status === 'verified').length,
    pendingDocs: documents.filter(d => d.status === 'pending').length,
    totalCerts: certifications.length,
    totalDocs: documents.length
  };

  const overallProgress = Math.round(
    ((stats.verifiedCerts + stats.verifiedDocs) / (stats.totalCerts + stats.totalDocs)) * 100
  );

  const handleFileUpload = (itemId: string, files: UploadedFile[]) => {
    if (files.length === 0) return;
    console.log('Subir archivo para:', itemId, files[0]);
    setUploadingFor(null);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'verified':
        return <Badge variant="success" size="sm" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verificado</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Pendiente de subir</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <PageHeader
        title="Certificaciones y Documentos"
        description="Gestiona tus certificaciones de calidad y documentaciÃ³n legal"
        badgeIcon={FileBadge}
        badgeText="VerificaciÃ³n"
        showBackButton={true}
        onBack={() => router.back()}
      />

      <div className="mt-8">
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Barra de progreso */}
          <Card className="border-origen-pradera/20 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-origen-bosque">Estado de verificaciÃ³n</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.verifiedCerts + stats.verifiedDocs} de {stats.totalCerts + stats.totalDocs} elementos verificados
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <Progress value={overallProgress} className="h-2.5" />
                  </div>
                  <span className="text-lg font-bold text-origen-pradera">{overallProgress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TABS - CORREGIDO: Usando las props icon y badge */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger 
                value="certifications"
              >
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Certificaciones
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
              >
                <span className="flex items-center gap-2">
                  <FileBadge className="w-4 h-4" />
                  Documentos legales
                </span>
              </TabsTrigger>
            </TabsList>

            {/* TAB: CERTIFICACIONES */}
            <TabsContent value="certifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-origen-pradera" />
                    Certificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {certifications.map(cert => {
                      const Icon = cert.icon;
                      return (
                        <div key={cert.id} className="border border-border rounded-xl p-4 hover:border-origen-pradera transition-all">
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-6 h-6 text-origen-pradera" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-origen-bosque">{cert.name}</h3>
                                  <p className="text-sm text-muted-foreground">{cert.issuingBody}</p>
                                </div>
                                {getStatusBadge(cert.status)}
                              </div>
                              
                              <p className="text-sm text-muted-foreground mt-2">{cert.description}</p>
                              
                              {cert.status === 'verified' && cert.verifiedDate && (
                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Verificada el {cert.verifiedDate}
                                </p>
                              )}
                              
                              {cert.status === 'pending' && (
                                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                  <p className="text-xs text-amber-700 flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    Tu certificado estÃ¡ siendo revisado. Te notificaremos cuando estÃ© verificado.
                                  </p>
                                </div>
                              )}
                              
                              {cert.status === 'not_submitted' && (
                                <div className="mt-3">
                                  {uploadingFor === cert.id ? (
                                    <FileUpload
                                      value={[]}
                                      onChange={(files) => handleFileUpload(cert.id, files)}
                                      helperText="Sube el certificado en PDF, JPG o PNG (mÃ¡x 5MB)"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      multiple={false}
                                      maxSize={5}
                                    />
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setUploadingFor(cert.id)}
                                    >
                                      <span className="flex items-center gap-2">
                                        <Upload className="w-3.5 h-3.5" />
                                        Subir certificado
                                      </span>
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: DOCUMENTOS LEGALES */}
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-origen-pradera" />
                    Documentos obligatorios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.filter(d => d.required).map(doc => (
                      <div key={doc.id} className="border border-border rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                            <FileBadge className="w-5 h-5 text-origen-pradera" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-origen-bosque">{doc.name}</h3>
                                <p className="text-sm text-muted-foreground">{doc.description}</p>
                              </div>
                              {getStatusBadge(doc.status)}
                            </div>
                            
                            {doc.document && (
                              <div className="mt-3 flex items-center gap-2 p-2 bg-surface rounded-lg">
                                <FileBadge className="w-4 h-4 text-text-subtle" />
                                <span className="text-sm text-muted-foreground flex-1">{doc.document.name}</span>
                                <Button variant="ghost" size="icon-sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon-sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            
                            {doc.status === 'not_submitted' && (
                              <div className="mt-3">
                                {uploadingFor === doc.id ? (
                                  <FileUpload
                                    value={[]}
                                    onChange={(files) => handleFileUpload(doc.id, files)}
                                    helperText="Sube el documento en PDF, JPG o PNG (mÃ¡x 5MB)"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple={false}
                                    maxSize={5}
                                  />
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setUploadingFor(doc.id)}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Upload className="w-3.5 h-3.5" />
                                      Subir documento
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileBadge className="w-5 h-5 text-origen-pradera" />
                    Documentos adicionales (opcionales)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.filter(d => !d.required).map(doc => (
                      <div key={doc.id} className="border border-border rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-origen-bosque">{doc.name}</h3>
                                <p className="text-sm text-muted-foreground">{doc.description}</p>
                              </div>
                              {getStatusBadge(doc.status)}
                            </div>
                            
                            {doc.status === 'not_submitted' && (
                              <div className="mt-3">
                                {uploadingFor === doc.id ? (
                                  <FileUpload
                                    value={[]}
                                    onChange={(files) => handleFileUpload(doc.id, files)}
                                    helperText="Sube el documento en PDF, JPG o PNG (mÃ¡x 5MB)"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple={false}
                                    maxSize={5}
                                  />
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setUploadingFor(doc.id)}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Upload className="w-3.5 h-3.5" />
                                      Subir documento
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
            </TabsContent>
          </Tabs>

          <Alert className="mt-6">
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Los documentos verificados aparecen con un sello de confianza en tu perfil pÃºblico, 
              lo que aumenta la credibilidad con los compradores.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </div>
  );
}

