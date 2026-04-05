/**
 * @component StepCertificationsAttributes
 * @description Paso 7: Certificaciones y atributos - VERSIÃ“N CORREGIDA
 */

'use client';

import { Button, Input, Badge } from '@arcediano/ux-library';
import {
  Card, CardContent,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@arcediano/ux-library';
import { Checkbox } from '@arcediano/ux-library';
import { DocumentUploader } from '../../components/DocumentUploader';
import { Tooltip } from '@arcediano/ux-library';
import { 
  Award,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Plus,
  X,
  Eye,
  EyeOff,
  Tag,
  TreePine,
  FileText,
  Globe,
  Leaf,
  Info,
  Edit2,
  Save,
  Trash2,
  Calendar,
  Clock,
  Scan,
  ExternalLink,
  Star,
  Zap,
  Beef,
  Wheat,
  Droplet,
  Milk,
  Egg,
  Nut,
  Bean,
  Sprout,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { 
  Certification, 
  DynamicAttribute, 
  DocumentFile,
  CertificationStatus,
  CertificationCategory 
} from '@/types/product';

interface StepCertificationsAttributesProps {
  certifications?: Certification[];
  attributes?: DynamicAttribute[];
  onCertificationsChange: (certs: Certification[]) => void;
  onAttributesChange: (attrs: DynamicAttribute[]) => void;
  completed?: boolean;
  productCategory?: string;
}

// ============================================================================
// CERTIFICACIONES PREDEFINIDAS
// ============================================================================

const PREDEFINED_CERTIFICATIONS = [
  { 
    id: 'eu-organic', 
    name: 'Agricultura EcolÃ³gica UE', 
    body: 'ComitÃ© de Agricultura EcolÃ³gica',
    icon: <Leaf className="w-3 h-3" />,
    category: 'organic' as CertificationCategory,
    description: 'CertificaciÃ³n oficial de la UniÃ³n Europea para productos ecolÃ³gicos'
  },
  { 
    id: 'dop', 
    name: 'DenominaciÃ³n de Origen Protegida', 
    body: 'Oficina Europea de Propiedad Intelectual',
    icon: <Globe className="w-3 h-3" />,
    category: 'origin' as CertificationCategory,
    description: 'Reconoce productos con caracterÃ­sticas Ãºnicas debidas al terreno'
  },
  { 
    id: 'igp', 
    name: 'IndicaciÃ³n GeogrÃ¡fica Protegida', 
    body: 'Oficina Europea de Propiedad Intelectual',
    icon: <Globe className="w-3 h-3" />,
    category: 'origin' as CertificationCategory,
    description: 'Vincula el producto a una zona geogrÃ¡fica especÃ­fica'
  },
  { 
    id: 'iso-9001', 
    name: 'ISO 9001:2015', 
    body: 'AENOR',
    icon: <Award className="w-3 h-3" />,
    category: 'quality' as CertificationCategory,
    description: 'Sistema de gestiÃ³n de calidad certificado'
  },
  { 
    id: 'fairtrade', 
    name: 'Comercio Justo', 
    body: 'Fairtrade International',
    icon: <Award className="w-3 h-3" />,
    category: 'sustainability' as CertificationCategory,
    description: 'Garantiza condiciones laborales justas y comercio Ã©tico'
  },
  { 
    id: 'bio-suisse', 
    name: 'Bio Suisse', 
    body: 'Bio Suisse',
    icon: <Leaf className="w-3 h-3" />,
    category: 'organic' as CertificationCategory,
    description: 'EstÃ¡ndar suizo para productos ecolÃ³gicos'
  },
];

// ============================================================================
// EJEMPLOS DE ATRIBUTOS POR CATEGORÃA
// ============================================================================

const ATTRIBUTE_EXAMPLES: Record<string, Array<{ 
  name: string; 
  type: string; 
  example: string; 
  unit?: string;
  description: string;
  icon: React.ReactNode;
}>> = {
  quesos: [
    { 
      name: 'Tipo de leche', 
      type: 'text', 
      example: 'Oveja, Vaca, Cabra, Mezcla',
      description: 'Indica el origen de la leche utilizada',
      icon: <Milk className="w-4 h-4" />
    },
    { 
      name: 'Tiempo de curaciÃ³n', 
      type: 'number', 
      example: '12', 
      unit: 'meses',
      description: 'PerÃ­odo de maduraciÃ³n del queso',
      icon: <Clock className="w-4 h-4" />
    },
    { 
      name: 'MaduraciÃ³n', 
      type: 'text', 
      example: 'En cueva, CÃ¡mara, Bodega',
      description: 'MÃ©todo y lugar de maduraciÃ³n',
      icon: <Beef className="w-4 h-4" />
    },
    { 
      name: 'Textura', 
      type: 'text', 
      example: 'Crema, Pasta dura, Semiduro',
      description: 'Consistencia del queso',
      icon: <Beef className="w-4 h-4" />
    },
    { 
      name: 'Intensidad', 
      type: 'text', 
      example: 'Suave, Medio, Fuerte',
      description: 'Nivel de sabor',
      icon: <Zap className="w-4 h-4" />
    },
  ],
  vinos: [
    { 
      name: 'Variedad de uva', 
      type: 'text', 
      example: 'Tempranillo, Garnacha, AlbariÃ±o',
      description: 'Tipo de uva utilizado',
      icon: <Droplet className="w-4 h-4" />
    },
    { 
      name: 'AÃ±ada', 
      type: 'number', 
      example: '2020', 
      unit: 'aÃ±o',
      description: 'AÃ±o de la cosecha',
      icon: <Calendar className="w-4 h-4" />
    },
    { 
      name: 'Crianza', 
      type: 'text', 
      example: 'Joven, Crianza, Reserva, Gran Reserva',
      description: 'Tiempo y tipo de envejecimiento',
      icon: <Clock className="w-4 h-4" />
    },
    { 
      name: 'Barrica', 
      type: 'text', 
      example: '6 meses en roble francÃ©s',
      description: 'Tipo de madera y tiempo en barrica',
      icon: <Award className="w-4 h-4" />
    },
    { 
      name: 'GraduaciÃ³n', 
      type: 'number', 
      example: '13.5', 
      unit: '% vol',
      description: 'Porcentaje de alcohol',
      icon: <Zap className="w-4 h-4" />
    },
  ],
  aceites: [
    { 
      name: 'Variedad de aceituna', 
      type: 'text', 
      example: 'Arbequina, Picual, Hojiblanca',
      description: 'Tipo de aceituna utilizada',
      icon: <Droplet className="w-4 h-4" />
    },
    { 
      name: 'Acidez', 
      type: 'number', 
      example: '0.2', 
      unit: '%',
      description: 'Grado de acidez (mÃ¡ximo 0.8Â° para AOVE)',
      icon: <Beef className="w-4 h-4" />
    },
    { 
      name: 'ExtracciÃ³n', 
      type: 'text', 
      example: 'Primera prensada en frÃ­o',
      description: 'MÃ©todo de extracciÃ³n del aceite',
      icon: <Award className="w-4 h-4" />
    },
    { 
      name: 'Cosecha', 
      type: 'text', 
      example: 'Temprana, Tradicional',
      description: 'Momento de la recolecciÃ³n',
      icon: <Calendar className="w-4 h-4" />
    },
  ],
  mieles: [
    { 
      name: 'FloraciÃ³n', 
      type: 'text', 
      example: 'Azahar, Romero, Tomillo, Milflores',
      description: 'Tipo de flor de origen',
      icon: <Leaf className="w-4 h-4" />
    },
    { 
      name: 'Textura', 
      type: 'text', 
      example: 'LÃ­quida, Cremosa, Cristalizada',
      description: 'Consistencia de la miel',
      icon: <Droplet className="w-4 h-4" />
    },
    { 
      name: 'Origen botÃ¡nico', 
      type: 'text', 
      example: 'Bosque, MontaÃ±a, Dehesa',
      description: 'Entorno de las colmenas',
      icon: <TreePine className="w-4 h-4" />
    },
  ],
  embutidos: [
    { 
      name: 'Tipo de carne', 
      type: 'text', 
      example: 'Cerdo ibÃ©rico, Cerdo blanco',
      description: 'Raza y tipo de cerdo',
      icon: <Beef className="w-4 h-4" />
    },
    { 
      name: 'CuraciÃ³n', 
      type: 'number', 
      example: '24', 
      unit: 'meses',
      description: 'Tiempo de curaciÃ³n',
      icon: <Clock className="w-4 h-4" />
    },
    { 
      name: 'AlimentaciÃ³n', 
      type: 'text', 
      example: 'Bellota, Cebo de campo, Cebo',
      description: 'Tipo de alimentaciÃ³n del animal',
      icon: <Wheat className="w-4 h-4" />
    },
    { 
      name: 'Pieza', 
      type: 'text', 
      example: 'Paleta, JamÃ³n, Lomo, Chorizo',
      description: 'Tipo de pieza',
      icon: <Beef className="w-4 h-4" />
    },
  ],
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function StepCertificationsAttributes({ 
  certifications = [], 
  attributes = [],
  onCertificationsChange,
  onAttributesChange,
  completed,
  productCategory = 'general'
}: StepCertificationsAttributesProps) {
  
  const [activeTab, setActiveTab] = useState('certifications');
  const [showCertForm, setShowCertForm] = useState(false);
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [editingAttr, setEditingAttr] = useState<DynamicAttribute | null>(null);
  const [verifyingCert, setVerifyingCert] = useState<string | null>(null);
  const [showExampleTooltip, setShowExampleTooltip] = useState<string | null>(null);
  
  const [newCert, setNewCert] = useState<Partial<Certification>>({
    name: '',
    issuingBody: '',
    certificateNumber: '',
    status: 'pending',
    verified: false,
    documents: [],
  });
  
  const [newAttr, setNewAttr] = useState<Partial<DynamicAttribute>>({
    name: '',
    type: 'text',
    value: '',
    visible: true,
  });

  const categoryExamples = ATTRIBUTE_EXAMPLES[productCategory] || ATTRIBUTE_EXAMPLES.quesos;
  const isStepComplete = certifications.length > 0 || attributes.length > 0;

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const parseDateFromInput = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    return new Date(dateString);
  };

  // ============================================================================
  // HANDLERS CERTIFICACIONES
  // ============================================================================

  const handleAddCertification = () => {
    const cert: Certification = {
      id: `cert-${Date.now()}`,
      name: newCert.name || '',
      issuingBody: newCert.issuingBody || '',
      certificateNumber: newCert.certificateNumber,
      issueDate: newCert.issueDate ? new Date(newCert.issueDate) : undefined,
      expiryDate: newCert.expiryDate ? new Date(newCert.expiryDate) : undefined,
      status: newCert.status as CertificationStatus || 'pending',
      verified: false,
      documents: newCert.documents || [],
      verificationUrl: newCert.verificationUrl,
      category: newCert.category as CertificationCategory,
    };

    onCertificationsChange([...certifications, cert]);
    resetCertForm();
  };

  const handleUpdateCertification = () => {
    if (!editingCert) return;

    const updated = certifications.map(cert =>
      cert.id === editingCert.id
        ? { 
            ...cert, 
            ...newCert,
            issueDate: newCert.issueDate ? new Date(newCert.issueDate) : undefined,
            expiryDate: newCert.expiryDate ? new Date(newCert.expiryDate) : undefined,
          }
        : cert
    );

    onCertificationsChange(updated);
    resetCertForm();
  };

  const handleDeleteCertification = (id: string) => {
    onCertificationsChange(certifications.filter(c => c.id !== id));
  };

  const handleVerifyCertification = (id: string) => {
    setVerifyingCert(id);
    
    setTimeout(() => {
      const updated = certifications.map(cert =>
        cert.id === id ? { ...cert, verified: true, status: 'active' as CertificationStatus } : cert
      );
      onCertificationsChange(updated);
      setVerifyingCert(null);
    }, 1500);
  };

  const handleDocumentsChange = (certId: string, docs: DocumentFile[]) => {
    const updated = certifications.map(cert =>
      cert.id === certId ? { ...cert, documents: docs } : cert
    );
    onCertificationsChange(updated);
  };

  const resetCertForm = () => {
    setNewCert({
      name: '',
      issuingBody: '',
      certificateNumber: '',
      status: 'pending',
      verified: false,
      documents: [],
    });
    setShowCertForm(false);
    setEditingCert(null);
  };

  // ============================================================================
  // HANDLERS ATRIBUTOS
  // ============================================================================

  const handleAddAttribute = () => {
    if (!newAttr.name) return;

    const attr: DynamicAttribute = {
      id: `attr-${Date.now()}`,
      name: newAttr.name,
      type: newAttr.type as 'text' | 'number' | 'boolean' | 'date',
      value: newAttr.type === 'boolean' ? false : newAttr.value || '',
      unit: newAttr.unit,
      visible: newAttr.visible ?? true,
    };

    onAttributesChange([...attributes, attr]);
    resetAttrForm();
  };

  const handleUpdateAttribute = () => {
    if (!editingAttr) return;

    const updated = attributes.map(attr =>
      attr.id === editingAttr.id ? { ...attr, ...newAttr } : attr
    );

    onAttributesChange(updated);
    resetAttrForm();
  };

  const handleDeleteAttribute = (id: string) => {
    onAttributesChange(attributes.filter(a => a.id !== id));
  };

  const handleToggleAttributeVisibility = (id: string) => {
    const updated = attributes.map(attr =>
      attr.id === id ? { ...attr, visible: !attr.visible } : attr
    );
    onAttributesChange(updated);
  };

  const resetAttrForm = () => {
    setNewAttr({
      name: '',
      type: 'text',
      value: '',
      visible: true,
    });
    setShowAttrForm(false);
    setEditingAttr(null);
  };

  const applyExample = (example: any) => {
    setNewAttr({
      name: example.name,
      type: example.type,
      value: '',
      unit: example.unit,
      visible: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="p-4 sm:p-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isStepComplete ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white" : "bg-origen-pradera/10 text-origen-hoja"
            )}>
              {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Certificaciones y atributos</h2>
              <p className="text-sm text-muted-foreground truncate">AÃ±ade sellos de calidad y caracterÃ­sticas</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="leaf" size="sm" className="bg-origen-pradera/10">
              {certifications.length} certificaciones
            </Badge>
            <Badge variant="info" size="sm" className="bg-blue-50 text-blue-700 border-blue-200">
              {attributes.filter(a => a.visible).length} atributos
            </Badge>
            {isStepComplete ? (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completado
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Pendiente
              </Badge>
            )}
            <Badge variant="leaf" size="sm" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Paso 7 de 8
            </Badge>
          </div>
        </div>

        {/* PestaÃ±as */}
        <div className="mb-6 border-b border-border overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {[
              { id: 'certifications', label: 'Certificaciones', icon: <Award className="w-4 h-4" /> },
              { id: 'attributes', label: 'Atributos', icon: <Tag className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative flex items-center gap-2",
                  activeTab === tab.id 
                    ? 'text-origen-pradera border-b-2 border-origen-pradera' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* TAB CERTIFICACIONES */}
          {activeTab === 'certifications' && (
            <motion.div
              key="certifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Mensaje informativo */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Certificaciones verificadas</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Sube los documentos acreditativos para que podamos verificar tus certificaciones. 
                    Una vez verificadas, aparecerÃ¡ un sello de confianza en tu producto.
                  </p>
                </div>
              </div>

              {/* BotÃ³n aÃ±adir certificaciÃ³n */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    resetCertForm();
                    setShowCertForm(!showCertForm);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {showCertForm ? 'Cancelar' : 'Nueva certificaciÃ³n'}
                </Button>
              </div>

              {/* Formulario de certificaciÃ³n */}
              <AnimatePresence>
                {showCertForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-origen-crema/30 rounded-xl border-2 border-origen-pradera/20 mb-4">
                      <h4 className="text-sm font-medium text-origen-bosque mb-4">
                        {editingCert ? 'Editar certificaciÃ³n' : 'Nueva certificaciÃ³n'}
                      </h4>

                      {/* Certificaciones predefinidas */}
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">Selecciona una certificaciÃ³n comÃºn:</p>
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_CERTIFICATIONS.map((cert) => (
                            <button
                              key={cert.id}
                              onClick={() => setNewCert({
                                ...newCert,
                                name: cert.name,
                                issuingBody: cert.body,
                                category: cert.category,
                              })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-alt rounded-full border border-border hover:border-origen-pradera hover:bg-origen-crema/30 transition-all text-xs"
                              title={cert.description}
                            >
                              <span className="text-origen-pradera">{cert.icon}</span>
                              {cert.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={newCert.name}
                            onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                            placeholder="Nombre de la certificaciÃ³n"
                            className="h-11 rounded-xl"
                          />
                          <Input
                            value={newCert.issuingBody}
                            onChange={(e) => setNewCert({ ...newCert, issuingBody: e.target.value })}
                            placeholder="Organismo emisor"
                            className="h-11 rounded-xl"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={newCert.certificateNumber || ''}
                            onChange={(e) => setNewCert({ ...newCert, certificateNumber: e.target.value })}
                            placeholder="NÃºmero de certificado"
                            className="h-11 rounded-xl"
                          />
                          <Select
                            value={newCert.status}
                            onValueChange={(v) => setNewCert({ ...newCert, status: v as CertificationStatus })}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Activo</SelectItem>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="expired">Caducado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Fecha emisiÃ³n</p>
                            <Input
                              type="date"
                              value={formatDateForInput(newCert.issueDate)}
                              onChange={(e) => setNewCert({ ...newCert, issueDate: parseDateFromInput(e.target.value) })}
                              className="h-11 rounded-xl"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Fecha caducidad</p>
                            <Input
                              type="date"
                              value={formatDateForInput(newCert.expiryDate)}
                              onChange={(e) => setNewCert({ ...newCert, expiryDate: parseDateFromInput(e.target.value) })}
                              className="h-11 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Documentos */}
                        <DocumentUploader
                          value={newCert.documents || []}
                          onChange={(docs) => setNewCert({ ...newCert, documents: docs })}
                          maxFiles={3}
                          maxSize={5}
                          acceptedFormats={['pdf', 'jpg', 'jpeg', 'png']}
                          label="Documentos acreditativos"
                          showVerification={false}
                        />

                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={resetCertForm}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={editingCert ? handleUpdateCertification : handleAddCertification}
                            disabled={!newCert.name || !newCert.issuingBody}
                            leftIcon={<Save className="w-4 h-4" />}
                          >
                            {editingCert ? 'Actualizar' : 'Guardar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lista de certificaciones */}
              {certifications.length > 0 && (
                <div className="space-y-3">
                  <AnimatePresence>
                    {certifications.map((cert) => (
                      <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all",
                          cert.verified 
                            ? "border-green-200 bg-green-50/30" 
                            : "border-border bg-surface-alt hover:border-origen-pradera/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            cert.verified ? "bg-green-100" : "bg-origen-crema"
                          )}>
                            <Award className={cn(
                              "w-5 h-5",
                              cert.verified ? "text-green-600" : "text-origen-pradera"
                            )} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-semibold text-origen-bosque">
                                    {cert.name}
                                  </h4>
                                  {cert.verified ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                                      <CheckCircle className="w-3 h-3" />
                                      Verificada
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock className="w-3 h-3" />
                                      Pendiente
                                    </span>
                                  )}
                                  {cert.status === 'expired' && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-feedback-danger-subtle text-red-700 border border-red-200">
                                      <AlertCircle className="w-3 h-3" />
                                      Caducada
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{cert.issuingBody}</p>
                              </div>

                              <div className="flex items-center gap-1">
                                {!cert.verified && cert.documents && cert.documents.length > 0 && (
                                  <button
                                    onClick={() => handleVerifyCertification(cert.id)}
                                    disabled={verifyingCert === cert.id}
                                    className="p-1.5 rounded-md text-origen-pradera hover:bg-origen-pradera/10 transition-colors"
                                    title="Verificar"
                                  >
                                    {verifyingCert === cert.id ? (
                                      <div className="w-4 h-4 border-2 border-origen-pradera border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Scan className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingCert(cert);
                                    setNewCert({
                                      ...cert,
                                      issueDate: cert.issueDate,
                                      expiryDate: cert.expiryDate,
                                    });
                                    setShowCertForm(true);
                                  }}
                                  className="p-1.5 rounded-md text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCertification(cert.id)}
                                  className="p-1.5 rounded-md text-text-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {cert.certificateNumber && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                NÂº {cert.certificateNumber}
                              </p>
                            )}

                            {/* Documentos */}
                            {cert.documents && cert.documents.length > 0 && (
                              <div className="mt-3">
                                <p className="text-[10px] text-muted-foreground mb-1">Documentos:</p>
                                <div className="flex flex-wrap gap-2">
                                  {cert.documents.map(doc => (
                                    <a
                                      key={doc.id}
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt rounded-lg border border-border text-[10px] text-muted-foreground hover:border-origen-pradera transition-colors"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {doc.name}
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {certifications.length === 0 && !showCertForm && (
                <div className="text-center py-8 bg-origen-crema/20 rounded-xl border-2 border-dashed border-origen-pradera/30">
                  <Award className="w-12 h-12 text-origen-pradera/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No hay certificaciones</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                    AÃ±ade certificaciones para aumentar la confianza de tus clientes y diferenciar tu producto
                  </p>
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowCertForm(true)}
                    leftIcon={<Plus className="w-3 h-3" />}
                  >
                    AÃ±adir certificaciÃ³n
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB ATRIBUTOS */}
          {activeTab === 'attributes' && (
            <motion.div
              key="attributes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* ExplicaciÃ³n de atributos */}
              <div className="p-4 bg-origen-crema/30 rounded-xl border border-origen-pradera/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-origen-pradera shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-origen-bosque">Â¿QuÃ© son los atributos?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Los atributos son caracterÃ­sticas especÃ­ficas de tu producto que no aparecen en otros campos.
                      Ayudan a los clientes a encontrar tu producto y a tomar decisiones de compra.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ejemplos por categorÃ­a */}
              <div>
                <p className="text-sm font-medium text-origen-bosque mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-origen-pradera" />
                  Atributos comunes para {productCategory}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryExamples.map((example, idx) => (
                    <div
                      key={idx}
                      className="relative p-4 bg-surface-alt rounded-xl border border-border hover:border-origen-pradera/30 transition-all cursor-pointer group"
                      onClick={() => applyExample(example)}
                      onMouseEnter={() => setShowExampleTooltip(example.name)}
                      onMouseLeave={() => setShowExampleTooltip(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-origen-crema flex items-center justify-center shrink-0">
                          {example.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-origen-bosque">{example.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-origen-pradera">
                            <span>Ej: {example.example}{example.unit ? ` ${example.unit}` : ''}</span>
                          </div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {showExampleTooltip === example.name && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute -top-2 right-4 z-10"
                          >
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-origen-oscuro text-white text-[10px] rounded shadow-lg">
                              <Plus className="w-3 h-3" />
                              Click para usar
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* BotÃ³n aÃ±adir atributo */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    resetAttrForm();
                    setShowAttrForm(!showAttrForm);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {showAttrForm ? 'Cancelar' : 'Atributo personalizado'}
                </Button>
              </div>

              {/* Formulario de atributo */}
              <AnimatePresence>
                {showAttrForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-origen-crema/30 rounded-xl border-2 border-origen-pradera/20 mb-4">
                      <h4 className="text-sm font-medium text-origen-bosque mb-4">
                        {editingAttr ? 'Editar atributo' : 'Nuevo atributo personalizado'}
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={newAttr.name}
                            onChange={(e) => setNewAttr({ ...newAttr, name: e.target.value })}
                            placeholder="Nombre del atributo"
                            className="h-11 rounded-xl"
                          />
                          <Select
                            value={newAttr.type}
                            onValueChange={(v) => setNewAttr({ 
                              ...newAttr, 
                              type: v as any,
                              value: v === 'boolean' ? false : '',
                            })}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="number">NÃºmero</SelectItem>
                              <SelectItem value="boolean">SÃ­/No</SelectItem>
                              <SelectItem value="date">Fecha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {newAttr.type === 'text' && (
                            <Input
                              value={newAttr.value as string || ''}
                              onChange={(e) => setNewAttr({ ...newAttr, value: e.target.value })}
                              placeholder="Valor (ej: Oveja)"
                              className="h-11 rounded-xl"
                            />
                          )}
                          {newAttr.type === 'number' && (
                            <Input
                              type="number"
                              value={newAttr.value as number || ''}
                              onChange={(e) => setNewAttr({ ...newAttr, value: parseFloat(e.target.value) || 0 })}
                              placeholder="Valor (ej: 12)"
                              step="0.01"
                              className="h-11 rounded-xl"
                            />
                          )}
                          {newAttr.type === 'boolean' && (
                            <Select
                              value={newAttr.value ? 'true' : 'false'}
                              onValueChange={(v) => setNewAttr({ ...newAttr, value: v === 'true' })}
                            >
                              <SelectTrigger className="h-11 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">SÃ­</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {newAttr.type === 'date' && (
                            <Input
                              type="date"
                              value={newAttr.value as string || ''}
                              onChange={(e) => setNewAttr({ ...newAttr, value: e.target.value })}
                              className="h-11 rounded-xl"
                            />
                          )}
                          
                          <Input
                            value={newAttr.unit || ''}
                            onChange={(e) => setNewAttr({ ...newAttr, unit: e.target.value })}
                            placeholder="Unidad (ej: meses, kg)"
                            className="h-11 rounded-xl"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="attr-visible"
                            checked={newAttr.visible}
                            onCheckedChange={(checked) => setNewAttr({ ...newAttr, visible: checked as boolean })}
                            className="data-[state=checked]:bg-origen-pradera"
                          />
                          <label htmlFor="attr-visible" className="text-sm text-foreground cursor-pointer">
                            Visible en la ficha del producto
                          </label>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={resetAttrForm}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={editingAttr ? handleUpdateAttribute : handleAddAttribute}
                            disabled={!newAttr.name}
                            leftIcon={<Save className="w-4 h-4" />}
                          >
                            {editingAttr ? 'Actualizar' : 'Guardar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lista de atributos */}
              {attributes.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h3 className="text-sm font-medium text-origen-bosque mb-3">Tus atributos</h3>
                  <AnimatePresence>
                    {attributes.map((attr) => (
                      <motion.div
                        key={attr.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-4 bg-surface-alt rounded-xl border border-border hover:border-origen-pradera/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-origen-crema flex items-center justify-center shrink-0">
                            <Tag className="w-5 h-5 text-origen-pradera" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-origen-bosque">{attr.name}</p>
                              <Badge variant="leaf" size="xs" className="bg-origen-pradera/10">
                                {attr.type}
                              </Badge>
                              {!attr.visible && (
                                <Badge variant="leaf" size="xs" className="bg-surface flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" />
                                  Oculto
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground mt-1">
                              {String(attr.value)} {attr.unit}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleAttributeVisibility(attr.id)}
                            className="p-2 rounded-lg text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 transition-colors"
                            title={attr.visible ? "Ocultar" : "Mostrar"}
                          >
                            {attr.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingAttr(attr);
                              setNewAttr(attr);
                              setShowAttrForm(true);
                            }}
                            className="p-2 rounded-lg text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttribute(attr.id)}
                            className="p-2 rounded-lg text-text-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {attributes.length === 0 && !showAttrForm && (
                <div className="text-center py-8 bg-origen-crema/20 rounded-xl border-2 border-dashed border-origen-pradera/30">
                  <Tag className="w-12 h-12 text-origen-pradera/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No hay atributos</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                    Los atributos ayudan a los clientes a encontrar tu producto y a conocer sus caracterÃ­sticas especÃ­ficas
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* EstadÃ­sticas */}
        <div className="mt-6 p-4 bg-gradient-to-br from-origen-crema/30 to-white rounded-xl border border-origen-pradera/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-origen-pradera" />
            <span className="text-xs font-medium text-origen-bosque">Impacto en ventas</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Los productos con certificaciones verificadas tienen un <span className="font-bold text-origen-pradera">35% mÃ¡s</span> de clics.
            Los atributos detallados aumentan la confianza del cliente en un <span className="font-bold text-origen-pradera">28%</span>.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
