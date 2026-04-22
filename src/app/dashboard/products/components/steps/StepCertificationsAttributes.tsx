/**
 * @component StepCertificationsAttributes
 * @description Paso 7: Certificaciones y atributos
 *
 * Mobile UX:
 * - Catálogo en bottom sheet (slide-up) en móvil, panel inline en desktop
 * - Input text-base (16px) — evita zoom automático en iOS Safari
 * - Búsqueda + filtro de categoría apilados verticalmente en móvil
 * - Tap targets mínimo 44px en tarjetas y resultados
 * - Scroll lock (iOS-safe) cuando el bottom sheet está abierto
 */

'use client';

import { Button, Input, Badge, DateInput } from '@arcediano/ux-library';
import {
  Card,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@arcediano/ux-library';
import { Checkbox } from '@arcediano/ux-library';
import { DocumentUploader } from '../../components/DocumentUploader';
import {
  Award,
  CheckCircle,
  Sparkles,
  AlertCircle,
  AlertTriangle,
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
  ExternalLink,
  Star,
  Zap,
  Beef,
  Wheat,
  Droplet,
  Milk,
  Lightbulb,
  TrendingUp,
  Search,
  Loader2,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  Certification,
  DynamicAttribute,
  DocumentFile,
  CertificationStatus,
  CertificationCategory
} from '@/types/product';
import {
  getCertificationsCatalog,
  addProductCertification,
  removeProductCertification,
  updateProductCertification,
  type CatalogCertification,
} from '@/lib/api/products';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface StepCertificationsAttributesProps {
  certifications?: Certification[];
  attributes?: DynamicAttribute[];
  onCertificationsChange: (certs: Certification[]) => void;
  onAttributesChange: (attrs: DynamicAttribute[]) => void;
  completed?: boolean;
  productCategory?: string;
  /** ID del producto cuando estamos en modo edición. Permite llamadas granulares al backend. */
  productId?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '',               label: 'Todas las categorías' },
  { value: 'organic',        label: 'Ecológico' },
  { value: 'quality',        label: 'Calidad' },
  { value: 'safety',         label: 'Seguridad' },
  { value: 'sustainability', label: 'Sostenibilidad' },
  { value: 'origin',         label: 'Origen' },
];

const ATTRIBUTE_EXAMPLES: Record<string, Array<{
  name: string;
  type: string;
  example: string;
  unit?: string;
  description: string;
  icon: React.ReactNode;
}>> = {
  general: [
    { name: 'Origen geográfico', type: 'text',    example: 'Cataluña, España',   description: 'Región o lugar de producción',          icon: <Globe     className="w-4 h-4" /> },
    { name: 'Variedad',          type: 'text',    example: 'Premium, Artesanal',  description: 'Tipo o variedad del producto',           icon: <Tag       className="w-4 h-4" /> },
    { name: 'Temporada',         type: 'text',    example: 'Primavera-Verano',    description: 'Período de disponibilidad del producto',  icon: <Calendar  className="w-4 h-4" /> },
    { name: 'Elaboración',       type: 'text',    example: 'Artesanal, Industrial', description: 'Método de elaboración principal',      icon: <Leaf      className="w-4 h-4" /> },
    { name: 'Sin aditivos',      type: 'boolean', example: 'Sí',                 description: 'El producto no contiene aditivos artificiales', icon: <Zap  className="w-4 h-4" /> },
  ],
  quesos: [
    { name: 'Tipo de leche',      type: 'text',   example: 'Oveja, Vaca, Cabra, Mezcla',    description: 'Indica el origen de la leche utilizada',   icon: <Milk className="w-4 h-4" /> },
    { name: 'Tiempo de curación', type: 'number', example: '12', unit: 'meses',              description: 'Período de maduración del queso',           icon: <Clock className="w-4 h-4" /> },
    { name: 'Maduración',         type: 'text',   example: 'En cueva, Cámara, Bodega',       description: 'Método y lugar de maduración',              icon: <Beef className="w-4 h-4" /> },
    { name: 'Textura',            type: 'text',   example: 'Crema, Pasta dura, Semiduro',    description: 'Consistencia del queso',                    icon: <Beef className="w-4 h-4" /> },
    { name: 'Intensidad',         type: 'text',   example: 'Suave, Medio, Fuerte',           description: 'Nivel de sabor',                            icon: <Zap className="w-4 h-4" /> },
  ],
  vinos: [
    { name: 'Variedad de uva',    type: 'text',   example: 'Tempranillo, Garnacha, Albariño',description: 'Tipo de uva utilizado',                     icon: <Droplet className="w-4 h-4" /> },
    { name: 'Añada',              type: 'number', example: '2020', unit: 'año',              description: 'Año de la cosecha',                         icon: <Calendar className="w-4 h-4" /> },
    { name: 'Crianza',            type: 'text',   example: 'Joven, Crianza, Reserva',        description: 'Tiempo y tipo de envejecimiento',           icon: <Clock className="w-4 h-4" /> },
    { name: 'Barrica',            type: 'text',   example: '6 meses en roble francés',       description: 'Tipo de madera y tiempo en barrica',        icon: <Award className="w-4 h-4" /> },
    { name: 'Graduación',         type: 'number', example: '13.5', unit: '% vol',            description: 'Porcentaje de alcohol',                     icon: <Zap className="w-4 h-4" /> },
  ],
  aceites: [
    { name: 'Variedad de aceituna', type: 'text', example: 'Arbequina, Picual, Hojiblanca', description: 'Tipo de aceituna utilizada',                icon: <Droplet className="w-4 h-4" /> },
    { name: 'Acidez',             type: 'number', example: '0.2', unit: '%',                description: 'Grado de acidez (máximo 0.8° para AOVE)',   icon: <Beef className="w-4 h-4" /> },
    { name: 'Extracción',         type: 'text',   example: 'Primera prensada en frío',       description: 'Método de extracción del aceite',           icon: <Award className="w-4 h-4" /> },
    { name: 'Cosecha',            type: 'text',   example: 'Temprana, Tradicional',          description: 'Momento de la recolección',                 icon: <Calendar className="w-4 h-4" /> },
  ],
  mieles: [
    { name: 'Floración',          type: 'text',   example: 'Azahar, Romero, Tomillo',        description: 'Tipo de flor de origen',                    icon: <Leaf className="w-4 h-4" /> },
    { name: 'Textura',            type: 'text',   example: 'Líquida, Cremosa, Cristalizada', description: 'Consistencia de la miel',                   icon: <Droplet className="w-4 h-4" /> },
    { name: 'Origen botánico',    type: 'text',   example: 'Bosque, Montaña, Dehesa',        description: 'Entorno de las colmenas',                   icon: <TreePine className="w-4 h-4" /> },
  ],
  embutidos: [
    { name: 'Tipo de carne',      type: 'text',   example: 'Cerdo ibérico, Cerdo blanco',    description: 'Raza y tipo de cerdo',                      icon: <Beef className="w-4 h-4" /> },
    { name: 'Curación',           type: 'number', example: '24', unit: 'meses',              description: 'Tiempo de curación',                        icon: <Clock className="w-4 h-4" /> },
    { name: 'Alimentación',       type: 'text',   example: 'Bellota, Cebo de campo, Cebo',   description: 'Tipo de alimentación del animal',           icon: <Wheat className="w-4 h-4" /> },
    { name: 'Pieza',              type: 'text',   example: 'Paleta, Jamón, Lomo, Chorizo',   description: 'Tipo de pieza',                             icon: <Beef className="w-4 h-4" /> },
  ],
};

/** Mapea el nombre de categoría a la clave de ejemplos de atributos */
const resolveExamplesKey = (categoryName: string): string => {
  const lower = categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (lower.includes('queso') || lower.includes('lacteo')) return 'quesos';
  if (lower.includes('vino') || lower.includes('bebida')) return 'vinos';
  if (lower.includes('aceite'))                            return 'aceites';
  if (lower.includes('miel'))                              return 'mieles';
  if (lower.includes('embutido') || lower.includes('charcuteria') || lower.includes('jamon')) return 'embutidos';
  return lower; // puede coincidir con una clave directa (e.g. 'general')
};



const formatDate = (date?: Date | string): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateForInput = (date?: Date | string): string => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

const parseDateFromInput = (s: string): Date | undefined =>
  s ? new Date(s) : undefined;

/** Días que faltan para que caduque. Negativo = ya caducó. */
const daysUntilExpiry = (expiryDate?: Date | string): number | null => {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
  productCategory = 'general',
  productId,
}: StepCertificationsAttributesProps) {

  const [activeTab, setActiveTab] = useState('certifications');
  const [showCertForm, setShowCertForm] = useState(false);
  const [showCatalogPanel, setShowCatalogPanel] = useState(false);
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [editingAttr, setEditingAttr] = useState<DynamicAttribute | null>(null);
  const [showExampleTooltip, setShowExampleTooltip] = useState<string | null>(null);

  // ── Catálogo ────────────────────────────────────────────────────────────────
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [catalogResults, setCatalogResults] = useState<CatalogCertification[]>([]);
  const [catalogSearched, setCatalogSearched] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [certActionError, setCertActionError] = useState<string | null>(null);
  const [certActionLoading, setCertActionLoading] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catalogInputRef = useRef<HTMLInputElement>(null);

  const [newCert, setNewCert] = useState<Partial<Certification>>({
    name: '', issuingBody: '', certificateNumber: '',
    status: 'pending', verified: false, documents: [],
  });

  const [newAttr, setNewAttr] = useState<Partial<DynamicAttribute>>({
    name: '', type: 'text', value: '', visible: true,
  });

  const categoryExamples = ATTRIBUTE_EXAMPLES[resolveExamplesKey(productCategory)] || ATTRIBUTE_EXAMPLES.general;
  const categoryDisplayName = productCategory !== 'general' && productCategory ? productCategory : null;
  const isStepComplete = certifications.length > 0 || attributes.length > 0;

  // ── iOS-safe body scroll lock cuando el bottom sheet está abierto ───────────
  useEffect(() => {
    if (!showCatalogPanel) return;
    if (typeof window === 'undefined') return;
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    if (!isMobile) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      window.scrollTo(0, scrollY);
    };
  }, [showCatalogPanel]);

  // ── Búsqueda en catálogo con debounce ────────────────────────────────────────
  const searchCatalog = useCallback(async (query: string, category: string) => {
    setIsLoadingCatalog(true);
    setCatalogSearched(false);
    const res = await getCertificationsCatalog({
      search:   query.trim() || undefined,
      category: category     || undefined,
      limit: 20,
    });
    if (!res.error && res.data) {
      const existing = new Set(certifications.map((c) => c.id));
      setCatalogResults(res.data.items.filter((item) => !existing.has(item.id)));
    } else {
      setCatalogResults([]);
    }
    setCatalogSearched(true);
    setIsLoadingCatalog(false);
  }, [certifications]);

  useEffect(() => {
    if (!showCatalogPanel) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    setIsLoadingCatalog(true);
    searchDebounceRef.current = setTimeout(() => {
      searchCatalog(catalogSearch, catalogCategory);
    }, catalogSearch.trim() ? 350 : 0);

    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogSearch, catalogCategory, showCatalogPanel]);

  const openCatalogPanel = () => {
    setShowCatalogPanel(true);
    setShowCertForm(false);
    // Foco al input del panel de escritorio en el siguiente tick
    setTimeout(() => catalogInputRef.current?.focus(), 80);
  };

  const closeCatalogPanel = () => {
    setShowCatalogPanel(false);
    setCatalogSearch('');
    setCatalogCategory('');
    setCatalogResults([]);
    setCatalogSearched(false);
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
      issueDate:  newCert.issueDate  ? new Date(newCert.issueDate)  : undefined,
      expiryDate: newCert.expiryDate ? new Date(newCert.expiryDate) : undefined,
      status: (newCert.status as CertificationStatus) || 'pending',
      verified: false,
      documents: newCert.documents || [],
      verificationUrl: newCert.verificationUrl,
      category: newCert.category as CertificationCategory,
      source: 'manual',
    };
    onCertificationsChange([...certifications, cert]);
    resetCertForm();
  };

  const handleSelectFromCatalog = async (item: CatalogCertification) => {
    setCertActionError(null);
    if (certifications.some((c) => c.id === item.id)) return;

    if (productId) {
      setCertActionLoading(item.id);
      const res = await addProductCertification(productId, item.id);
      setCertActionLoading(null);
      if (res.error) {
        setCertActionError(res.error);
        return;
      }
    }

    const cert: Certification & { certificationId?: string } = {
      id:              item.id,
      certificationId: item.id,
      name:            item.name,
      issuingBody:     item.issuingBody,
      status:          'pending',
      verified:        item.verified,
      category:        item.category?.toLowerCase() as CertificationCategory,
      documents:       [],
      source:          'catalog',
    };

    onCertificationsChange([...certifications, cert]);
    closeCatalogPanel();
  };

  const handleUpdateCertification = async () => {
    if (!editingCert) return;
    setCertActionError(null);

    const updatedCert: Certification = {
      ...editingCert,
      ...newCert,
      issueDate:  newCert.issueDate  ? new Date(newCert.issueDate)  : undefined,
      expiryDate: newCert.expiryDate ? new Date(newCert.expiryDate) : undefined,
    };

    if (productId) {
      setCertActionLoading(editingCert.id);
      const res = await updateProductCertification(productId, editingCert.id, {
        certificateNumber: updatedCert.certificateNumber,
        issueDate:  updatedCert.issueDate  ? updatedCert.issueDate.toISOString()  : undefined,
        expiryDate: updatedCert.expiryDate ? updatedCert.expiryDate.toISOString() : undefined,
        documentIds: updatedCert.documents?.map((d) => d.id) ?? [],
      });
      setCertActionLoading(null);
      if (res.error) {
        setCertActionError(res.error);
        return;
      }
    }

    onCertificationsChange(certifications.map((c) => c.id === editingCert.id ? updatedCert : c));
    resetCertForm();
  };

  const handleDeleteCertification = async (id: string) => {
    setCertActionError(null);

    if (productId) {
      setCertActionLoading(id);
      const res = await removeProductCertification(productId, id);
      setCertActionLoading(null);
      if (res.error) {
        setCertActionError(res.error);
        return;
      }
    }

    onCertificationsChange(certifications.filter((c) => c.id !== id));
  };

  const handleDocumentsChange = (certId: string, docs: DocumentFile[]) => {
    onCertificationsChange(
      certifications.map((cert) => cert.id === certId ? { ...cert, documents: docs } : cert)
    );
  };

  const resetCertForm = () => {
    setNewCert({ name: '', issuingBody: '', certificateNumber: '', status: 'pending', verified: false, documents: [] });
    setShowCertForm(false);
    setEditingCert(null);
  };

  const openManualForm = () => {
    closeCatalogPanel();
    resetCertForm();
    setShowCertForm(true);
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
    onAttributesChange(attributes.map((a) => a.id === editingAttr.id ? { ...a, ...newAttr } : a));
    resetAttrForm();
  };

  const handleDeleteAttribute = (id: string) => {
    onAttributesChange(attributes.filter((a) => a.id !== id));
  };

  const handleToggleAttributeVisibility = (id: string) => {
    onAttributesChange(attributes.map((a) => a.id === id ? { ...a, visible: !a.visible } : a));
  };

  const resetAttrForm = () => {
    setNewAttr({ name: '', type: 'text', value: '', visible: true });
    setShowAttrForm(false);
    setEditingAttr(null);
  };

  const applyExample = (example: any) => {
    setNewAttr({ name: example.name, type: example.type, value: '', unit: example.unit, visible: true });
    setEditingAttr(null);
    setShowAttrForm(true); // abre el formulario inmediatamente con el ejemplo pre-cargado
  };

  // ============================================================================
  // CATALOG PANEL CONTENT (compartido entre mobile sheet y desktop inline)
  // autoFocus solo en desktop (param) para no disparar el teclado en móvil
  // ============================================================================

  const renderCatalogContent = (withAutoFocus: boolean) => (
    <>
      {/* Cabecera */}
      <div className="flex items-start justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 shrink-0">
        <div>
          <p className="text-sm font-semibold text-origen-bosque">Catálogo oficial de Origen</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Certificaciones reconocidas: DOP, IGP, Ecológico UE, ISO, Comercio Justo y más
          </p>
        </div>
        <button
          type="button"
          onClick={closeCatalogPanel}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-alt transition-colors ml-2 shrink-0"
          aria-label="Cerrar catálogo"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Búsqueda + filtro de categoría */}
      <div className="px-4 sm:px-5 pb-3 shrink-0">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Input de búsqueda — full width, font-size 16px para evitar zoom en iOS */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={withAutoFocus ? catalogInputRef : undefined}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={withAutoFocus}
              type="text"
              inputMode="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Buscar por nombre u organismo…"
              className="w-full h-12 pl-10 pr-10 rounded-xl border border-border bg-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-origen-pradera/30 focus:border-origen-pradera transition-colors"
              style={{ fontSize: '16px', WebkitAppearance: 'none' }}
            />
            {catalogSearch && (
              <button
                type="button"
                onClick={() => setCatalogSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro de categoría — full width en móvil, auto en desktop */}
          <Select value={catalogCategory} onValueChange={setCatalogCategory}>
            <SelectTrigger className="h-12 sm:h-11 w-full sm:w-auto sm:min-w-[150px] rounded-xl gap-1.5">
              <Filter className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resultados */}
      {/* En móvil (bottom sheet): flex-1 overflow-y-auto llena la altura restante del sheet */}
      {/* En desktop (inline): sm:flex-none, el <ul> tiene su propio max-h-56 */}
      <div
        className="flex-1 sm:flex-none overflow-y-auto sm:overflow-visible px-4 sm:px-5 pb-4 sm:pb-5"
        style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="rounded-xl border border-border overflow-hidden">
          {isLoadingCatalog && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando en el catálogo…
            </div>
          )}

          {!isLoadingCatalog && catalogResults.length > 0 && (
            <ul role="listbox" className="divide-y divide-border sm:max-h-56 sm:overflow-y-auto">
              {catalogResults.map((item) => (
                <li key={item.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => handleSelectFromCatalog(item)}
                    disabled={certActionLoading === item.id}
                    className="w-full flex items-center justify-between gap-3 px-4 py-4 sm:py-3 text-sm active:bg-origen-crema/60 hover:bg-origen-crema/40 transition-colors focus:outline-none text-left disabled:opacity-50 min-h-[60px] sm:min-h-0"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Award className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 text-origen-pradera" />
                      <span className="min-w-0">
                        <span className="block font-medium text-origen-bosque">{item.name}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">{item.issuingBody}</span>
                      </span>
                    </span>
                    {certActionLoading === item.id
                      ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 animate-spin text-origen-pradera" />
                      : <Plus className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 text-origen-pradera" />
                    }
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isLoadingCatalog && catalogSearched && catalogResults.length === 0 && (
            <div className="py-10 px-6 text-center space-y-3">
              <Award className="w-10 h-10 text-origen-pradera/30 mx-auto" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {catalogSearch
                    ? `No encontramos "${catalogSearch}" en el catálogo`
                    : 'El catálogo está vacío por el momento'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  El catálogo de Origen incluye certificaciones verificadas y reconocidas oficialmente.
                  Si tu certificación no aparece, añádela manualmente y el equipo la revisará.
                </p>
              </div>
              <Button
                size="sm"
                onClick={openManualForm}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Añadir manualmente
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="p-4 sm:p-6">

        {/* ── Cabecera ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isStepComplete
                ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white"
                : "bg-origen-pradera/10 text-origen-hoja"
            )}>
              {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Certificaciones y atributos</h2>
              <p className="text-sm text-muted-foreground truncate">Añade sellos de calidad y características</p>
            </div>
          </div>

          {/* Badges — simplificados en móvil para evitar 2 filas */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant="leaf" size="sm" className="bg-origen-pradera/10">
              {certifications.length} certificaciones
            </Badge>
            <Badge variant="info" size="sm" className="hidden sm:inline-flex bg-blue-50 text-blue-700 border-blue-200">
              {attributes.filter((a) => a.visible).length} atributos
            </Badge>
            {isStepComplete ? (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Completado
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Pendiente
              </Badge>
            )}
            <Badge variant="leaf" size="sm" className="hidden sm:inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Paso 7 de 7
            </Badge>
          </div>
        </div>

        {/* ── Pestañas ──────────────────────────────────────────────────────── */}
        <div className="mb-6 border-b border-border overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {[
              { id: 'certifications', label: 'Certificaciones', icon: <Award className="w-4 h-4" /> },
              { id: 'attributes',     label: 'Atributos',        icon: <Tag   className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 min-h-[44px] text-sm font-medium transition-colors relative flex items-center gap-2",
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

          {/* ================================================================ */}
          {/* TAB CERTIFICACIONES                                              */}
          {/* ================================================================ */}
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
                    Una vez verificadas, aparecerá un sello de confianza en tu producto.
                  </p>
                </div>
              </div>

              {/* Error global de acción */}
              {certActionError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {certActionError}
                  <button
                    type="button"
                    onClick={() => setCertActionError(null)}
                    className="ml-auto p-1"
                    aria-label="Cerrar error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── Acciones principales — apiladas en móvil ─────────────── */}
              {!showCatalogPanel && !showCertForm && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="w-full sm:flex-1"
                    variant="outline"
                    onClick={openCatalogPanel}
                    leftIcon={<Search className="w-4 h-4" />}
                  >
                    Buscar en catálogo oficial
                  </Button>
                  <Button
                    className="w-full sm:flex-1"
                    onClick={openManualForm}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Añadir manualmente
                  </Button>
                </div>
              )}

              {/* ── Panel catálogo ─────────────────────────────────────────── */}

              {/* Móvil: overlay backdrop */}
              <AnimatePresence>
                {showCatalogPanel && (
                  <motion.div
                    className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={closeCatalogPanel}
                  />
                )}
              </AnimatePresence>

              {/* Móvil: bottom sheet — slide up desde abajo */}
              <AnimatePresence>
                {showCatalogPanel && (
                  <motion.div
                    className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[28px] sm:hidden flex flex-col"
                    style={{ maxHeight: '85dvh' }}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                  >
                    {/* Drag handle visual */}
                    <div className="flex justify-center pt-3 pb-1 shrink-0">
                      <div className="w-10 h-1 rounded-full bg-gray-300" />
                    </div>
                    {renderCatalogContent(false)}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Desktop: panel inline colapsable */}
              <AnimatePresence>
                {showCatalogPanel && (
                  <motion.div
                    className="hidden sm:flex flex-col overflow-hidden"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="bg-white rounded-xl border-2 border-origen-pradera/20 flex flex-col overflow-hidden">
                      {renderCatalogContent(true)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Formulario de certificación manual ────────────────────── */}
              <AnimatePresence>
                {showCertForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 bg-origen-crema/30 rounded-xl border-2 border-origen-pradera/20 mb-4">
                      <h4 className="text-sm font-semibold text-origen-bosque mb-4">
                        {editingCert ? 'Editar certificación' : 'Nueva certificación'}
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Nombre"
                            required
                            value={newCert.name || ''}
                            onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                            placeholder="Ej: Agricultura Ecológica UE"
                          />
                          <Input
                            label="Organismo emisor"
                            required
                            value={newCert.issuingBody || ''}
                            onChange={(e) => setNewCert({ ...newCert, issuingBody: e.target.value })}
                            placeholder="Ej: ENAC, AENOR"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Nº de certificado"
                            value={newCert.certificateNumber || ''}
                            onChange={(e) => setNewCert({ ...newCert, certificateNumber: e.target.value })}
                            placeholder="Ej: ECO-ES-00123"
                          />
                          <div>
                            <label className="text-sm font-medium text-foreground block mb-1.5">Estado</label>
                            <Select
                              value={newCert.status || 'pending'}
                              onValueChange={(v) => setNewCert({ ...newCert, status: v as CertificationStatus })}
                            >
                              <SelectTrigger className="h-11 w-full rounded-xl">
                                <SelectValue placeholder="Estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Activo</SelectItem>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="expired">Caducado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <DateInput
                            label="Fecha de emisión"
                            value={formatDateForInput(newCert.issueDate)}
                            onChange={(e) => setNewCert({ ...newCert, issueDate: parseDateFromInput(e.target.value) })}
                            inputSize="md"
                          />
                          <DateInput
                            label="Fecha de caducidad"
                            value={formatDateForInput(newCert.expiryDate)}
                            onChange={(e) => setNewCert({ ...newCert, expiryDate: parseDateFromInput(e.target.value) })}
                            min={formatDateForInput(newCert.issueDate) || undefined}
                            inputSize="md"
                          />
                        </div>

                        <DocumentUploader
                          value={newCert.documents || []}
                          onChange={(docs) => setNewCert({ ...newCert, documents: docs })}
                          maxFiles={3}
                          maxSize={5}
                          acceptedFormats={['pdf', 'jpg', 'jpeg', 'png']}
                          label="Documentos acreditativos"
                          showVerification={false}
                        />

                        {/* Botones — full-width en móvil, alineados a la derecha en desktop */}
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={resetCertForm}
                            className="w-full sm:w-auto"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={editingCert ? handleUpdateCertification : handleAddCertification}
                            disabled={!newCert.name || !newCert.issuingBody || certActionLoading !== null}
                            className="w-full sm:w-auto"
                            leftIcon={certActionLoading
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Save className="w-4 h-4" />
                            }
                          >
                            {editingCert ? 'Actualizar' : 'Guardar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Lista de certificaciones ───────────────────────────────── */}
              {certifications.length > 0 && (
                <div className="space-y-3">
                  <AnimatePresence>
                    {certifications.map((cert) => {
                      const days = daysUntilExpiry(cert.expiryDate);
                      const isExpiringSoon = days !== null && days >= 0 && days <= 60;
                      const isExpired      = days !== null && days < 0;

                      return (
                        <motion.div
                          key={cert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all",
                            cert.verified
                              ? "border-green-200 bg-green-50/30"
                              : isExpired
                                ? "border-red-200 bg-red-50/20"
                                : "border-border bg-surface-alt hover:border-origen-pradera/30"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                              cert.verified ? "bg-green-100" : isExpired ? "bg-red-100" : "bg-origen-crema"
                            )}>
                              <Award className={cn(
                                "w-5 h-5",
                                cert.verified ? "text-green-600" : isExpired ? "text-red-500" : "text-origen-pradera"
                              )} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-semibold text-origen-bosque">{cert.name}</h4>
                                    {cert.verified ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                                        <CheckCircle className="w-3 h-3" /> Verificada
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                        <Clock className="w-3 h-3" /> Pendiente revisión
                                      </span>
                                    )}
                                    {isExpired && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                                        <AlertCircle className="w-3 h-3" /> Caducada
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{cert.issuingBody}</p>

                                  {/* Datos secundarios: nº cert + fechas */}
                                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                                    {cert.certificateNumber && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <FileText className="w-3 h-3 shrink-0" />
                                        Nº {cert.certificateNumber}
                                      </p>
                                    )}
                                    {cert.issueDate && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3 shrink-0" />
                                        Emitida {formatDate(cert.issueDate)}
                                      </p>
                                    )}
                                    {cert.expiryDate && (
                                      <p className={cn(
                                        "text-xs flex items-center gap-1",
                                        isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-amber-600 font-medium" : "text-muted-foreground"
                                      )}>
                                        <Clock className="w-3 h-3 shrink-0" />
                                        Caduca {formatDate(cert.expiryDate)}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Acciones — tap target 44px en móvil */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingCert(cert);
                                      setNewCert({ ...cert, issueDate: cert.issueDate, expiryDate: cert.expiryDate });
                                      setShowCertForm(true);
                                    }}
                                    className="p-2.5 sm:p-1.5 rounded-md text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 active:bg-origen-pradera/20 transition-colors"
                                    aria-label={`Editar ${cert.name}`}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCertification(cert.id)}
                                    disabled={certActionLoading === cert.id}
                                    className="p-2.5 sm:p-1.5 rounded-md text-text-subtle hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-50"
                                    aria-label={`Eliminar ${cert.name}`}
                                  >
                                    {certActionLoading === cert.id
                                      ? <Loader2 className="w-4 h-4 animate-spin" />
                                      : <Trash2 className="w-4 h-4" />
                                    }
                                  </button>
                                </div>
                              </div>

                              {/* Alerta de caducidad próxima */}
                              {isExpiringSoon && !isExpired && (
                                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  Caduca en {days} {days === 1 ? 'día' : 'días'} — renueva los documentos para mantener el sello
                                </div>
                              )}

                              {/* Documentos adjuntos */}
                              {cert.documents && cert.documents.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-[10px] text-muted-foreground mb-1.5">Documentos:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {cert.documents.map((doc) => (
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
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Empty state — solo cuando no hay panel abierto */}
              {certifications.length === 0 && !showCertForm && !showCatalogPanel && (
                <div className="text-center py-10 bg-origen-crema/20 rounded-xl border-2 border-dashed border-origen-pradera/30">
                  <Award className="w-12 h-12 text-origen-pradera/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground">Sin certificaciones</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    Usa los botones de arriba para buscar en el catálogo oficial o añadir una certificación manual
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* TAB ATRIBUTOS                                                    */}
          {/* ================================================================ */}
          {activeTab === 'attributes' && (
            <motion.div
              key="attributes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Explicación + preview de cómo aparecen en la tienda */}
              <div className="p-4 bg-origen-crema/30 rounded-xl border border-origen-pradera/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-origen-pradera shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-origen-bosque">¿Qué son los atributos?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Características específicas de tu producto que no aparecen en los campos estándar.
                      Ayudan a los clientes a comparar y elegir — por ejemplo: variedad de uva, tipo de leche, tiempo de curación, etc.
                    </p>
                    {/* Mini preview de cómo se ven en la ficha */}
                    <div className="mt-3 p-3 bg-white rounded-lg border border-border">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Así se ven en la ficha del producto (sección "Características"):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'Tipo de leche', value: 'Oveja' },
                          { label: 'Curación', value: '12 meses' },
                          { label: 'Maduración', value: 'En cueva' },
                        ].map((item) => (
                          <span
                            key={item.label}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-origen-crema/60 border border-border text-xs"
                          >
                            <span className="font-medium text-origen-bosque">{item.label}:</span>
                            <span className="text-muted-foreground">{item.value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ejemplos por categoría */}
              <div>
                <p className="text-sm font-semibold text-origen-bosque mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-origen-pradera" />
                  Atributos comunes{categoryDisplayName ? ` para ${categoryDisplayName}` : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryExamples.map((example, idx) => (
                    <div
                      key={idx}
                      className="relative p-4 bg-surface-alt rounded-xl border border-border hover:border-origen-pradera/30 active:bg-origen-crema/40 transition-all cursor-pointer group"
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
                          <p className="text-xs text-muted-foreground mt-0.5">{example.description}</p>
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-origen-pradera">
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
                            className="hidden sm:block absolute -top-2 right-4 z-10"
                          >
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-origen-oscuro text-white text-[10px] rounded shadow-lg">
                              <Plus className="w-3 h-3" /> Click para usar
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Chip "Usar" siempre visible en móvil */}
                      <div className="absolute top-2 right-2 sm:hidden">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-origen-pradera/10 text-origen-pradera text-[10px] rounded-full font-medium border border-origen-pradera/20">
                          <Plus className="w-2.5 h-2.5" /> Usar
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón añadir atributo */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (showAttrForm) {
                      resetAttrForm();
                    } else {
                      resetAttrForm();
                      setShowAttrForm(true);
                    }
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
                    <div className="p-4 sm:p-5 bg-origen-crema/30 rounded-xl border-2 border-origen-pradera/20 mb-4">
                      <h4 className="text-sm font-semibold text-origen-bosque mb-4">
                        {editingAttr ? 'Editar atributo' : 'Nuevo atributo personalizado'}
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Nombre"
                            value={newAttr.name || ''}
                            onChange={(e) => setNewAttr({ ...newAttr, name: e.target.value })}
                            placeholder="Ej: Tipo de leche"
                          />
                          <div>
                            <label className="text-sm font-medium text-foreground block mb-1.5">Tipo</label>
                            <Select
                              value={newAttr.type || 'text'}
                              onValueChange={(v) => setNewAttr({ ...newAttr, type: v as any, value: v === 'boolean' ? false : '' })}
                            >
                              <SelectTrigger className="h-11 w-full rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="boolean">Sí / No</SelectItem>
                                <SelectItem value="date">Fecha</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {newAttr.type === 'text' && (
                            <Input
                              label="Valor"
                              value={newAttr.value as string || ''}
                              onChange={(e) => setNewAttr({ ...newAttr, value: e.target.value })}
                              placeholder="Ej: Oveja"
                            />
                          )}
                          {newAttr.type === 'number' && (
                            <Input
                              label="Valor"
                              type="number"
                              value={newAttr.value as number || ''}
                              onChange={(e) => setNewAttr({ ...newAttr, value: parseFloat(e.target.value) || 0 })}
                              placeholder="Ej: 12"
                              step="0.01"
                            />
                          )}
                          {newAttr.type === 'boolean' && (
                            <div>
                              <label className="text-sm font-medium text-foreground block mb-1.5">Valor</label>
                              <Select
                                value={newAttr.value ? 'true' : 'false'}
                                onValueChange={(v) => setNewAttr({ ...newAttr, value: v === 'true' })}
                              >
                                <SelectTrigger className="h-11 w-full rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Sí</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          {newAttr.type === 'date' && (
                            <DateInput
                              label="Valor"
                              value={newAttr.value as string || ''}
                              onChange={(e) => setNewAttr({ ...newAttr, value: e.target.value })}
                              inputSize="md"
                            />
                          )}
                          <Input
                            label="Unidad (opcional)"
                            value={newAttr.unit || ''}
                            onChange={(e) => setNewAttr({ ...newAttr, unit: e.target.value })}
                            placeholder="Ej: meses, kg, %"
                          />
                        </div>

                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="attr-visible"
                            checked={newAttr.visible}
                            onCheckedChange={(checked) => setNewAttr({ ...newAttr, visible: checked as boolean })}
                            className="data-[state=checked]:bg-origen-pradera mt-0.5"
                          />
                          <div>
                            <label htmlFor="attr-visible" className="text-sm text-foreground cursor-pointer">
                              Visible en la ficha del producto
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Aparecerá en la sección "Características" de tu producto en la tienda
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={resetAttrForm} className="w-full sm:w-auto">
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={editingAttr ? handleUpdateAttribute : handleAddAttribute}
                            disabled={!newAttr.name}
                            className="w-full sm:w-auto"
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
                  <h3 className="text-sm font-semibold text-origen-bosque mb-2">Tus atributos</h3>
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-origen-bosque">{attr.name}</p>
                              <Badge variant="leaf" size="xs" className="bg-origen-pradera/10">{attr.type}</Badge>
                              {!attr.visible && (
                                <Badge variant="leaf" size="xs" className="bg-surface flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" /> Oculto
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground mt-0.5">{String(attr.value)} {attr.unit}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleToggleAttributeVisibility(attr.id)}
                            className="p-2.5 sm:p-2 rounded-lg text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 active:bg-origen-pradera/20 transition-colors"
                            title={attr.visible ? 'Ocultar' : 'Mostrar'}
                            aria-label={attr.visible ? 'Ocultar atributo' : 'Mostrar atributo'}
                          >
                            {attr.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => { setEditingAttr(attr); setNewAttr(attr); setShowAttrForm(true); }}
                            className="p-2.5 sm:p-2 rounded-lg text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 active:bg-origen-pradera/20 transition-colors"
                            aria-label="Editar atributo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttribute(attr.id)}
                            className="p-2.5 sm:p-2 rounded-lg text-text-subtle hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                            aria-label="Eliminar atributo"
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
                <div className="text-center py-10 bg-origen-crema/20 rounded-xl border-2 border-dashed border-origen-pradera/30">
                  <Tag className="w-12 h-12 text-origen-pradera/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground">Sin atributos</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    Los atributos ayudan a los clientes a encontrar tu producto y a conocer sus características específicas
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Impacto en ventas ─────────────────────────────────────────────── */}
        <div className="mt-6 p-4 bg-gradient-to-br from-origen-crema/30 to-white rounded-xl border border-origen-pradera/20">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-4 h-4 text-origen-pradera" />
            <span className="text-xs font-semibold text-origen-bosque">Impacto en ventas</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Los productos con certificaciones verificadas tienen un{' '}
            <span className="font-bold text-origen-pradera">35% más</span> de clics.
            Los atributos detallados aumentan la confianza del cliente en un{' '}
            <span className="font-bold text-origen-pradera">28%</span>.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
