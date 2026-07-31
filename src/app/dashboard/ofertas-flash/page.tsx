'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  Flame,
  Clock,
  CheckCircle,
  Filter,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  Button,
  PageHeader,
  StatGrid,
  EmptyState,
  PageLoader,
  PageError,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Card,
  Badge,
  Label,
  MobilePullRefresh,
  MobileCardList,
  SwipeableRow,
  FilterBottomSheet,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Table,
  type Column,
  type StatGridItem,
} from '@arcediano/ux-library';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { fetchMyFlashDeals, fetchProducts, cancelFlashDeal, type FlashDealWithProduct } from '@/lib/api/products';
import { FlashDealForm } from '../products/components/FlashDealForm';
import type { Product } from '@/types/product';
import Link from 'next/link';

// ─── Status label ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  scheduled: 'Programada',
  finished: 'Finalizada',
  cancelled: 'Cancelada',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
  active: 'success',
  scheduled: 'warning',
  finished: 'neutral',
  cancelled: 'danger',
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'todas', label: 'Todas las ofertas' },
  { value: 'active', label: 'Activas' },
  { value: 'scheduled', label: 'Programadas' },
  { value: 'finished', label: 'Finalizadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

function getStatus(deal: FlashDealWithProduct): string {
  if (!deal.isActive) return 'cancelled';
  const now = new Date();
  const startsAt = new Date(deal.startsAt);
  const endsAt = new Date(deal.endsAt);
  if (now < startsAt) return 'scheduled';
  if (now <= endsAt) return 'active';
  return 'finished';
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

function formatPrice(value: number, discountType: string): string {
  if (discountType === 'PERCENTAGE') {
    return `${value}% desc.`;
  }
  return `${value.toFixed(2)}€`;
}

// ─── Product selector ────────────────────────────────────────────────────────

interface ProductSelectorProps {
  onSelect: (productId: string, basePrice: number) => void;
}

function ProductSelector({ onSelect }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const result = await fetchProducts({ limit: 100 });
      setLoading(false);
      if (!result.error && result.data) {
        setProducts(result.data.items);
      }
    };
    void loadProducts();
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-subtle">Selecciona un producto para crear una nueva oferta flash:</p>
      <div className="max-h-60 overflow-y-auto space-y-2">
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-origen-crema/40" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Package className="w-6 h-6" />}
            title="No hay productos disponibles"
            description="Crea primero un producto para poder aplicarle una oferta flash."
          />
        ) : (
          products.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product.id, product.basePrice)}
              className="w-full p-3 rounded-xl border border-border-subtle hover:border-origen-pradera/40 hover:bg-origen-crema/30 text-left transition-colors"
            >
              <div className="flex gap-3 items-center">
                {product.mainImage?.url && (
                  <img
                    src={product.mainImage.url}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-origen-bosque truncate">{product.name}</p>
                  <p className="text-xs text-text-subtle mt-0.5">{product.basePrice.toFixed(2)}€</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Deal card (móvil) ─────────────────────────────────────────────────────────

interface DealCardProps {
  deal: FlashDealWithProduct;
  onEdit: (deal: FlashDealWithProduct) => void;
}

function DealCard({ deal, onEdit }: DealCardProps) {
  const status = getStatus(deal);
  const isFinished = status === 'finished' || status === 'cancelled';
  const showNotVisible = status === 'active' && deal.productVisible === false;

  return (
    <Card padding="sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {deal.productMainImageUrl && (
            <img
              src={deal.productMainImageUrl}
              alt={deal.productName}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          )}
          <p className="text-sm font-semibold text-origen-bosque truncate">{deal.productName}</p>
        </div>
        <Badge variant={STATUS_BADGE[status]} size="sm">{STATUS_LABEL[status]}</Badge>
      </div>

      {showNotVisible && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-feedback-warning-subtle px-2.5 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-feedback-warning shrink-0 mt-0.5" aria-hidden />
          <p className="text-xs text-feedback-warning-text leading-relaxed">
            Producto no visible.{' '}
            <Link href={`/dashboard/products/${deal.productId}`} className="underline underline-offset-2 font-medium">
              Ver detalle
            </Link>
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-sm text-origen-pradera">
          {formatPrice(deal.discountValue, deal.discountType)}
        </span>
        <span className="text-text-subtle">{formatDate(deal.startsAt)} — {formatDate(deal.endsAt)}</span>
      </div>
      {!isFinished && (
        <div className="mt-3 flex justify-end pt-3 border-t border-border-subtle">
          <Button variant="ghost" size="sm" onClick={() => onEdit(deal)}>
            <Edit2 className="w-3.5 h-3.5" /> Editar
          </Button>
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfertasFlashPage() {
  const [deals, setDeals] = useState<FlashDealWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [selectedProductBasePrice, setSelectedProductBasePrice] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FlashDealWithProduct | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isFirstLoad = React.useRef(true);
  const showPageLoader = useDelayedLoading(isFirstLoad.current && loading);

  const loadDeals = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsTableLoading(true);
    }
    setError(null);

    const result = await fetchMyFlashDeals({
      status: statusFilter === 'todas' ? undefined : (statusFilter as any),
      page: 1,
      limit: 20,
    });

    setLoading(false);
    setIsTableLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setDeals(result.data.data);
      isFirstLoad.current = false;
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadDeals(isFirstLoad.current);
  }, [statusFilter, loadDeals]);

  const handleRefresh = async () => {
    await loadDeals(false);
  };

  const handleCreateFlashDeal = (productId: string, basePrice: number) => {
    setSelectedProductId(productId);
    setSelectedProductBasePrice(basePrice);
  };

  const handleEditDeal = (deal: FlashDealWithProduct) => {
    setEditingDeal(deal);
    setSelectedProductId(deal.productId);
    setSelectedProductBasePrice(deal.productBasePrice);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingDeal(null);
    setSelectedProductId(undefined);
  };

  const handleCancelDeal = async (dealId: string, productId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta oferta flash?')) return;

    setDeleting(true);
    const result = await cancelFlashDeal(productId, dealId);
    setDeleting(false);

    if (!result.error) {
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
    } else {
      alert(result.error);
    }
  };

  const handleDealSaved = () => {
    handleCloseModal();
    void loadDeals(false);
  };

  // Calcular KPIs
  const activeCount = deals.filter((d) => getStatus(d) === 'active').length;
  const scheduledCount = deals.filter((d) => getStatus(d) === 'scheduled').length;
  const finishedCount = deals.filter((d) => getStatus(d) === 'finished').length;
  const notVisibleCount = deals.filter((d) => getStatus(d) === 'active' && d.productVisible === false).length;

  const stats: StatGridItem[] = [
    {
      label: 'Activas ahora',
      value: activeCount,
      icon: <Flame className="w-5 h-5" />,
      variant: 'hoja',
      subtitle: notVisibleCount > 0 ? `${notVisibleCount} no visible${notVisibleCount > 1 ? 's' : ''} ahora mismo` : undefined,
    },
    { label: 'Programadas', value: scheduledCount, icon: <Clock className="w-5 h-5" />, variant: 'mandarina' },
    { label: 'Finalizadas', value: finishedCount, icon: <CheckCircle className="w-5 h-5" />, variant: 'bosque' },
    { label: 'Total ofertas', value: deals.length, icon: <Zap className="w-5 h-5" />, variant: 'pradera' },
  ];

  if (showPageLoader) {
    return <PageLoader message="Cargando ofertas flash..." className="animate-fade-in" />;
  }

  if (error && !loading) {
    return <PageError title="Error al cargar ofertas" message={error} onRetry={() => void loadDeals()} />;
  }

  const isModalOpen = showCreateModal || showEditModal;
  const showProductSelector = !selectedProductId && !editingDeal;

  const columns: Column<FlashDealWithProduct>[] = [
    {
      key: 'producto',
      header: 'Producto',
      accessor: (deal) => {
        const status = getStatus(deal);
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              {deal.productMainImageUrl && (
                <img
                  src={deal.productMainImageUrl}
                  alt={deal.productName}
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                />
              )}
              <span className="text-sm font-medium text-origen-bosque truncate max-w-[220px]" title={deal.productName}>
                {deal.productName}
              </span>
            </div>
            {status === 'active' && deal.productVisible === false && (
              <Link href={`/dashboard/products/${deal.productId}`} className="text-xs text-feedback-warning-text underline underline-offset-2 mt-1">
                Ver por qué no es visible
              </Link>
            )}
          </div>
        );
      },
      sortable: true,
      sortValue: (deal) => deal.productName,
    },
    {
      key: 'descuento',
      header: 'Descuento',
      accessor: (deal) => (
        <span className="text-sm font-semibold text-origen-pradera whitespace-nowrap">
          {formatPrice(deal.discountValue, deal.discountType)}
        </span>
      ),
    },
    {
      key: 'periodo',
      header: 'Período',
      accessor: (deal) => (
        <span className="text-xs text-text-subtle whitespace-nowrap">
          {formatDate(deal.startsAt)} — {formatDate(deal.endsAt)}
        </span>
      ),
      sortable: true,
      sortValue: (deal) => new Date(deal.startsAt).getTime(),
    },
    {
      key: 'estado',
      header: 'Estado',
      accessor: (deal) => {
        const status = getStatus(deal);
        return (
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE[status]} size="sm">{STATUS_LABEL[status]}</Badge>
            {status === 'active' && deal.productVisible === false && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-feedback-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Producto no visible
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'acciones',
      header: '',
      accessor: (deal) => {
        const status = getStatus(deal);
        const isFinished = status === 'finished' || status === 'cancelled';
        if (isFinished) return null;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleEditDeal(deal)} aria-label="Editar oferta">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleCancelDeal(deal.id, deal.productId)}
              disabled={deleting}
              aria-label="Cancelar oferta"
            >
              <Trash2 className="w-4 h-4 text-feedback-danger" />
            </Button>
          </div>
        );
      },
      className: 'text-right',
    },
  ];

  return (
    <div className="w-full">
      <MobilePullRefresh onRefresh={handleRefresh}>
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8 space-y-4 sm:space-y-6">
          {/* Cabecera */}
          <PageHeader
            title="Ofertas flash"
            description="Gestiona tus ofertas relámpago: crea, edita y monitoriza descuentos temporales en tus productos."
            badgeText="Ofertas flash"
            badgeIcon={Zap}
            tooltip="Ofertas flash"
            tooltipDetailed="Crea descuentos temporales en tus productos para generar urgencia de compra. Las ofertas activas se muestran automáticamente en el catálogo y en la home."
            actions={
              <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4" />
                Nueva oferta
              </Button>
            }
          />

          {/* KPIs */}
          <StatGrid items={stats} columns={4} />

          {/* Filtros desktop — hidden en móvil */}
          <div className="hidden lg:flex items-center gap-3">
            <Label className="text-sm font-medium text-text-subtle shrink-0">Estado:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros móvil */}
          <div className="lg:hidden">
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowFilters(true)}
            >
              <Filter className="h-4 w-4" />
              Filtrar
              {statusFilter !== 'todas' && (
                <Badge variant="leaf" size="xs">{STATUS_LABEL[statusFilter] ?? statusFilter}</Badge>
              )}
            </Button>
          </div>

          {/* Panel de filtros móvil */}
          <FilterBottomSheet
            open={showFilters}
            onClose={() => setShowFilters(false)}
            title="Filtros"
            footer={
              <Button variant="ghost" className="w-full" onClick={() => setShowFilters(false)}>
                Cerrar
              </Button>
            }
          >
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setShowFilters(false);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterBottomSheet>

          {/* Modal crear/editar oferta */}
          <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
            <DialogContent className={showProductSelector ? 'max-w-md' : 'max-w-lg'}>
              <DialogHeader>
                <DialogTitle>{editingDeal ? 'Editar oferta flash' : 'Crear nueva oferta flash'}</DialogTitle>
                {showProductSelector && (
                  <DialogDescription>Elige el producto al que quieres aplicar el descuento.</DialogDescription>
                )}
              </DialogHeader>
              <div className="px-6 py-4">
                {showProductSelector ? (
                  <ProductSelector onSelect={handleCreateFlashDeal} />
                ) : (
                  <FlashDealForm
                    productId={editingDeal ? editingDeal.productId : selectedProductId}
                    basePrice={selectedProductBasePrice}
                    existingDeal={editingDeal}
                    onSaved={handleDealSaved}
                    onCancel={handleCloseModal}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Listado */}
          {isTableLoading ? (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-origen-pastel/30" />
              ))}
            </div>
          ) : deals.length === 0 ? (
            <Card>
              <EmptyState
                size="sm"
                icon={<Zap className="w-6 h-6" />}
                title="Sin ofertas flash"
                description="Crea tu primera oferta flash para destacar tus productos con descuentos relámpago."
              />
            </Card>
          ) : (
            <>
              {/* Móvil: MobileCardList con SwipeableRow para cancelar */}
              <div className="lg:hidden">
                <MobileCardList>
                  {deals.map((deal) => {
                    const status = getStatus(deal);
                    const isFinished = status === 'finished' || status === 'cancelled';
                    const card = <DealCard deal={deal} onEdit={handleEditDeal} />;

                    return isFinished ? (
                      <div key={deal.id}>{card}</div>
                    ) : (
                      <SwipeableRow
                        key={deal.id}
                        actions={[{
                          label: 'Cancelar',
                          color: 'red',
                          icon: Trash2,
                          disabled: deleting,
                          onPress: () => void handleCancelDeal(deal.id, deal.productId),
                        }]}
                      >
                        {card}
                      </SwipeableRow>
                    );
                  })}
                </MobileCardList>
              </div>

              {/* Desktop: tabla del catálogo de componentes */}
              <div className="hidden lg:block">
                <Table
                  data={deals}
                  columns={columns}
                  keyExtractor={(deal) => deal.id}
                  onRowClick={(deal) => {
                    const status = getStatus(deal);
                    if (status === 'finished' || status === 'cancelled') return;
                    handleEditDeal(deal);
                  }}
                  rowClassName={(deal) => {
                    const status = getStatus(deal);
                    return status === 'finished' || status === 'cancelled' ? 'cursor-default' : 'cursor-pointer';
                  }}
                  emptyMessage="No hay ofertas flash para mostrar"
                />
              </div>
            </>
          )}
        </div>
      </MobilePullRefresh>
    </div>
  );
}
