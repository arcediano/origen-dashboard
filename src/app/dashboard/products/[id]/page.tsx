/**
 * @page ProductoDetallePage
 * @description Página de detalle de producto del dashboard del productor.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

import {
  Button, Badge, StatusBadge,
  Card, CardContent, CardHeader, CardTitle,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  Tabs, TabsContent, TabsList, TabsTrigger,
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
  Package, Eye, Trash2, DollarSign, TrendingUp, Star, Tag, CheckCircle,
  AlertCircle, FileText, Award, Leaf, FlaskConical, Droplet, Milk, Percent,
  Info, AlertTriangle, ShoppingBag, Wheat, Bean, Nut, Egg, Fish, Shell,
  Sprout, RefreshCw, Edit, ChevronDown, Thermometer, Archive, ArrowLeft,
  Globe, Lock, PlayCircle, PauseCircle, Send, MoreVertical,
} from 'lucide-react';

import { type Product } from '@/types/product';
import { fetchProductById, deleteProduct, updateProduct } from '@/lib/api/products';

// ============================================================================
// ANIMACIONES
// ============================================================================

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28, delay: i * 0.06 },
  }),
};

// ============================================================================
// HELPERS
// ============================================================================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border-subtle last:border-0">
      <span className="text-xs text-text-subtle shrink-0">{label}</span>
      <span className="text-xs font-medium text-origen-bosque text-right">{value}</span>
    </div>
  );
}

function SectionCard({
  title, icon: Icon, children, defaultOpen = false,
}: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-xl bg-origen-pradera/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-origen-pradera" />
        </div>
        <span className="flex-1 text-sm font-semibold text-origen-bosque">{title}</span>
        <ChevronDown className={cn('w-4 h-4 text-text-subtle transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border-subtle pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTES DE CONTENIDO
// ============================================================================

function NutritionalSection({ info }: { info: NonNullable<Product['nutritionalInfo']> }) {
  const allergenIcons: Record<string, React.ElementType> = {
    Gluten: Wheat, Huevos: Egg, Pescado: Fish, Cacahuetes: Nut,
    Soja: Bean, Sulfitos: Droplet, Lacteos: Milk, Sesamo: Sprout,
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
    <div className="space-y-4">
      <div className="rounded-xl bg-origen-crema/40 p-3">
        <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-2">Por {info.servingSize}</p>
        <div className="grid grid-cols-2 gap-x-4">
          {info.calories != null && <InfoRow label="Calorias" value={`${info.calories} kcal`} />}
          {info.protein != null && <InfoRow label="Proteinas" value={`${info.protein} g`} />}
          {info.totalFat != null && <InfoRow label="Grasas" value={`${info.totalFat} g`} />}
          {info.carbohydrates != null && <InfoRow label="Hidratos" value={`${info.carbohydrates} g`} />}
          {info.sugars != null && <InfoRow label="Azucares" value={`${info.sugars} g`} />}
          {info.dietaryFiber != null && <InfoRow label="Fibra" value={`${info.dietaryFiber} g`} />}
          {info.sodium != null && <InfoRow label="Sodio" value={`${info.sodium} mg`} />}
        </div>
      </div>
      {active.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {active.map(f => (
            <Badge key={f.key} variant="leaf" size="sm">
              <CheckCircle className="w-3 h-3 mr-1" />{f.label}
            </Badge>
          ))}
        </div>
      )}
      {info.allergens.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-2">Alergenos</p>
          <div className="flex flex-wrap gap-1.5">
            {info.allergens.map(a => {
              const Icon = allergenIcons[a] || AlertCircle;
              return (
                <span key={a} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-feedback-danger-subtle text-red-700 text-xs">
                  <Icon className="w-3 h-3" />{a}
                </span>
              );
            })}
          </div>
        </div>
      )}
      {info.storageInstructions && (
        <div className="flex items-start gap-2 rounded-xl bg-origen-pastel/40 p-3">
          <Thermometer className="w-4 h-4 text-origen-pino mt-0.5 shrink-0" />
          <p className="text-xs text-origen-bosque">{info.storageInstructions}</p>
        </div>
      )}
    </div>
  );
}

function ProductionSection({ info, formatDate }: {
  info: NonNullable<Product['productionInfo']>;
  formatDate: (d?: Date | string | null) => string;
}) {
  return (
    <div className="space-y-4">
      {info.story && (
        <p className="text-sm text-text-subtle leading-relaxed italic border-l-2 border-origen-pradera/40 pl-3">
          "{info.story}"
        </p>
      )}
      <div>
        <InfoRow label="Productor" value={info.farmName} />
        <InfoRow label="Origen" value={info.origin} />
        <InfoRow label="Metodo" value={info.productionMethod} />
        <InfoRow label="Lote" value={info.batchNumber} />
        <InfoRow label="Cosecha" value={info.harvestDate ? formatDate(info.harvestDate) : undefined} />
        <InfoRow label="Caducidad" value={info.expiryDate ? formatDate(info.expiryDate) : undefined} />
      </div>
      {info.practices?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-2">Practicas</p>
          <div className="flex flex-wrap gap-1.5">
            {info.practices.map(p => (
              <Badge key={p} variant="leaf" size="sm"><Leaf className="w-3 h-3 mr-1" />{p}</Badge>
            ))}
          </div>
        </div>
      )}
      {info.sustainabilityInfo && (
        <p className="text-xs text-text-subtle leading-relaxed">{info.sustainabilityInfo}</p>
      )}
    </div>
  );
}

function PricingSection({ product, formatCurrency, hasDiscount, discountPct }: {
  product: Product; formatCurrency: (v?: number | null) => string;
  hasDiscount: boolean; discountPct: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-origen-crema/40 p-3">
        <InfoRow label="Precio base" value={<span className="font-bold text-origen-bosque">{formatCurrency(product.basePrice)}</span>} />
        {product.comparePrice && <InfoRow label="Precio comparacion" value={formatCurrency(product.comparePrice)} />}
        {hasDiscount && <InfoRow label="Descuento" value={<span className="text-green-600 font-medium">-{discountPct}%</span>} />}
      </div>
      {product.priceTiers?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-2">Precios por volumen</p>
          <div className="space-y-2">
            {product.priceTiers.map(tier => (
              <div key={tier.id} className="flex justify-between rounded-xl border border-border-subtle p-3 text-xs">
                <span className="text-text-subtle">{tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} uds.</span>
                <span className="font-semibold text-origen-bosque">
                  {tier.type === 'percentage' ? `-${tier.value}%` : formatCurrency(tier.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InventorySection({ product }: { product: Product }) {
  const stock = product.stock ?? 0;
  const threshold = product.lowStockThreshold ?? 5;
  const stockClass = stock === 0 ? 'text-red-600' : stock <= threshold ? 'text-amber-600' : 'text-origen-bosque';
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-origen-crema/40 p-3">
        <InfoRow label="SKU" value={<span className="font-mono">{product.sku}</span>} />
        {product.barcode && <InfoRow label="Codigo de barras" value={<span className="font-mono">{product.barcode}</span>} />}
        <InfoRow label="Stock actual" value={<span className={cn('font-bold', stockClass)}>{stock} uds.</span>} />
        <InfoRow label="Alerta stock bajo" value={`${threshold} uds.`} />
        <InfoRow label="Control inventario" value={product.trackInventory ? 'Si' : 'No'} />
        <InfoRow label="Sin stock" value={product.allowBackorders ? 'Permitido' : 'No permitido'} />
      </div>
      {(product.weight || product.dimensions) && (
        <div className="rounded-xl bg-origen-crema/40 p-3">
          {product.weight && <InfoRow label="Peso" value={`${product.weight} ${product.weightUnit || 'kg'}`} />}
          {product.dimensions && (
            <InfoRow label="Medidas" value={`${product.dimensions.length || 0}x${product.dimensions.width || 0}x${product.dimensions.height || 0} cm`} />
          )}
          {product.shippingClass && <InfoRow label="Clase envio" value={product.shippingClass} />}
        </div>
      )}
    </div>
  );
}

function AttributesSection({ product }: { product: Product }) {
  const visible = product.attributes.filter(a => a.visible);
  if (!visible.length) return <p className="text-xs text-text-subtle text-center py-4">Sin atributos definidos</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {visible.map(attr => (
        <div key={attr.id} className="p-3 rounded-xl border border-border-subtle bg-origen-crema/20">
          <p className="text-[10px] text-text-subtle uppercase tracking-wider mb-0.5">{attr.name}</p>
          <p className="text-sm font-semibold text-origen-bosque truncate">
            {attr.type === 'boolean' ? (attr.value ? 'Si' : 'No') : String(attr.value)}
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

function StatusCard({ product, onStatusChange, onVisibilityChange, isUpdating }: {
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
    { to: 'active'   as const, label: 'Publicar',         icon: PlayCircle,  variant: 'primary'   as const, show: isDraft || isInactive },
    { to: 'inactive' as const, label: 'Pausar',            icon: PauseCircle, variant: 'secondary' as const, show: isActive },
    { to: 'draft'    as const, label: 'Pasar a borrador',  icon: FileText,    variant: 'ghost'     as const, show: isActive || isInactive },
  ].filter(t => t.show);

  return (
    <Card variant="elevated">
      <CardHeader spacing="sm">
        <CardTitle size="sm" className="flex items-center gap-2">
          <Send className="w-4 h-4 text-origen-pradera" />Estado y publicacion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-subtle">Estado actual</span>
          <StatusBadge status={product.status as any} />
        </div>
        {transitions.length > 0 && (
          <div className="flex flex-col gap-2">
            {transitions.map(t => (
              <Button key={t.to} variant={t.variant} size="sm" leftIcon={<t.icon className="w-4 h-4" />}
                onClick={() => onStatusChange(t.to)} disabled={isUpdating} loading={isUpdating}
                loadingText="Actualizando..." className="w-full"
              >{t.label}</Button>
            ))}
          </div>
        )}
        <div className="border-t border-border-subtle pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {isPublic ? <Globe className="w-4 h-4 text-origen-pradera shrink-0" /> : <Lock className="w-4 h-4 text-text-subtle shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-origen-bosque leading-tight">
                  {isPublic ? 'Visible en marketplace' : 'Oculto en marketplace'}
                </p>
                <p className="text-xs text-text-subtle leading-tight mt-0.5">
                  {isPublic ? 'Los compradores pueden verlo' : 'Solo visible para ti'}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={onVisibilityChange}
              disabled={isUpdating || isDraft} aria-label="Visibilidad en marketplace"
              trackCheckedColor="bg-origen-bosque" />
          </div>
          {isDraft && (
            <p className="text-[11px] text-text-subtle mt-2 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" />
              Publica el producto para hacerlo visible.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ProductoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct]     = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      if (res.error) {
        toast({ title: 'Error', description: res.error, variant: 'error' });
      } else if (res.data) {
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
      if (res.error) {
        toast({ title: 'Error', description: res.error, variant: 'error' });
      } else if (res.data) {
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
      if (res.error) {
        toast({ title: 'Error al eliminar', description: res.error, variant: 'error' });
      } else {
        toast({ title: 'Producto eliminado', description: `"${product.name}" fue eliminado.` });
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
    try { return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return 'Fecha invalida'; }
  };

  const formatCurrency = (value?: number | null) => {
    if (value == null) return '0,00 EUR';
    return value.toFixed(2).replace('.', ',') + ' EUR';
  };

  // ==========================================================================
  // GUARDS
  // ==========================================================================

  if (isLoading) return <PageLoader message="Cargando producto..." />;
  if (error || !product) return (
    <PageError title="Error al cargar" message={error || 'Producto no encontrado'} onRetry={loadProduct} />
  );

  // ==========================================================================
  // DATOS DERIVADOS
  // ==========================================================================

  const hasDiscount = product.comparePrice != null && product.basePrice != null && product.comparePrice > product.basePrice;
  const discountPct = hasDiscount && product.comparePrice && product.basePrice
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100) : 0;
  const stock = product.stock ?? 0;
  const threshold = product.lowStockThreshold ?? 5;
  const stockLevel = stock === 0 ? 'error' : stock <= threshold ? 'warning' : 'success';

  const metrics = [
    { label: 'Precio', value: formatCurrency(product.basePrice), icon: DollarSign, color: 'text-origen-pradera', bg: 'bg-origen-pradera/8 border-origen-pradera/15' },
    { label: 'Stock', value: `${stock} uds`, icon: Package, color: stockLevel === 'error' ? 'text-feedback-danger' : stockLevel === 'warning' ? 'text-amber-500' : 'text-origen-hoja', bg: stockLevel === 'error' ? 'bg-feedback-danger-subtle/50 border-red-100' : stockLevel === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-origen-hoja/5 border-origen-hoja/20' },
    { label: 'Valoracion', value: product.rating?.toFixed(1) || '—', sub: `${product.reviewCount || 0} resenas`, icon: Star, color: 'text-origen-menta', bg: 'bg-origen-menta/10 border-origen-menta/30' },
    { label: 'Ventas', value: String(product.sales || 0), sub: formatCurrency(product.revenue), icon: TrendingUp, color: 'text-origen-bosque', bg: 'bg-origen-bosque/5 border-origen-bosque/10' },
    { label: 'Vistas', value: String(product.views || 0), icon: Eye, color: 'text-origen-pradera', bg: 'bg-origen-crema/80 border-origen-pradera/20' },
    { label: 'Conversion', value: `${product.conversion?.toFixed(1) || '0.0'}%`, icon: ShoppingBag, color: 'text-origen-hoja', bg: 'bg-origen-hoja/5 border-origen-hoja/20' },
    { label: 'Margen', value: `${discountPct}%`, icon: Percent, color: 'text-origen-pradera', bg: 'bg-origen-crema/80 border-origen-pradera/20' },
  ];

  const tabSections = [
    { id: 'nutritional', label: 'Nutricional', icon: FlaskConical, show: !!product.nutritionalInfo,
      content: product.nutritionalInfo ? <NutritionalSection info={product.nutritionalInfo} /> : null },
    { id: 'production', label: 'Produccion', icon: Leaf, show: !!product.productionInfo,
      content: product.productionInfo ? <ProductionSection info={product.productionInfo} formatDate={formatDate} /> : null },
    { id: 'pricing', label: 'Precios', icon: DollarSign, show: true,
      content: <PricingSection product={product} formatCurrency={formatCurrency} hasDiscount={hasDiscount} discountPct={discountPct} /> },
    { id: 'inventory', label: 'Inventario', icon: Archive, show: true,
      content: <InventorySection product={product} /> },
    { id: 'attributes', label: 'Atributos', icon: Tag, show: product.attributes.length > 0,
      content: <AttributesSection product={product} /> },
  ].filter(s => s.show);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <MobilePullRefresh onRefresh={loadProduct}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="lg:min-h-screen lg:bg-gradient-to-b lg:from-white lg:to-origen-crema pb-[calc(152px+env(safe-area-inset-bottom))] lg:pb-8"
      >
        {/* ── CABECERA ── */}
        <PageHeader
          title={product.name}
          description={`${product.categoryName || product.categoryId} · ${product.sku || 'Sin SKU'}`}
          badgeIcon={Package}
          badgeText={product.status === 'active' ? 'Activo' : product.status === 'inactive' ? 'Inactivo' : product.status === 'out_of_stock' ? 'Sin stock' : 'Borrador'}
          tooltip="Detalle del producto"
          showBackButton
          onBack={() => router.back()}
          actions={
            <div className="hidden lg:flex items-center gap-2">
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Button variant="secondary" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
              </Link>
              <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                Eliminar
              </Button>
            </div>
          }
        />

        <div className="px-4 sm:px-6 lg:px-8 pt-4">

          {/* ── PRECIO HERO (solo móvil) ── */}
          <motion.div custom={0} variants={itemVariants} initial="hidden" animate="visible" className="lg:hidden mb-4">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-origen-bosque to-origen-pino text-white relative overflow-hidden">
              <div className="absolute right-4 top-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">Precio de venta</p>
                <button onClick={() => setShowStatusSheet(true)}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-full px-3 py-1 transition-colors"
                  aria-label="Gestionar estado">
                  <MoreVertical className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Gestionar</span>
                </button>
              </div>
              <p className="text-4xl font-extrabold tabular-nums">{formatCurrency(product.basePrice)}</p>
              {hasDiscount && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-white/50 line-through text-sm">{formatCurrency(product.comparePrice)}</span>
                  <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">-{discountPct}%</span>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <StatusBadge status={product.status as any} />
                {product.visibility === 'public'
                  ? <Badge variant="leaf" icon={<Globe className="w-3 h-3" />}>Marketplace</Badge>
                  : <Badge variant="neutral" icon={<Lock className="w-3 h-3" />}>Oculto</Badge>}
              </div>
            </div>
          </motion.div>

          {/* ── GRID MÉTRICAS MÓVIL ── */}
          <motion.div custom={1} variants={itemVariants} initial="hidden" animate="visible" className="lg:hidden grid grid-cols-2 gap-3 mb-5">
            {metrics.map((m, i) => (
              <div key={m.label} className={`rounded-2xl p-4 border ${m.bg}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-xs text-text-subtle">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-origen-bosque">{m.value}</p>
                {m.sub && <p className="text-xs text-text-subtle">{m.sub}</p>}
              </div>
            ))}
          </motion.div>

          {/* ── MÉTRICAS DESKTOP ── */}
          <div className="hidden lg:grid grid-cols-7 gap-4 mb-8">
            {metrics.map((m, i) => (
              <div key={m.label} className={`p-4 rounded-xl border ${m.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                  <span className="text-xs font-medium text-text-subtle">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-origen-bosque">{m.value}</p>
                {m.sub && <p className="text-xs text-text-subtle mt-1">{m.sub}</p>}
              </div>
            ))}
          </div>

          {/* ── DOS COLUMNAS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">

            {/* COLUMNA IZQUIERDA */}
            <div className="lg:col-span-4 space-y-4">

              {/* Estado — solo desktop */}
              <motion.div custom={2} variants={itemVariants} initial="hidden" animate="visible" className="hidden lg:block">
                <StatusCard product={product} onStatusChange={handleStatusChange}
                  onVisibilityChange={handleVisibilityChange} isUpdating={isUpdating} />
              </motion.div>

              {/* Imagen */}
              <motion.div custom={3} variants={itemVariants} initial="hidden" animate="visible">
                <Card variant="elevated">
                  <CardContent className="p-4">
                    <div className="aspect-[4/3] lg:aspect-square rounded-xl bg-gradient-to-br from-origen-crema to-gray-100 flex items-center justify-center overflow-hidden">
                      {product.mainImage ? (
                        <ProductImg src={product.mainImage.url} alt={product.mainImage.alt || product.name} className="w-full h-full object-cover" />
                      ) : product.gallery?.[0] ? (
                        <ProductImg src={product.gallery[0].url} alt={product.gallery[0].alt || product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-20 h-20 text-origen-pradera/30" />
                      )}
                    </div>
                    {product.gallery && product.gallery.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-4">
                        {product.gallery.slice(1, 5).map((img, idx) => (
                          <div key={img.id} className="w-16 h-16 shrink-0 lg:w-auto lg:h-auto lg:aspect-square rounded-lg bg-origen-crema/50 overflow-hidden">
                            <ProductImg src={img.url} alt={img.alt || `Imagen ${idx + 2}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Datos basicos */}
              <motion.div custom={4} variants={itemVariants} initial="hidden" animate="visible">
                <Card variant="elevated">
                  <CardHeader spacing="sm">
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-origen-pradera" />Datos del producto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InfoRow label="Categoria" value={`${product.categoryName || product.categoryId}${product.subcategoryId ? ` / ${product.subcategoryId}` : ''}`} />
                    <InfoRow label="Origen" value={product.productionInfo?.origin} />
                    <InfoRow label="Productor" value={product.productionInfo?.farmName} />
                    {product.weight && <InfoRow label="Peso" value={`${product.weight} ${product.weightUnit || 'kg'}`} />}
                    <InfoRow label="Clase de envio" value={product.shippingClass} />
                    <InfoRow label="Lote" value={product.productionInfo?.batchNumber} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Certificaciones */}
              {product.certifications?.length > 0 && (
                <motion.div custom={5} variants={itemVariants} initial="hidden" animate="visible">
                  <Card variant="elevated">
                    <CardHeader spacing="sm">
                      <CardTitle size="sm" className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-origen-pradera" />Certificaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {product.certifications.map(cert => (
                          <div key={cert.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-origen-pastel/30 border border-origen-pradera/20">
                            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', cert.verified ? 'bg-green-100' : 'bg-origen-crema')}>
                              {cert.verified
                                ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                : <Award className="w-3.5 h-3.5 text-origen-pradera" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-origen-bosque truncate">{cert.name}</p>
                              {cert.issuingBody && <p className="text-[10px] text-text-subtle truncate">{cert.issuingBody}</p>}
                            </div>
                            {cert.expiryDate && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                {new Date(cert.expiryDate).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* COLUMNA DERECHA */}
            <div className="lg:col-span-8">
              <motion.div custom={3} variants={itemVariants} initial="hidden" animate="visible" className="space-y-4">

                {/* Descripcion */}
                <Card variant="elevated" className="p-4 lg:p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-origen-pradera" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-origen-bosque mb-2">Descripcion</h2>
                      <p className="text-sm text-foreground leading-relaxed mb-3">{product.shortDescription}</p>
                      {product.fullDescription && (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.fullDescription}</p>
                      )}
                    </div>
                  </div>
                  {product.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-subtle">
                      {product.tags.map(tag => <Badge key={tag} variant="leaf" icon={<Tag className="h-3 w-3" />}>{tag}</Badge>)}
                    </div>
                  )}
                </Card>

                {/* ACORDEON (movil) */}
                <div className="lg:hidden space-y-2">
                  {tabSections.map((s, i) => (
                    <SectionCard key={s.id} title={s.label} icon={s.icon} defaultOpen={i === 0}>
                      {s.content}
                    </SectionCard>
                  ))}
                </div>

                {/* TABS (desktop) */}
                <div className="hidden lg:block">
                  <Card variant="elevated" className="p-4 lg:p-6">
                    <Tabs defaultValue={tabSections[0]?.id} className="w-full">
                      <TabsList className={`grid w-full p-1 bg-origen-crema/50 rounded-xl mb-6`} style={{ gridTemplateColumns: `repeat(${tabSections.length}, 1fr)` }}>
                        {tabSections.map(s => (
                          <TabsTrigger key={s.id} value={s.id} className="rounded-lg data-[state=active]:bg-white flex items-center gap-2">
                            <s.icon className="w-4 h-4" /><span>{s.label}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {tabSections.map(s => (
                        <TabsContent key={s.id} value={s.id} className="mt-0">{s.content}</TabsContent>
                      ))}
                    </Tabs>
                  </Card>
                </div>

              </motion.div>
            </div>
          </div>
        </div>

        {/* ── ACTION BAR MOVIL ── */}
        <ActionBar
          primaryAction={{ id: 'edit', label: 'Editar producto', leftIcon: <Edit className="w-4 h-4" />,
            onClick: () => router.push(`/dashboard/products/${product.id}/edit`) }}
          secondaryActions={[
            { id: 'status', label: 'Gestionar estado', leftIcon: <Send className="w-4 h-4" />, variant: 'secondary',
              onClick: () => setShowStatusSheet(true), disabled: isUpdating },
            { id: 'delete', label: 'Eliminar', leftIcon: <Trash2 className="w-4 h-4" />, variant: 'destructive',
              onClick: () => setShowDeleteDialog(true), disabled: isDeleting },
          ]}
        />

        {/* ── BOTTOM SHEET ESTADO (movil) ── */}
        <Sheet open={showStatusSheet} onOpenChange={setShowStatusSheet}>
          <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
            <SheetHeader className="mb-5">
              <SheetTitle className="text-left text-origen-bosque">Gestionar producto</SheetTitle>
            </SheetHeader>
            <StatusCard product={product}
              onStatusChange={async s => { await handleStatusChange(s); setShowStatusSheet(false); }}
              onVisibilityChange={async v => { await handleVisibilityChange(v); setShowStatusSheet(false); }}
              isUpdating={isUpdating} />
          </SheetContent>
        </Sheet>

        {/* ── DIALOGO ELIMINAR ── */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <DialogTitle>Eliminar producto?</DialogTitle>
              </div>
              <DialogDescription>Esta accion no se puede deshacer.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Se eliminara permanentemente{' '}
              <span className="font-semibold text-origen-bosque">{product.name}</span>{' '}
              del catalogo, incluyendo todas sus variantes, imagenes y estadisticas.
            </p>
            {product.sales && product.sales > 0 && (
              <p className="text-amber-600 text-sm flex items-center gap-1 mt-2">
                <AlertTriangle className="w-4 h-4" />
                Este producto tiene {product.sales} ventas registradas.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} loading={isDeleting} loadingText="Eliminando...">
                Eliminar permanentemente
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </motion.div>
    </MobilePullRefresh>
  );
}
