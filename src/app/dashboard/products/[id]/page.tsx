/**
 * @page ProductoDetallePage
 * @description Página de detalle de producto — estilo dashboard Origen.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import {
  Button, Badge, StatusBadge,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  Switch,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  ActionBar,
  toast,
  ProductImage as ProductImg,
} from '@arcediano/ux-library';

import { PageHeader } from '../../components/PageHeader';
import { PageLoader } from '@/components/shared/loading/page-loader';
import { PageError } from '@/components/shared/error/page-error';
import { MobilePullRefresh } from '@/components/features/dashboard/components/mobile';

import {
  Package, Trash2, DollarSign, Tag, CheckCircle,
  AlertCircle, FileText, Award, Leaf, FlaskConical, Droplet, Milk,
  Info, AlertTriangle, Wheat, Bean, Nut, Egg, Fish,
  Shell, Sprout, Edit, ChevronDown, Thermometer, Archive,
  Globe, Lock, PlayCircle, PauseCircle, Send,
} from 'lucide-react';

import { type Product } from '@/types/product';
import { fetchProductById, deleteProduct, updateProduct } from '@/lib/api/products';

// ============================================================================
// ANIMACIONES
// ============================================================================

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28, delay: i * 0.07 },
  }),
};

// ============================================================================
// HELPERS
// ============================================================================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border-subtle last:border-0">
      <span className="text-xs text-text-subtle shrink-0">{label}</span>
      <span className="text-xs font-semibold text-origen-bosque text-right">{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

// Acordeón — estilo onboarding
function SectionAccordion({
  title, icon: Icon, defaultOpen = false, children, index = 0,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  index?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-[28px] border border-border-subtle bg-surface overflow-hidden"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-alt/50 transition-colors"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-origen-pradera/15 to-origen-hoja/15 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-origen-pradera" />
        </div>
        <span className="flex-1 text-sm font-semibold text-origen-bosque">{title}</span>
        <ChevronDown className={cn('w-4 h-4 text-text-subtle transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-border-subtle">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// SECCIONES DE CONTENIDO
// ============================================================================

function DescripcionSection({ product }: { product: Product }) {
  return (
    <div className="space-y-3 pt-3">
      <p className="text-sm text-foreground leading-relaxed">{product.shortDescription}</p>
      {product.fullDescription && (
        <p className="text-sm text-text-subtle leading-relaxed whitespace-pre-line">{product.fullDescription}</p>
      )}
      {product.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {product.tags.map(tag => (
            <Badge key={tag} variant="leaf" size="sm" icon={<Tag className="w-3 h-3" />}>{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function NutricionalSection({ info }: { info: NonNullable<Product['nutritionalInfo']> }) {
  const allergenIcons: Record<string, React.ElementType> = {
    Gluten: Wheat, Crustaceos: Shell, Huevos: Egg, Pescado: Fish,
    Cacahuetes: Nut, Soja: Bean, Sulfitos: Droplet, Lacteos: Milk, Sesamo: Sprout,
  };
  const dietary = [
    { key: 'isGlutenFree', label: 'Sin gluten' },
    { key: 'isLactoseFree', label: 'Sin lactosa' },
    { key: 'isVegan', label: 'Vegano' },
    { key: 'isVegetarian', label: 'Vegetariano' },
    { key: 'isNutFree', label: 'Sin frutos secos' },
  ] as const;
  const active = dietary.filter(f => info[f.key]);

  return (
    <div className="space-y-4 pt-3">
      <div className="rounded-2xl bg-origen-crema/50 border border-border-subtle p-4">
        <SectionLabel>Por {info.servingSize}</SectionLabel>
        <div className="grid grid-cols-2 gap-x-6">
          {info.calories != null && <InfoRow label="Calorías" value={`${info.calories} kcal`} />}
          {info.protein != null && <InfoRow label="Proteínas" value={`${info.protein} g`} />}
          {info.totalFat != null && <InfoRow label="Grasas" value={`${info.totalFat} g`} />}
          {info.carbohydrates != null && <InfoRow label="Hidratos" value={`${info.carbohydrates} g`} />}
          {info.sugars != null && <InfoRow label="Azúcares" value={`${info.sugars} g`} />}
          {info.dietaryFiber != null && <InfoRow label="Fibra" value={`${info.dietaryFiber} g`} />}
          {info.sodium != null && <InfoRow label="Sodio" value={`${info.sodium} mg`} />}
        </div>
      </div>
      {active.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {active.map(f => (
            <Badge key={f.key} variant="leaf" size="sm">
              <CheckCircle className="w-3 h-3 mr-1" />{f.label}
            </Badge>
          ))}
        </div>
      )}
      {info.allergens.length > 0 && (
        <div>
          <SectionLabel>Alérgenos</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {info.allergens.map(a => {
              const Icon = allergenIcons[a] || AlertCircle;
              return (
                <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs font-medium">
                  <Icon className="w-3 h-3" />{a}
                </span>
              );
            })}
          </div>
        </div>
      )}
      {info.storageInstructions && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-origen-pastel/40 border border-origen-pradera/15 p-3.5">
          <Thermometer className="w-4 h-4 text-origen-pino mt-0.5 shrink-0" />
          <p className="text-xs text-origen-bosque leading-relaxed">{info.storageInstructions}</p>
        </div>
      )}
    </div>
  );
}

function ProduccionSection({ info, formatDate }: {
  info: NonNullable<Product['productionInfo']>;
  formatDate: (d?: Date | string | null) => string;
}) {
  return (
    <div className="space-y-4 pt-3">
      {info.story && (
        <p className="text-sm text-text-subtle leading-relaxed italic border-l-2 border-origen-pradera/30 pl-3">
          "{info.story}"
        </p>
      )}
      <div className="rounded-2xl bg-origen-crema/50 border border-border-subtle p-4">
        <InfoRow label="Productor" value={info.farmName} />
        <InfoRow label="Origen" value={info.origin} />
        <InfoRow label="Método" value={info.productionMethod} />
        <InfoRow label="Lote" value={info.batchNumber} />
        <InfoRow label="Cosecha" value={info.harvestDate ? formatDate(info.harvestDate) : undefined} />
        <InfoRow label="Caducidad" value={info.expiryDate ? formatDate(info.expiryDate) : undefined} />
      </div>
      {info.practices?.length > 0 && (
        <div>
          <SectionLabel>Prácticas sostenibles</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {info.practices.map(p => (
              <Badge key={p} variant="leaf" size="sm"><Leaf className="w-3 h-3 mr-1" />{p}</Badge>
            ))}
          </div>
        </div>
      )}
      {info.sustainabilityInfo && (
        <p className="text-xs text-text-subtle leading-relaxed pt-1">{info.sustainabilityInfo}</p>
      )}
    </div>
  );
}

function PreciosSection({ product, formatCurrency, hasDiscount, discountPct }: {
  product: Product;
  formatCurrency: (v?: number | null) => string;
  hasDiscount: boolean;
  discountPct: number;
}) {
  return (
    <div className="space-y-4 pt-3">
      <div className="rounded-2xl bg-origen-crema/50 border border-border-subtle p-4">
        <InfoRow label="Precio de venta" value={
          <span className="text-sm font-bold text-origen-bosque">{formatCurrency(product.basePrice)}</span>
        } />
        {product.comparePrice && (
          <InfoRow label="Precio sin descuento" value={formatCurrency(product.comparePrice)} />
        )}
        {hasDiscount && (
          <InfoRow label="Descuento" value={
            <span className="text-green-600 font-semibold">−{discountPct}%</span>
          } />
        )}
      </div>
      {product.priceTiers?.length > 0 && (
        <div>
          <SectionLabel>Precios por volumen</SectionLabel>
          <div className="space-y-2">
            {product.priceTiers.map(tier => (
              <div key={tier.id} className="flex justify-between items-center rounded-2xl border border-border-subtle p-3.5 bg-surface">
                <span className="text-xs text-text-subtle">
                  {tier.minQuantity}{tier.maxQuantity ? `–${tier.maxQuantity}` : '+'} uds.
                </span>
                <span className="text-xs font-semibold text-origen-bosque">
                  {tier.type === 'percentage' ? `−${tier.value}%` : formatCurrency(tier.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InventarioSection({ product }: { product: Product }) {
  const stock = product.stock ?? 0;
  const threshold = product.lowStockThreshold ?? 5;
  const stockColor = stock === 0
    ? 'text-feedback-danger'
    : stock <= threshold ? 'text-amber-600' : 'text-origen-hoja';

  return (
    <div className="space-y-4 pt-3">
      <div className="rounded-2xl bg-origen-crema/50 border border-border-subtle p-4">
        <InfoRow label="SKU" value={<span className="font-mono">{product.sku}</span>} />
        {product.barcode && (
          <InfoRow label="Código de barras" value={<span className="font-mono">{product.barcode}</span>} />
        )}
        <InfoRow label="Stock actual" value={
          <span className={cn('font-bold', stockColor)}>{stock} uds.</span>
        } />
        <InfoRow label="Alerta stock bajo" value={`${threshold} uds.`} />
        <InfoRow label="Control de inventario" value={product.trackInventory ? 'Activo' : 'No'} />
        <InfoRow label="Pedidos sin stock" value={product.allowBackorders ? 'Permitidos' : 'No permitidos'} />
      </div>
      {(product.weight || product.dimensions) && (
        <div className="rounded-2xl bg-origen-crema/50 border border-border-subtle p-4">
          <SectionLabel>Logística</SectionLabel>
          {product.weight && (
            <InfoRow label="Peso" value={`${product.weight} ${product.weightUnit || 'kg'}`} />
          )}
          {product.dimensions && (
            <InfoRow
              label="Dimensiones"
              value={`${product.dimensions.length ?? 0}×${product.dimensions.width ?? 0}×${product.dimensions.height ?? 0} cm`}
            />
          )}
          {product.shippingClass && (
            <InfoRow label="Clase de envío" value={product.shippingClass} />
          )}
        </div>
      )}
    </div>
  );
}

function AtributosSection({ product }: { product: Product }) {
  const visible = product.attributes.filter(a => a.visible);
  if (!visible.length) {
    return (
      <div className="pt-3 py-6 text-center">
        <p className="text-sm text-text-subtle">Sin atributos definidos</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 pt-3">
      {visible.map(attr => (
        <div key={attr.id} className="p-3.5 rounded-2xl border border-border-subtle bg-origen-crema/30">
          <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider mb-1">{attr.name}</p>
          <p className="text-sm font-semibold text-origen-bosque truncate">
            {attr.type === 'boolean' ? (attr.value ? 'Sí' : 'No') : String(attr.value)}
            {attr.unit && attr.type !== 'boolean' ? ` ${attr.unit}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// TARJETA DE ESTADO Y VISIBILIDAD
// ============================================================================

function StatusCard({
  product, onStatusChange, onVisibilityChange, isUpdating,
}: {
  product: Product;
  onStatusChange: (s: Product['status']) => Promise<void>;
  onVisibilityChange: (v: boolean) => Promise<void>;
  isUpdating: boolean;
}) {
  const isPublic   = product.visibility === 'public';
  const isDraft    = product.status === 'draft';
  const isActive   = product.status === 'active';
  const isInactive = product.status === 'inactive';

  const transitions = [
    { to: 'active'   as const, label: 'Publicar producto',  icon: PlayCircle,  variant: 'primary'   as const, show: isDraft || isInactive },
    { to: 'inactive' as const, label: 'Pausar producto',    icon: PauseCircle, variant: 'secondary' as const, show: isActive },
    { to: 'draft'    as const, label: 'Mover a borrador',   icon: FileText,    variant: 'ghost'     as const, show: isActive || isInactive },
  ].filter(t => t.show);

  return (
    <div className="rounded-[28px] border border-border-subtle bg-surface p-4 sm:p-5 space-y-4">
      <div>
        <SectionLabel>Estado y publicación</SectionLabel>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-subtle">Estado actual</span>
          <StatusBadge status={product.status as any} />
        </div>
      </div>
      {transitions.length > 0 && (
        <div className="flex flex-col gap-2">
          {transitions.map(t => (
            <Button
              key={t.to}
              variant={t.variant}
              size="sm"
              leftIcon={<t.icon className="w-4 h-4" />}
              onClick={() => onStatusChange(t.to)}
              disabled={isUpdating}
              loading={isUpdating}
              loadingText="Actualizando..."
              className="w-full justify-start"
            >
              {t.label}
            </Button>
          ))}
        </div>
      )}
      <div className="border-t border-border-subtle pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {isPublic
              ? <Globe className="w-4 h-4 text-origen-pradera shrink-0" />
              : <Lock  className="w-4 h-4 text-text-subtle shrink-0" />}
            <div className="min-w-0">
              <p className="text-sm font-medium text-origen-bosque">
                {isPublic ? 'Visible en marketplace' : 'Oculto en marketplace'}
              </p>
              <p className="text-xs text-text-subtle mt-0.5">
                {isPublic ? 'Los compradores pueden verlo' : 'Solo visible para ti'}
              </p>
            </div>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={onVisibilityChange}
            disabled={isUpdating || isDraft}
            trackCheckedColor="bg-origen-bosque"
          />
        </div>
        {isDraft && (
          <p className="text-[11px] text-text-subtle mt-2 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            Publica el producto para hacerlo visible.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ProductoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct]           = useState<Product | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [isUpdating, setIsUpdating]     = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusSheet, setShowStatusSheet]   = useState(false);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchProductById(productId);
      if (res.error) setError(res.error);
      else if (res.data) setProduct(res.data);
      else setError('Producto no encontrado');
    } catch {
      setError('Error al cargar el producto');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => { if (productId) loadProduct(); }, [productId, loadProduct]);

  const handleStatusChange = async (newStatus: Product['status']) => {
    if (!product) return;
    setIsUpdating(true);
    try {
      const res = await updateProduct(product.id, { status: newStatus });
      if (res.error) toast({ title: 'Error', description: res.error, variant: 'error' });
      else if (res.data) {
        setProduct(res.data);
        toast({ title: 'Estado actualizado', description: `Producto ${newStatus === 'active' ? 'publicado' : 'actualizado'}.` });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar.', variant: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVisibilityChange = async (visible: boolean) => {
    if (!product) return;
    setIsUpdating(true);
    try {
      const res = await updateProduct(product.id, { visibility: visible ? 'public' : 'private' });
      if (res.error) toast({ title: 'Error', description: res.error, variant: 'error' });
      else if (res.data) {
        setProduct(res.data);
        toast({ title: visible ? 'Producto visible' : 'Producto oculto' });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo cambiar la visibilidad.', variant: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      const res = await deleteProduct(product.id);
      if (res.error) toast({ title: 'Error al eliminar', description: res.error, variant: 'error' });
      else {
        toast({ title: 'Producto eliminado', description: `"${product.name}" eliminado.` });
        router.push('/dashboard/products');
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar.', variant: 'error' });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return 'No disponible';
    try {
      return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (value?: number | null) =>
    value == null ? '—' : `${value.toFixed(2).replace('.', ',')} €`;

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (isLoading) return <PageLoader message="Cargando producto..." />;
  if (error || !product) return (
    <PageError title="Error al cargar" message={error || 'Producto no encontrado'} onRetry={loadProduct} />
  );

  // ── Datos derivados ─────────────────────────────────────────────────────────

  const hasDiscount = !!(product.comparePrice && product.basePrice && product.comparePrice > product.basePrice);
  const discountPct = hasDiscount
    ? Math.round(((product.comparePrice! - product.basePrice) / product.comparePrice!) * 100)
    : 0;
  const stock     = product.stock ?? 0;
  const threshold = product.lowStockThreshold ?? 5;
  const stockColor =
    stock === 0 ? 'text-feedback-danger' :
    stock <= threshold ? 'text-amber-600' : 'text-origen-hoja';

  const mainImage = product.mainImage ?? product.gallery?.[0];

  const sections = [
    {
      id: 'descripcion', label: 'Descripción', icon: FileText, show: true, defaultOpen: true,
      content: <DescripcionSection product={product} />,
    },
    {
      id: 'precios', label: 'Precios', icon: DollarSign, show: true,
      content: <PreciosSection product={product} formatCurrency={formatCurrency} hasDiscount={hasDiscount} discountPct={discountPct} />,
    },
    {
      id: 'inventario', label: 'Inventario', icon: Archive, show: true,
      content: <InventarioSection product={product} />,
    },
    {
      id: 'nutricional', label: 'Info nutricional', icon: FlaskConical, show: !!product.nutritionalInfo,
      content: product.nutritionalInfo ? <NutricionalSection info={product.nutritionalInfo} /> : null,
    },
    {
      id: 'produccion', label: 'Producción', icon: Leaf, show: !!product.productionInfo,
      content: product.productionInfo ? <ProduccionSection info={product.productionInfo} formatDate={formatDate} /> : null,
    },
    {
      id: 'atributos', label: 'Atributos', icon: Tag, show: product.attributes.length > 0,
      content: <AtributosSection product={product} />,
    },
  ].filter(s => s.show);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <MobilePullRefresh onRefresh={loadProduct}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }}>

        {/* CABECERA */}
        <PageHeader
          title={product.name}
          description={`${product.categoryName || product.categoryId} · ${product.sku || 'Sin SKU'}`}
          badgeIcon={Package}
          badgeText={
            product.status === 'active'      ? 'Activo'    :
            product.status === 'inactive'    ? 'Inactivo'  :
            product.status === 'out_of_stock'? 'Sin stock' : 'Borrador'
          }
          tooltip="Detalle del producto"
          showBackButton
          onBack={() => router.back()}
          actions={
            <div className="hidden lg:flex items-center gap-2">
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Button variant="secondary" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                  Editar
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4 text-feedback-danger" />}
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="text-feedback-danger hover:bg-red-50"
              >
                Eliminar
              </Button>
            </div>
          }
        />

        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-[calc(152px+env(safe-area-inset-bottom))] lg:pb-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8">

              {/* ══ COLUMNA IZQUIERDA ══════════════════════════════════════════ */}
              <div className="lg:col-span-4 flex flex-col gap-4 mb-4 lg:mb-0">

                {/* ── Tarjeta del producto (hero) — estilo onboarding ── */}
                <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
                  <div className="rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 sm:p-5 shadow-sm">

                    {/* Imagen + nombre + KPIs */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-origen-crema/80 flex items-center justify-center shrink-0 border border-border-subtle">
                        {mainImage
                          ? <ProductImg src={mainImage.url} alt={mainImage.alt || product.name} className="w-full h-full object-cover" />
                          : <Package className="w-10 h-10 text-origen-pradera/40" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h1 className="text-sm font-bold text-origen-bosque leading-snug">{product.name}</h1>
                          <StatusBadge status={product.status as any} />
                        </div>
                        <p className="text-xs text-text-subtle mb-3 truncate">
                          {product.categoryName || product.categoryId}
                        </p>
                        {/* Precio + Stock — únicos KPIs relevantes */}
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider leading-none mb-1">
                              Precio
                            </p>
                            <p className="text-base font-bold text-origen-bosque tabular-nums">
                              {formatCurrency(product.basePrice)}
                            </p>
                          </div>
                          <div className="w-px h-8 bg-border-subtle shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider leading-none mb-1">
                              Stock
                            </p>
                            <p className={cn('text-base font-bold tabular-nums', stockColor)}>
                              {stock} uds
                            </p>
                          </div>
                          {hasDiscount && (
                            <>
                              <div className="w-px h-8 bg-border-subtle shrink-0" />
                              <div className="bg-green-50 border border-green-100 rounded-xl px-2 py-1">
                                <p className="text-xs font-bold text-green-700">−{discountPct}%</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Visibilidad */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border-subtle">
                      <div className="flex items-center gap-2">
                        {product.visibility === 'public'
                          ? <Globe className="w-3.5 h-3.5 text-origen-pradera" />
                          : <Lock  className="w-3.5 h-3.5 text-text-subtle" />}
                        <span className="text-xs text-text-subtle">
                          {product.visibility === 'public' ? 'Visible en marketplace' : 'Oculto en marketplace'}
                        </span>
                      </div>
                      {product.visibility === 'public' && (
                        <Badge variant="leaf" size="sm">Publicado</Badge>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* ── Galería adicional ── */}
                {product.gallery?.length > 1 && (
                  <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
                    <div className="rounded-[28px] border border-border-subtle bg-surface p-4">
                      <SectionLabel>Galería</SectionLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {product.gallery.slice(1, 5).map((img, idx) => (
                          <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-origen-crema/50 border border-border-subtle">
                            <ProductImg src={img.url} alt={img.alt || `Imagen ${idx + 2}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Estado y publicación (desktop) ── */}
                <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" className="hidden lg:block">
                  <StatusCard
                    product={product}
                    onStatusChange={handleStatusChange}
                    onVisibilityChange={handleVisibilityChange}
                    isUpdating={isUpdating}
                  />
                </motion.div>

                {/* ── Certificaciones ── */}
                {product.certifications?.length > 0 && (
                  <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
                    <div className="rounded-[28px] border border-border-subtle bg-surface p-4 sm:p-5">
                      <SectionLabel>Certificaciones</SectionLabel>
                      <div className="space-y-2">
                        {product.certifications.map(cert => (
                          <div key={cert.id} className="flex items-center gap-3 p-3 rounded-2xl bg-origen-crema/50 border border-border-subtle">
                            <div className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                              cert.verified
                                ? 'bg-green-50 border border-green-100'
                                : 'bg-origen-pastel/50 border border-origen-pradera/15'
                            )}>
                              {cert.verified
                                ? <CheckCircle className="w-4 h-4 text-green-600" />
                                : <Award className="w-4 h-4 text-origen-pradera" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-origen-bosque truncate">{cert.name}</p>
                              {cert.issuingBody && (
                                <p className="text-[10px] text-text-subtle truncate">{cert.issuingBody}</p>
                              )}
                            </div>
                            {cert.expiryDate && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                {new Date(cert.expiryDate).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ══ COLUMNA DERECHA (secciones acordeón) ════════════════════════ */}
              <div className="lg:col-span-8 flex flex-col gap-3">
                {sections.map((s, i) => (
                  <SectionAccordion
                    key={s.id}
                    title={s.label}
                    icon={s.icon}
                    defaultOpen={s.defaultOpen ?? false}
                    index={i + 4}
                  >
                    {s.content}
                  </SectionAccordion>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ── ACTION BAR MÓVIL ── */}
        <ActionBar
          primaryAction={{
            id: 'edit',
            label: 'Editar producto',
            leftIcon: <Edit className="w-4 h-4" />,
            onClick: () => router.push(`/dashboard/products/${product.id}/edit`),
          }}
          secondaryActions={[
            {
              id: 'status',
              label: 'Gestionar estado',
              leftIcon: <Send className="w-4 h-4" />,
              variant: 'secondary',
              onClick: () => setShowStatusSheet(true),
              disabled: isUpdating,
            },
            {
              id: 'delete',
              label: 'Eliminar',
              leftIcon: <Trash2 className="w-4 h-4" />,
              variant: 'destructive',
              onClick: () => setShowDeleteDialog(true),
              disabled: isDeleting,
            },
          ]}
        />

        {/* ── BOTTOM SHEET ESTADO (móvil) ── */}
        <Sheet open={showStatusSheet} onOpenChange={setShowStatusSheet}>
          <SheetContent side="bottom" className="rounded-t-[28px] px-5 pb-8">
            <SheetHeader className="mb-5">
              <SheetTitle className="text-left text-origen-bosque">Gestionar producto</SheetTitle>
            </SheetHeader>
            <StatusCard
              product={product}
              onStatusChange={async s => { await handleStatusChange(s); setShowStatusSheet(false); }}
              onVisibilityChange={async v => { await handleVisibilityChange(v); setShowStatusSheet(false); }}
              isUpdating={isUpdating}
            />
          </SheetContent>
        </Sheet>

        {/* ── DIÁLOGO ELIMINAR ── */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-feedback-danger" />
                </div>
                <DialogTitle>¿Eliminar producto?</DialogTitle>
              </div>
              <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-text-subtle leading-relaxed">
              Se eliminará permanentemente{' '}
              <span className="font-semibold text-origen-bosque">"{product.name}"</span>{' '}
              del catálogo, incluyendo todas sus imágenes y estadísticas.
            </p>
            {product.sales && product.sales > 0 && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 p-3.5 mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Este producto tiene {product.sales} ventas registradas.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3">
              <Button variant="secondary" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                loading={isDeleting}
                loadingText="Eliminando..."
              >
                Eliminar permanentemente
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </motion.div>
    </MobilePullRefresh>
  );
}
