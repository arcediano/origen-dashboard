/**
 * @page ProductoDetallePage
 * @description Página de detalle de producto - CON MÉTRICAS MEJORADAS EN UNA SOLA FILA
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Componentes UI genéricos
import { Button } from '@/components/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
import { Badge } from '@/components/ui/atoms/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/atoms/tabs';
import { Modal } from '@/components/ui/atoms/dialog';
import { PageHeader } from '../../components/PageHeader';

// Importar iconos
import {
  Package,
  Eye,
  Trash2,
  DollarSign,
  TrendingUp,
  Star,
  Tag,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Weight,
  Ruler,
  Barcode,
  Calendar,
  FileText,
  Award,
  Leaf,
  MapPin,
  FlaskConical,
  Droplet,
  Milk,
  TreePine,
  Sun,
  Percent,
  Scale,
  Info,
  Quote,
  Gift,
  History,
  TrendingDown,
  AlertTriangle,
  ShoppingBag,
  BarChart3,
  Globe,
  Wheat,
  Bean,
  Nut,
  Egg,
  Fish,
  Shell,
  Sprout,
  RefreshCw,
  Edit,
  Plus
} from 'lucide-react';

import { type Product } from '@/types/product';
import { fetchProductById, deleteProduct } from '@/lib/api/products';

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const StatusBadge = ({ status }: { status: Product['status'] }) => {
  const statusMap = {
    active: { variant: 'success' as const, label: 'Activo', icon: CheckCircle },
    inactive: { variant: 'neutral' as const, label: 'Inactivo', icon: Clock }, // Cambiado de 'warning' a 'neutral'
    out_of_stock: { variant: 'danger' as const, label: 'Sin stock', icon: AlertCircle },
    draft: { variant: 'neutral' as const, label: 'Borrador', icon: FileText }, // Cambiado de 'default' a 'neutral'
  };
  const { variant, label, icon: Icon } = statusMap[status] || statusMap.draft;
  return <Badge variant={variant} icon={<Icon className="w-3 h-3" />}>{label}</Badge>;
};

// Componente de carga
const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-origen-pradera animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando producto...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de error
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <div className="container mx-auto px-6 py-8">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-origen-bosque mb-2">Error al cargar</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button
            onClick={onRetry}
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </span>
          </Button>
        </Card>
      </div>
    </div>
  );
};

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

  // Cargar producto
  useEffect(() => {
    if (productId) {
      loadProduct();
    }
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
      console.error('Error cargando producto:', err);
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
    } catch (err) {
      console.error('Error eliminando producto:', err);
      setError('Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return 'No disponible';
    try {
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return '0,00 €';
    return value.toFixed(2).replace('.', ',') + ' €';
  };

  // Mostrar carga
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Mostrar error
  if (error || !product) {
    return <ErrorState error={error || 'Producto no encontrado'} onRetry={loadProduct} />;
  }

  // Calcular descuento
  const hasDiscount = product.comparePrice != null && 
                     product.basePrice != null && 
                     product.comparePrice > product.basePrice;
  
  const discountPercentage = hasDiscount && product.comparePrice && product.basePrice
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
    : 0;

  // Determinar estado del stock
  const stockLevel = product.stock ?? 0;
  const lowStockThreshold = product.lowStockThreshold ?? 5;
  
  const stockColor = stockLevel === 0 
    ? 'error' 
    : stockLevel <= lowStockThreshold 
    ? 'warning' 
    : 'success';

  // Obtener icono para alérgenos
  const getAllergenIcon = (allergen: string) => {
    const icons: Record<string, any> = {
      'Gluten': Wheat,
      'Crustáceos': Shell,
      'Huevos': Egg,
      'Pescado': Fish,
      'Cacahuetes': Nut,
      'Soja': Bean,
      'Lácteos': Milk,
      'Frutos de cáscara': Nut,
      'Apio': Leaf,
      'Mostaza': Leaf,
      'Sésamo': Sprout,
      'Sulfitos': Droplet,
      'Altramuces': Bean,
      'Moluscos': Shell,
    };
    return icons[allergen] || AlertCircle;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="lg:min-h-screen lg:bg-gradient-to-b lg:from-white lg:to-origen-crema"
    >
      {/* Elementos decorativos — solo desktop */}
      <div className="hidden lg:block fixed top-0 right-0 w-96 h-96 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="hidden lg:block fixed bottom-0 left-0 w-96 h-96 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* ===== CABECERA CON PAGEHEADER ===== */}
      <PageHeader
        title={product.name}
        description={`${product.categoryName || product.categoryId} · ${product.sku || 'Sin SKU'}`}
        badgeIcon={Package}
        badgeText={product.status === 'active' ? 'Producto activo' : 
                  product.status === 'inactive' ? 'Producto inactivo' :
                  product.status === 'out_of_stock' ? 'Sin stock' : 'Borrador'}
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

            {/* Botón Editar — solo desktop */}
          <Link href={`/dashboard/products/${product.id}edit`} className="hidden lg:inline-block">
            <Button>
              <span className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </span>
            </Button>
          </Link>

            {/* Botón Eliminar — solo desktop */}
            <Button
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="hidden lg:flex bg-transparent text-origen-bosque border-2 border-origen-bosque hover:bg-origen-crema hover:border-origen-pradera h-10 px-5"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </span>
            </Button>
          </div>
        }
      />

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* ===== MÉTRICAS CLAVE - ESTILO PRODUCTEXPANDABLEDETAILS (UNA SOLA FILA) ===== */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-6 lg:mb-8 scrollbar-hide">
          <div className="flex gap-3 lg:grid lg:grid-cols-7 lg:gap-4 w-max lg:w-auto">
            {/* Precio */}
            <div className="w-32 shrink-0 lg:w-auto p-3 lg:p-4 bg-gradient-to-br from-origen-pradera/5 to-transparent rounded-xl border border-origen-pradera/10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-origen-pradera" />
                <span className="text-xs font-medium text-text-subtle">Precio</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-origen-bosque">{formatCurrency(product.basePrice)}</p>
              {hasDiscount && (
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <span className="text-text-disabled line-through">{formatCurrency(product.comparePrice)}</span>
                  <span className="text-green-600 font-medium">(-{discountPercentage}%)</span>
                </div>
              )}
            </div>

            {/* Stock */}
            <div className={cn(
              "w-32 shrink-0 lg:w-auto p-3 lg:p-4 rounded-xl border",
              stockColor === 'error' ? "bg-gradient-to-br from-red-50/50 to-transparent border-red-100" :
              stockColor === 'warning' ? "bg-gradient-to-br from-amber-50/50 to-transparent border-amber-100" :
              "bg-gradient-to-br from-origen-hoja/5 to-transparent border-origen-hoja/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Package className={cn(
                  "w-5 h-5",
                  stockColor === 'error' ? "text-red-500" :
                  stockColor === 'warning' ? "text-amber-500" : "text-origen-hoja"
                )} />
                <span className="text-xs font-medium text-text-subtle">Stock</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-origen-bosque">{stockLevel} uds</p>
              {stockLevel > 0 && stockLevel <= lowStockThreshold && (
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>Bajo</span>
                </div>
              )}
            </div>

            {/* Valoración */}
            <div className="w-32 shrink-0 lg:w-auto p-3 lg:p-4 bg-gradient-to-br from-amber-50/50 to-transparent rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-medium text-text-subtle">Valoración</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-lg lg:text-2xl font-bold text-origen-bosque">{product.rating?.toFixed(1) || '0.0'}</p>
                <span className="text-xs text-text-disabled">/5</span>
              </div>
              <p className="text-xs text-text-subtle mt-2">{product.reviewCount || 0} reseñas</p>
            </div>

            {/* Ventas */}
            <div className="w-32 shrink-0 lg:w-auto p-3 lg:p-4 bg-gradient-to-br from-blue-50/50 to-transparent rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-medium text-text-subtle">Ventas</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-origen-bosque">{product.sales || 0}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                <DollarSign className="w-3 h-3" />
                <span>{formatCurrency(product.revenue)}</span>
              </div>
            </div>

            {/* Vistas */}
            <div className="w-32 shrink-0 lg:w-auto p-3 lg:p-4 bg-gradient-to-br from-purple-50/50 to-transparent rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-purple-500" />
                <span className="text-xs font-medium text-text-subtle">Vistas</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-origen-bosque">{product.views || 0}</p>
              {product.conversion && (
                <div className="flex items-center gap-1 mt-2 text-xs text-purple-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>{product.conversion.toFixed(1)}% conv.</span>
                </div>
              )}
            </div>

            {/* Conversión */}
            <div className="w-32 shrink-0 lg:w-auto p-3 lg:p-4 bg-gradient-to-br from-green-50/50 to-transparent rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-xs font-medium text-text-subtle">Conversión</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-origen-bosque">{product.conversion?.toFixed(1) || '0.0'}%</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <ShoppingBag className="w-3 h-3" />
                <span>{product.sales || 0} ventas</span>
              </div>
            </div>

            {/* Margen */}
            <div className="w-32 shrink-0 lg:w-auto p-3 lg:p-4 bg-gradient-to-br from-origen-menta/5 to-transparent rounded-xl border border-origen-menta/20">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-5 h-5 text-origen-menta" />
                <span className="text-xs font-medium text-text-subtle">Margen</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-origen-bosque">
                {product.comparePrice && product.comparePrice > product.basePrice
                  ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
                  : 0}%
              </p>
              {product.comparePrice && product.comparePrice > product.basePrice && (
                <p className="text-xs text-text-subtle mt-2">
                  Ahorro: {formatCurrency(product.comparePrice - product.basePrice)}
                </p>
              )}
            </div>
          </div>
          </div>

          {/* ===== DOS COLUMNAS ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMNA IZQUIERDA (4/12) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Imagen principal */}
              <Card variant="elevated" hoverEffect="organic">
                <CardContent className="p-5">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-origen-crema to-gray-100 flex items-center justify-center overflow-hidden">
                    {product.mainImage ? (
                      <img
                        src={product.mainImage.url}
                        alt={product.mainImage.alt || product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : product.gallery && product.gallery.length > 0 ? (
                      <img
                        src={product.gallery[0].url}
                        alt={product.gallery[0].alt || product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-20 h-20 text-origen-pradera/30" />
                    )}
                  </div>
                  
                  {/* Miniaturas si hay más imágenes */}
                  {product.gallery && product.gallery.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-4">
                      {product.gallery.slice(1, 5).map((img, idx) => (
                        <div key={img.id} className="w-16 h-16 shrink-0 lg:w-auto lg:h-auto lg:aspect-square rounded-lg bg-origen-crema/50 overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.alt || `Imagen ${idx + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Datos básicos del producto */}
              <Card variant="elevated" hoverEffect="organic">
                <CardHeader spacing="sm">
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-origen-pradera" />
                    Datos del producto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                      <span className="text-sm text-muted-foreground">Categoría</span>
                      <span className="text-sm font-medium text-origen-bosque">
                        {product.categoryName || product.categoryId}
                        {product.subcategoryId && ` / ${product.subcategoryId}`}
                      </span>
                    </div>
                    
                    {product.productionInfo?.origin && (
                      <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                        <span className="text-sm text-muted-foreground">Origen</span>
                        <span className="text-sm font-medium text-origen-bosque">
                          {product.productionInfo.origin}
                        </span>
                      </div>
                    )}
                    
                    {product.productionInfo?.farmName && (
                      <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                        <span className="text-sm text-muted-foreground">Productor</span>
                        <span className="text-sm font-medium text-origen-bosque">
                          {product.productionInfo.farmName}
                        </span>
                      </div>
                    )}
                    
                    {(product.weight || product.dimensions) && (
                      <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                        <span className="text-sm text-muted-foreground">Peso / dimensiones</span>
                        <span className="text-sm font-medium text-origen-bosque text-right">
                          {product.weight && `${product.weight} ${product.weightUnit || 'kg'}`}
                          {product.dimensions && (
                            <>
                              <br />
                              <span className="text-xs text-text-disabled">
                                {product.dimensions.length || 0}x{product.dimensions.width || 0}x{product.dimensions.height || 0} cm
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    )}
                    
                    {product.shippingClass && (
                      <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                        <span className="text-sm text-muted-foreground">Clase de envío</span>
                        <Badge variant="leaf" size="sm" className="capitalize">
                          {product.shippingClass}
                        </Badge>
                      </div>
                    )}
                    
                    {product.productionInfo?.batchNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Lote actual</span>
                        <span className="text-sm font-mono font-medium text-origen-bosque">
                          {product.productionInfo.batchNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Certificaciones */}
              {product.certifications && product.certifications.length > 0 && (
                <Card variant="elevated" hoverEffect="organic">
                  <CardHeader spacing="sm">
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-origen-pradera" />
                      Certificaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {product.certifications.map(cert => (
                        <div key={cert.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {cert.verified ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Award className="w-4 h-4 text-origen-pradera" />
                            )}
                            <div>
                              <span className="text-sm text-foreground">{cert.name}</span>
                              {cert.issuingBody && (
                                <p className="text-xs text-text-disabled">{cert.issuingBody}</p>
                              )}
                            </div>
                          </div>
                          {cert.expiryDate && (
                            <Badge variant="warning" size="xs">
                              Vence: {formatDate(cert.expiryDate)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Atributos dinámicos */}
              {product.attributes && product.attributes.length > 0 && (
                <Card variant="elevated" hoverEffect="organic">
                  <CardHeader spacing="sm">
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-origen-pradera" />
                      Atributos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {product.attributes
                        .filter(attr => attr.visible)
                        .slice(0, 6)
                        .map(attr => (
                          <div key={attr.id} className="p-2 bg-origen-crema/30 rounded-lg">
                            <p className="text-xs text-text-subtle">{attr.name}</p>
                            <p className="text-sm font-medium text-origen-bosque truncate" title={String(attr.value)}>
                              {attr.type === 'boolean' 
                                ? (attr.value ? 'Sí' : 'No')
                                : attr.value}
                              {attr.unit && attr.type !== 'boolean' ? ` ${attr.unit}` : ''}
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* COLUMNA DERECHA (8/12) */}
            <div className="lg:col-span-8">
              <Card variant="elevated" hoverEffect="organic" className="p-4 lg:p-6">
                
                {/* Descripción */}
                <div className="mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-origen-pradera" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-origen-bosque mb-2">Descripción</h2>
                      <p className="text-sm text-foreground leading-relaxed mb-3">
                        {product.shortDescription}
                      </p>
                      {product.fullDescription && (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {product.fullDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-border">
                    {product.tags.map(tag => (
                      <Badge key={tag} variant="leaf" icon={<Tag className="h-3 w-3" />}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* TABS */}
                <Tabs defaultValue="nutritional" className="w-full">
                  <div className="overflow-x-auto scrollbar-hide mb-6">
                  <TabsList className="flex lg:grid w-max lg:w-full lg:grid-cols-5 p-1 bg-origen-crema/50 rounded-xl">
                    <TabsTrigger value="nutritional" className="rounded-lg data-[state=active]:bg-white shrink-0 px-4">
                      <FlaskConical className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Nutricional</span>
                    </TabsTrigger>
                    <TabsTrigger value="production" className="rounded-lg data-[state=active]:bg-white shrink-0 px-4">
                      <Leaf className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Producción</span>
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="rounded-lg data-[state=active]:bg-white shrink-0 px-4">
                      <DollarSign className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Precios</span>
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-white shrink-0 px-4">
                      <Package className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Inventario</span>
                    </TabsTrigger>
                    <TabsTrigger value="attributes" className="rounded-lg data-[state=active]:bg-white shrink-0 px-4">
                      <Tag className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Atributos</span>
                    </TabsTrigger>
                  </TabsList>
                  </div>

                  {/* ... contenido de las tabs (sin cambios) ... */}
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ACCIONES STICKY — SOLO MÓVIL ===== */}
      <div className="lg:hidden fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-4 right-4 z-30 flex gap-3">
        <Button
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
          className="flex-1 bg-transparent text-origen-bosque border-2 border-origen-bosque hover:bg-origen-crema hover:border-origen-pradera h-12"
        >
          <span className="flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" />
            Eliminar
          </span>
        </Button>
        <Link href={`/dashboard/products/${product.id}edit`} className="flex-1">
          <Button className="w-full h-12">
            <span className="flex items-center justify-center gap-2">
              <Edit className="w-4 h-4" />
              Editar producto
            </span>
          </Button>
        </Link>
      </div>

      {/* ===== DIÁLOGO DE ELIMINACIÓN USANDO MODAL ===== */}
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
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="bg-transparent text-origen-bosque border-2 border-origen-bosque hover:bg-origen-crema hover:border-origen-pradera h-10 px-5"
            >
              <span className="flex items-center gap-2">
                Cancelar
              </span>
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white h-10 px-5"
            >
              <span className="flex items-center gap-2">
                {isDeleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
              </span>
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Se eliminará permanentemente el producto{' '}
            <span className="font-semibold text-origen-bosque">{product.name}</span> del catálogo,
            incluyendo todas sus variantes, imágenes y estadísticas asociadas.
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
  );
}