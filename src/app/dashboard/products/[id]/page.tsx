/**
 * @page ProductoDetallePage
 * @description Página de detalle de producto — experiencia app nativa
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Componentes UI
import { Button } from '@/components/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
import { Badge } from '@/components/ui/atoms/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/atoms/tabs';
import { Modal } from '@/components/ui/atoms/dialog';
import { PageHeader } from '../../components/PageHeader';
import { MobilePullRefresh } from '@/components/features/dashboard/components/mobile';
import { ProductImage } from '@/components/ui/atoms/product-image';

// Iconos
import {
  Package, Eye, Trash2, DollarSign, TrendingUp, Star, Tag, CheckCircle, AlertCircle,
  Clock, FileText, Award, Leaf, FlaskConical, Droplet,
  Milk, Percent, Info, AlertTriangle, ShoppingBag, Wheat, Bean, Nut, Egg, Fish,
  Shell, Sprout, RefreshCw, Edit, ChevronDown, Thermometer, Archive, ArrowLeft,
} from 'lucide-react';

import { type Product } from '@/types/product';
import { fetchProductById, deleteProduct } from '@/lib/api/products';

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const StatusBadge = ({ status }: { status: Product['status'] }) => {
  const statusMap = {
    active:       { variant: 'success' as const, label: 'Activo',    icon: CheckCircle },
    inactive:     { variant: 'neutral' as const, label: 'Inactivo',  icon: Clock       },
    out_of_stock: { variant: 'danger'  as const, label: 'Sin stock', icon: AlertCircle },
    draft:        { variant: 'neutral' as const, label: 'Borrador',  icon: FileText    },
  };
  const { variant, label, icon: Icon } = statusMap[status] || statusMap.draft;
  return <Badge variant={variant} icon={<Icon className="w-3 h-3" />}>{label}</Badge>;
};

// ── Acordeón de sección (solo móvil) ──────────────────────────────────────────
function SectionAccordion({
  title, icon: Icon, defaultOpen = false, children,
}: { title: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left"
      >
        <div className="w-8 h-8 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
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

// ── Skeleton de carga estructurado ────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    {/* Header skeleton */}
    <div className="h-16 bg-origen-pastel/60 mb-1" />
    <div className="px-4 sm:px-6 lg:px-8 pt-4 space-y-4">
      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <div className="col-span-2 h-24 rounded-2xl bg-origen-pastel/60" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-origen-pastel/60" />
        ))}
      </div>
      <div className="hidden lg:grid lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-origen-pastel/60" />
        ))}
      </div>
      {/* Two-col layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="aspect-square rounded-2xl bg-origen-pastel/60" />
          <div className="h-40 rounded-2xl bg-origen-pastel/60" />
        </div>
        <div className="lg:col-span-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-origen-pastel/60" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── Fila de dato (para tablas de info) ───────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border-subtle last:border-0">
      <span className="text-xs text-text-subtle shrink-0">{label}</span>
      <span className="text-xs font-medium text-origen-bosque text-right">{value}</span>
    </div>
  );
}

// ── Contenido nutricional ─────────────────────────────────────────────────────
function NutritionalContent({ info }: { info: NonNullable<Product['nutritionalInfo']> }) {
  const allergenIcon = (a: string) => {
    const icons: Record<string, React.ElementType> = {
      Gluten: Wheat, Crustáceos: Shell, Huevos: Egg, Pescado: Fish,
      Cacahuetes: Nut, Soja: Bean, Lácteos: Milk, Sésamo: Sprout,
      Sulfitos: Droplet,
    };
    return icons[a] || AlertCircle;
  };

  const dietaryFlags = [
    { key: 'isGlutenFree', label: 'Sin gluten' },
    { key: 'isLactoseFree', label: 'Sin lactosa' },
    { key: 'isVegan', label: 'Vegano' },
    { key: 'isVegetarian', label: 'Vegetariano' },
    { key: 'isNutFree', label: 'Sin frutos secos' },
  ] as const;

  const activeDietary = dietaryFlags.filter(f => info[f.key]);

  return (
    <div className="space-y-4">
      {/* Valores nutricionales */}
      <div className="rounded-xl bg-origen-crema/40 p-3">
        <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-2">
          Por {info.servingSize}
        </p>
        <div className="grid grid-cols-2 gap-x-4">
          {info.calories != null && <InfoRow label="Calorías" value={`${info.calories} kcal`} />}
          {info.protein != null && <InfoRow label="Proteínas" value={`${info.protein} g`} />}
          {info.totalFat != null && <InfoRow label="Grasas totales" value={`${info.totalFat} g`} />}
          {info.saturatedFat != null && <InfoRow label="  · Saturadas" value={`${info.saturatedFat} g`} />}
          {info.carbohydrates != null && <InfoRow label="Hidratos" value={`${info.carbohydrates} g`} />}
          {info.sugars != null && <InfoRow label="  · Azúcares" value={`${info.sugars} g`} />}
          {info.dietaryFiber != null && <InfoRow label="Fibra" value={`${info.dietaryFiber} g`} />}
          {info.sodium != null && <InfoRow label="Sodio" value={`${info.sodium} mg`} />}
        </div>
      </div>

      {/* Etiquetas dietéticas */}
      {activeDietary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeDietary.map(f => (
            <Badge key={f.key} variant="leaf" size="sm">
              <CheckCircle className="w-3 h-3 mr-1" />{f.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Alérgenos */}
      {info.allergens.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-2">Alérgenos</p>
          <div className="flex flex-wrap gap-1.5">
            {info.allergens.map(a => {
              const Icon = allergenIcon(a);
              return (
                <span key={a} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-feedback-danger-subtle text-red-700 text-xs">
                  <Icon className="w-3 h-3" />{a}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Ingredientes */}
      {info.ingredients.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-1.5">Ingredientes</p>
          <p className="text-xs text-text-subtle leading-relaxed">{info.ingredients.join(', ')}</p>
        </div>
      )}

      {/* Almacenamiento */}
      {info.storageInstructions && (
        <div className="flex items-start gap-2 rounded-xl bg-origen-pastel/40 p-3">
          <Thermometer className="w-4 h-4 text-origen-pino mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-0.5">Conservación</p>
            <p className="text-xs text-origen-bosque">{info.storageInstructions}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Contenido de producción ───────────────────────────────────────────────────
function ProductionContent({ info, formatDate }: {
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
        <InfoRow label="Método" value={info.productionMethod} />
        <InfoRow label="Lote" value={info.batchNumber} />
        <InfoRow label="Cosecha" value={info.harvestDate ? formatDate(info.harvestDate) : undefined} />
        <InfoRow label="Caducidad" value={info.expiryDate ? formatDate(info.expiryDate) : undefined} />
      </div>
      {info.practices && info.practices.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-2">Prácticas</p>
          <div className="flex flex-wrap gap-1.5">
            {info.practices.map(p => (
              <Badge key={p} variant="leaf" size="sm">
                <Leaf className="w-3 h-3 mr-1" />{p}
              </Badge>
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

// ── Contenido de precios ──────────────────────────────────────────────────────
function PricingContent({
  product, formatCurrency, hasDiscount, discountPercentage,
}: {
  product: Product;
  formatCurrency: (v?: number | null) => string;
  hasDiscount: boolean;
  discountPercentage: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-origen-crema/40 p-3">
        <InfoRow label="Precio base" value={<span className="font-bold text-origen-bosque text-sm">{formatCurrency(product.basePrice)}</span>} />
        {product.comparePrice && <InfoRow label="Precio comparación" value={formatCurrency(product.comparePrice)} />}
        {hasDiscount && <InfoRow label="Descuento" value={<span className="text-green-600 font-medium">−{discountPercentage}%</span>} />}
      </div>
      {product.priceTiers && product.priceTiers.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-2">Precios por volumen</p>
          <div className="space-y-2">
            {product.priceTiers.map(tier => (
              <div key={tier.id} className="flex items-center justify-between rounded-xl border border-border-subtle p-3 text-xs">
                <span className="text-text-subtle">
                  {tier.minQuantity}{tier.maxQuantity ? `–${tier.maxQuantity}` : '+'} uds.
                </span>
                <span className="font-semibold text-origen-bosque">
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

// ── Contenido de inventario ───────────────────────────────────────────────────
function InventoryContent({ product }: { product: Product }) {
  const stockLevel = product.stock ?? 0;
  const lowStockThreshold = product.lowStockThreshold ?? 5;
  const stockColor = stockLevel === 0 ? 'text-red-600' : stockLevel <= lowStockThreshold ? 'text-amber-600' : 'text-origen-bosque';

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-origen-crema/40 p-3">
        <InfoRow label="SKU" value={<span className="font-mono">{product.sku}</span>} />
        {product.barcode && <InfoRow label="Código de barras" value={<span className="font-mono">{product.barcode}</span>} />}
        <InfoRow label="Stock actual" value={<span className={cn('font-bold', stockColor)}>{stockLevel} uds.</span>} />
        <InfoRow label="Alerta stock bajo" value={`${lowStockThreshold} uds.`} />
        <InfoRow label="Control de inventario" value={product.trackInventory ? 'Sí' : 'No'} />
        <InfoRow label="Pedidos sin stock" value={product.allowBackorders ? 'Permitidos' : 'No permitidos'} />
      </div>
      {(product.weight || product.dimensions) && (
        <div>
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-wider mb-2">Dimensiones</p>
          <div className="rounded-xl bg-origen-crema/40 p-3">
            {product.weight && <InfoRow label="Peso" value={`${product.weight} ${product.weightUnit || 'kg'}`} />}
            {product.dimensions && (
              <InfoRow label="Medidas" value={`${product.dimensions.length || 0}×${product.dimensions.width || 0}×${product.dimensions.height || 0} cm`} />
            )}
            {product.shippingClass && <InfoRow label="Clase de envío" value={product.shippingClass} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Contenido de atributos ────────────────────────────────────────────────────
function AttributesContent({ product }: { product: Product }) {
  const visible = product.attributes.filter(a => a.visible);
  if (!visible.length) return <p className="text-xs text-text-subtle text-center py-4">Sin atributos definidos</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {visible.map(attr => (
        <div key={attr.id} className="p-3 rounded-xl border border-border-subtle bg-origen-crema/20">
          <p className="text-[10px] text-text-subtle uppercase tracking-wider mb-0.5">{attr.name}</p>
          <p className="text-sm font-semibold text-origen-bosque truncate">
            {attr.type === 'boolean' ? (attr.value ? 'Sí' : 'No') : attr.value}
            {attr.unit && attr.type !== 'boolean' ? ` ${attr.unit}` : ''}
          </p>
        </div>
      ))}
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

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchProductById(productId);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setProduct(response.data);
      } else {
        setError('Producto no encontrado');
      }
    } catch (err) {
      setError('Error al cargar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      const response = await deleteProduct(product.id);
      if (response.error) {
        setError(response.error);
      } else {
        router.push('/products');
      }
    } catch {
      setError('Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return 'No disponible';
    try {
      return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return 'Fecha inválida'; }
  };

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return '0,00 €';
    return value.toFixed(2).replace('.', ',') + ' €';
  };

  if (isLoading) return <LoadingSkeleton />;

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-feedback-danger-subtle flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-feedback-danger" />
        </div>
        <h2 className="text-lg font-bold text-origen-bosque mb-2">Error al cargar</h2>
        <p className="text-sm text-text-subtle mb-6 max-w-xs">{error || 'Producto no encontrado'}</p>
        <div className="flex gap-3">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>
            Volver
          </Button>
          <Button variant="primary" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadProduct}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const hasDiscount = product.comparePrice != null && product.basePrice != null && product.comparePrice > product.basePrice;
  const discountPercentage = hasDiscount && product.comparePrice && product.basePrice
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
    : 0;

  const stockLevel = product.stock ?? 0;
  const lowStockThreshold = product.lowStockThreshold ?? 5;
  const stockColor = stockLevel === 0 ? 'error' : stockLevel <= lowStockThreshold ? 'warning' : 'success';

  // Secciones del acordeón / tabs
  const sections = [
    {
      id: 'nutritional', title: 'Nutricional', icon: FlaskConical, show: !!product.nutritionalInfo,
      content: product.nutritionalInfo
        ? <NutritionalContent info={product.nutritionalInfo} />
        : <p className="text-xs text-text-subtle text-center py-4">Sin información nutricional</p>,
    },
    {
      id: 'production', title: 'Producción', icon: Leaf, show: !!product.productionInfo,
      content: product.productionInfo
        ? <ProductionContent info={product.productionInfo} formatDate={formatDate} />
        : <p className="text-xs text-text-subtle text-center py-4">Sin información de producción</p>,
    },
    {
      id: 'pricing', title: 'Precios', icon: DollarSign, show: true,
      content: <PricingContent product={product} formatCurrency={formatCurrency} hasDiscount={hasDiscount} discountPercentage={discountPercentage} />,
    },
    {
      id: 'inventory', title: 'Inventario', icon: Archive, show: true,
      content: <InventoryContent product={product} />,
    },
    {
      id: 'attributes', title: 'Atributos', icon: Tag, show: product.attributes.length > 0,
      content: <AttributesContent product={product} />,
    },
  ];

  const handleRefresh = async () => { await loadProduct(); };

  // Animaciones staggered para las cards
  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 28, delay: i * 0.07 },
    }),
  };

  return (
    <MobilePullRefresh onRefresh={handleRefresh}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="lg:min-h-screen lg:bg-gradient-to-b lg:from-white lg:to-origen-crema pb-[calc(152px+env(safe-area-inset-bottom))] lg:pb-8"
      >
        {/* Decorativos sutiles — en móvil también */}
        <div className="fixed top-0 right-0 w-80 h-80 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-30 lg:opacity-100" />
        <div className="fixed bottom-0 left-0 w-80 h-80 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-30 lg:opacity-100" />

        {/* ===== CABECERA ===== */}
        <PageHeader
          title={product.name}
          description={`${product.categoryName || product.categoryId} · ${product.sku || 'Sin SKU'}`}
          badgeIcon={Package}
          badgeText={product.status === 'active' ? 'Activo' : product.status === 'inactive' ? 'Inactivo' : product.status === 'out_of_stock' ? 'Sin stock' : 'Borrador'}
          tooltip="Detalle del producto"
          tooltipDetailed="Información completa del producto, incluyendo datos nutricionales, producción y métricas."
          showBackButton
          onBack={() => router.back()}
          actions={
            <div className="flex items-center gap-2">
              {product.certifications && product.certifications.length > 0 && (
                <Badge variant="leaf" icon={<Award className="h-4 w-4" />}>
                  {product.certifications.length} certificaciones
                </Badge>
              )}
              <div className="hidden lg:flex items-center gap-2">
                <Link href={`/dashboard/products/${product.id}/edit`}>
                  <Button variant="primary" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
                </Link>
                <Button
                  variant="destructive"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          }
        />

        {/* ===== CONTENIDO PRINCIPAL ===== */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-2">

          {/* ── Métricas móvil: precio destacado + grid 2×3 ── */}
          <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="lg:hidden mb-5">
            {/* Precio destacado */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-origen-bosque to-origen-pino text-white mb-3 relative overflow-hidden">
              <div className="absolute right-4 top-4 w-20 h-20 rounded-full bg-white/5" />
              <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Precio de venta</p>
              <p className="text-4xl font-extrabold tabular-nums">{formatCurrency(product.basePrice)}</p>
              {hasDiscount && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-white/50 line-through text-sm">{formatCurrency(product.comparePrice)}</span>
                  <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">−{discountPercentage}%</span>
                </div>
              )}
              <div className="mt-3">
                <StatusBadge status={product.status} />
              </div>
            </div>

            {/* Grid 2×3 de métricas */}
            <div className="grid grid-cols-2 gap-3">
              {/* Stock */}
              <motion.div custom={1} variants={cardVariants}
                className={cn('rounded-2xl p-4 border',
                  stockColor === 'error' ? 'bg-feedback-danger-subtle/80 border-red-100' :
                  stockColor === 'warning' ? 'bg-amber-50/80 border-amber-100' :
                  'bg-origen-pastel/60 border-origen-hoja/20'
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Package className={cn('w-4 h-4',
                    stockColor === 'error' ? 'text-feedback-danger' :
                    stockColor === 'warning' ? 'text-amber-500' : 'text-origen-hoja'
                  )} />
                  <span className="text-xs text-text-subtle">Stock</span>
                </div>
                <p className="text-2xl font-bold text-origen-bosque">{stockLevel}</p>
                <p className="text-xs text-text-subtle">unidades</p>
              </motion.div>

              {/* Valoración */}
              <motion.div custom={2} variants={cardVariants} className="rounded-2xl p-4 border bg-amber-50/80 border-amber-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-text-subtle">Valoración</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-origen-bosque">{product.rating?.toFixed(1) || '—'}</p>
                  <span className="text-xs text-text-disabled">/5</span>
                </div>
                <p className="text-xs text-text-subtle">{product.reviewCount || 0} reseñas</p>
              </motion.div>

              {/* Ventas */}
              <motion.div custom={3} variants={cardVariants} className="rounded-2xl p-4 border bg-blue-50/80 border-blue-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-text-subtle">Ventas</span>
                </div>
                <p className="text-2xl font-bold text-origen-bosque">{product.sales || 0}</p>
                <p className="text-xs text-text-subtle">{formatCurrency(product.revenue)}</p>
              </motion.div>

              {/* Vistas */}
              <motion.div custom={4} variants={cardVariants} className="rounded-2xl p-4 border bg-purple-50/80 border-purple-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-text-subtle">Vistas</span>
                </div>
                <p className="text-2xl font-bold text-origen-bosque">{product.views || 0}</p>
                {product.conversion && (
                  <p className="text-xs text-purple-600">{product.conversion.toFixed(1)}% conv.</p>
                )}
              </motion.div>

              {/* Conversión */}
              <motion.div custom={5} variants={cardVariants} className="rounded-2xl p-4 border bg-green-50/80 border-green-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShoppingBag className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-text-subtle">Conversión</span>
                </div>
                <p className="text-2xl font-bold text-origen-bosque">{product.conversion?.toFixed(1) || '0.0'}%</p>
                <p className="text-xs text-text-subtle">de vistas</p>
              </motion.div>

              {/* Margen */}
              <motion.div custom={6} variants={cardVariants} className="rounded-2xl p-4 border bg-origen-crema/80 border-origen-pradera/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <Percent className="w-4 h-4 text-origen-pradera" />
                  <span className="text-xs text-text-subtle">Margen</span>
                </div>
                <p className="text-2xl font-bold text-origen-bosque">
                  {product.comparePrice && product.comparePrice > product.basePrice
                    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-text-subtle">sobre PVP</p>
              </motion.div>
            </div>
          </motion.div>

          {/* ── Métricas desktop: fila horizontal ── */}
          <div className="hidden lg:block overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-8">
            <div className="grid grid-cols-7 gap-4 w-auto">
              <div className="p-4 bg-gradient-to-br from-origen-pradera/5 to-transparent rounded-xl border border-origen-pradera/10">
                <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-origen-pradera" /><span className="text-xs font-medium text-text-subtle">Precio</span></div>
                <p className="text-2xl font-bold text-origen-bosque">{formatCurrency(product.basePrice)}</p>
                {hasDiscount && <div className="flex items-center gap-1 mt-2 text-xs"><span className="text-text-disabled line-through">{formatCurrency(product.comparePrice)}</span><span className="text-green-600 font-medium">(-{discountPercentage}%)</span></div>}
              </div>
              <div className={cn('p-4 rounded-xl border', stockColor === 'error' ? 'bg-feedback-danger-subtle/50 border-red-100' : stockColor === 'warning' ? 'bg-amber-50/50 border-amber-100' : 'bg-origen-hoja/5 border-origen-hoja/20')}>
                <div className="flex items-center gap-2 mb-2"><Package className={cn('w-5 h-5', stockColor === 'error' ? 'text-feedback-danger' : stockColor === 'warning' ? 'text-amber-500' : 'text-origen-hoja')} /><span className="text-xs font-medium text-text-subtle">Stock</span></div>
                <p className="text-2xl font-bold text-origen-bosque">{stockLevel} uds</p>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 mb-2"><Star className="w-5 h-5 text-amber-500" /><span className="text-xs font-medium text-text-subtle">Valoración</span></div>
                <div className="flex items-baseline gap-1"><p className="text-2xl font-bold text-origen-bosque">{product.rating?.toFixed(1) || '0.0'}</p><span className="text-xs text-text-disabled">/5</span></div>
                <p className="text-xs text-text-subtle mt-2">{product.reviewCount || 0} reseñas</p>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-blue-500" /><span className="text-xs font-medium text-text-subtle">Ventas</span></div>
                <p className="text-2xl font-bold text-origen-bosque">{product.sales || 0}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-600"><DollarSign className="w-3 h-3" /><span>{formatCurrency(product.revenue)}</span></div>
              </div>
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-2"><Eye className="w-5 h-5 text-purple-500" /><span className="text-xs font-medium text-text-subtle">Vistas</span></div>
                <p className="text-2xl font-bold text-origen-bosque">{product.views || 0}</p>
                {product.conversion && <div className="flex items-center gap-1 mt-2 text-xs text-purple-600"><TrendingUp className="w-3 h-3" /><span>{product.conversion.toFixed(1)}% conv.</span></div>}
              </div>
              <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-green-500" /><span className="text-xs font-medium text-text-subtle">Conversión</span></div>
                <p className="text-2xl font-bold text-origen-bosque">{product.conversion?.toFixed(1) || '0.0'}%</p>
              </div>
              <div className="p-4 bg-origen-crema/50 rounded-xl border border-origen-pradera/10">
                <div className="flex items-center gap-2 mb-2"><Percent className="w-5 h-5 text-origen-pradera" /><span className="text-xs font-medium text-text-subtle">Margen</span></div>
                <p className="text-2xl font-bold text-origen-bosque">
                  {product.comparePrice && product.comparePrice > product.basePrice ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* ===== DOS COLUMNAS ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* COLUMNA IZQUIERDA (4/12) */}
            <div className="lg:col-span-4 space-y-4">

              {/* Imagen principal */}
              <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
                <Card variant="elevated" hoverEffect="organic">
                  <CardContent className="p-4">
                    <div className="aspect-[4/3] lg:aspect-square rounded-xl bg-gradient-to-br from-origen-crema to-gray-100 flex items-center justify-center overflow-hidden">
                      {product.mainImage ? (
                        <ProductImage src={product.mainImage.url} alt={product.mainImage.alt || product.name} className="w-full h-full object-cover" />
                      ) : product.gallery && product.gallery.length > 0 ? (
                        <ProductImage src={product.gallery[0].url} alt={product.gallery[0].alt || product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-20 h-20 text-origen-pradera/30" />
                      )}
                    </div>
                    {product.gallery && product.gallery.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-4">
                        {product.gallery.slice(1, 5).map((img, idx) => (
                          <div key={img.id} className="w-16 h-16 shrink-0 lg:w-auto lg:h-auto lg:aspect-square rounded-lg bg-origen-crema/50 overflow-hidden">
                            <ProductImage src={img.url} alt={img.alt || `Imagen ${idx + 2}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Datos básicos */}
              <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
                <Card variant="elevated" hoverEffect="organic">
                  <CardHeader spacing="sm">
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-origen-pradera" />Datos del producto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-0">
                      <InfoRow label="Categoría" value={`${product.categoryName || product.categoryId}${product.subcategoryId ? ` / ${product.subcategoryId}` : ''}`} />
                      <InfoRow label="Origen" value={product.productionInfo?.origin} />
                      <InfoRow label="Productor" value={product.productionInfo?.farmName} />
                      {product.weight && <InfoRow label="Peso" value={`${product.weight} ${product.weightUnit || 'kg'}`} />}
                      <InfoRow label="Clase de envío" value={product.shippingClass} />
                      <InfoRow label="Lote" value={product.productionInfo?.batchNumber} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Certificaciones */}
              {product.certifications && product.certifications.length > 0 && (
                <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
                  <Card variant="elevated" hoverEffect="organic">
                    <CardHeader spacing="sm">
                      <CardTitle size="sm" className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-origen-pradera" />Certificaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {product.certifications.map(cert => (
                          <div key={cert.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-origen-pastel/30 border border-origen-pradera/20">
                            {/* Icono verificación */}
                            <div className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                              cert.verified ? 'bg-green-100' : 'bg-origen-crema',
                            )}>
                              {cert.verified
                                ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                : <Award className="w-3.5 h-3.5 text-origen-pradera" />}
                            </div>
                            {/* Nombre + organismo */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-origen-bosque truncate leading-tight">{cert.name}</p>
                              {cert.issuingBody && (
                                <p className="text-[10px] text-text-subtle truncate leading-tight">{cert.issuingBody}</p>
                              )}
                            </div>
                            {/* Caducidad — compacta, siempre en una línea */}
                            {cert.expiryDate && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
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

            {/* COLUMNA DERECHA (8/12) */}
            <div className="lg:col-span-8">
              <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
                {/* Descripción */}
                <Card variant="elevated" hoverEffect="organic" className="p-4 lg:p-6 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-origen-pradera" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-origen-bosque mb-2">Descripción</h2>
                      <p className="text-sm text-foreground leading-relaxed mb-3">{product.shortDescription}</p>
                      {product.fullDescription && (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.fullDescription}</p>
                      )}
                    </div>
                  </div>
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-subtle">
                      {product.tags.map(tag => (
                        <Badge key={tag} variant="leaf" icon={<Tag className="h-3 w-3" />}>{tag}</Badge>
                      ))}
                    </div>
                  )}
                </Card>

                {/* ── Acordeón (móvil) ── */}
                <div className="lg:hidden space-y-2">
                  {sections.filter(s => s.show).map((section, i) => (
                    <SectionAccordion
                      key={section.id}
                      title={section.title}
                      icon={section.icon}
                      defaultOpen={i === 0}
                    >
                      {section.content}
                    </SectionAccordion>
                  ))}
                </div>

                {/* ── Pestañas (desktop) ── */}
                <div className="hidden lg:block">
                  <Card variant="elevated" hoverEffect="organic" className="p-4 lg:p-6">
                    <Tabs defaultValue="nutritional" className="w-full">
                      <TabsList className="grid w-full grid-cols-5 p-1 bg-origen-crema/50 rounded-xl mb-6">
                        {sections.map(s => (
                          <TabsTrigger key={s.id} value={s.id} className="rounded-lg data-[state=active]:bg-white flex items-center gap-2">
                            <s.icon className="w-4 h-4" />
                            <span>{s.title}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {sections.map(s => (
                        <TabsContent key={s.id} value={s.id} className="mt-0">
                          {s.content}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ===== ACCIONES STICKY — SOLO MÓVIL ===== */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+80px)] pt-3 bg-gradient-to-t from-surface via-surface/95 to-transparent pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            {/* Editar — CTA principal */}
            <Link href={`/dashboard/products/${product.id}/edit`} className="flex-1">
              <Button variant="primary" size="lg" leftIcon={<Edit className="w-4 h-4" />}>
                Editar producto
              </Button>
            </Link>
            {/* Eliminar — icono solo, acción destructiva controlada */}
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              aria-label="Eliminar producto"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ===== DIÁLOGO DE ELIMINACIÓN ===== */}
        <Modal
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title="¿Eliminar producto?"
          description="Esta acción no se puede deshacer."
          icon={<Trash2 className="w-5 h-5 text-red-600" />}
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={isDeleting}
                loadingText="Eliminando..."
              >
                Eliminar permanentemente
              </Button>
            </>
          }
        >
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Se eliminará permanentemente <span className="font-semibold text-origen-bosque">{product.name}</span> del catálogo, incluyendo todas sus variantes, imágenes y estadísticas.
            </p>
            {product.sales && product.sales > 0 && (
              <p className="text-amber-600 text-sm flex items-center gap-1 mt-2">
                <AlertTriangle className="w-4 h-4" />
                Este producto tiene {product.sales} ventas registradas.
              </p>
            )}
          </div>
        </Modal>
      </motion.div>
    </MobilePullRefresh>
  );
}
