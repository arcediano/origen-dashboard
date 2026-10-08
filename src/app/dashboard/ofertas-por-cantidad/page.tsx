'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  PauseCircle,
  Package,
} from 'lucide-react';
import {
  Button,
  PageHeader,
  StatGrid,
  EmptyState,
  PageLoader,
  PageError,
  Card,
  Badge,
  MobilePullRefresh,
  MobileCardList,
  SwipeableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Table,
  appShellPaddingClass,
  NAV_HEIGHT_MOBILE_DASHBOARD,
  toast,
  type Column,
  type StatGridItem,
} from '@arcediano/ux-library';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { fetchMyQuantityOffers, fetchProducts, deleteQuantityOffer, type QuantityOfferWithProduct } from '@/lib/api/products';
import { QuantityOfferForm } from '../products/components/QuantityOfferForm';
import { OfertasPorCantidadFilters } from './components/OfertasPorCantidadFilters';
import type { Product } from '@/types/product';

// ─── Status label ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  inactive: 'Inactiva',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
  active: 'success',
  inactive: 'neutral',
};

function getStatus(offer: QuantityOfferWithProduct): 'active' | 'inactive' {
  return offer.isActive ? 'active' : 'inactive';
}

function formatOfferValue(offer: QuantityOfferWithProduct): string {
  if (offer.type === 'PERCENTAGE') return `-${offer.value ?? 0}%`;
  if (offer.type === 'FIXED') return `${(offer.value ?? 0).toFixed(2)}€/ud`;
  if (offer.type === 'BUNDLE') return `Lleva ${offer.buyQuantity}, paga ${offer.payQuantity}`;
  return '';
}

function formatQuantityRange(offer: QuantityOfferWithProduct): string {
  if (offer.maxQuantity) return `${offer.minQuantity}–${offer.maxQuantity} uds`;
  return `${offer.minQuantity}+ uds`;
}

// ─── Product selector ────────────────────────────────────────────────────────

interface ProductSelectorProps {
  onSelect: (productId: string, basePrice: number, hasFlashDeal: boolean) => void;
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
      <p className="text-sm text-text-subtle">Selecciona un producto para crear una nueva oferta por cantidad:</p>
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
            description="Crea primero un producto para poder aplicarle una oferta por cantidad."
          />
        ) : (
          products.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product.id, product.basePrice, !!product.flashDeal)}
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

// ─── Offer card (móvil) ─────────────────────────────────────────────────────

interface OfferCardProps {
  offer: QuantityOfferWithProduct;
  onEdit: (offer: QuantityOfferWithProduct) => void;
}

function OfferCard({ offer, onEdit }: OfferCardProps) {
  const status = getStatus(offer);

  return (
    <Card padding="sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {offer.productMainImageUrl && (
            <img
              src={offer.productMainImageUrl}
              alt={offer.productName}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          )}
          <p className="text-sm font-semibold text-origen-bosque truncate">{offer.productName}</p>
        </div>
        <Badge variant={STATUS_BADGE[status]} size="sm">{STATUS_LABEL[status]}</Badge>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-sm text-origen-bosque">{formatOfferValue(offer)}</span>
        <span className="text-text-subtle">{formatQuantityRange(offer)}</span>
      </div>
      {status === 'active' && (
        <div className="mt-3 flex justify-end pt-3 border-t border-border-subtle">
          <Button variant="ghost" size="sm" onClick={() => onEdit(offer)}>
            <Edit2 className="w-3.5 h-3.5" /> Editar
          </Button>
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfertasPorCantidadPage() {
  const [offers, setOffers] = useState<QuantityOfferWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [selectedProductBasePrice, setSelectedProductBasePrice] = useState(0);
  const [selectedProductHasFlashDeal, setSelectedProductHasFlashDeal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<QuantityOfferWithProduct | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isFirstLoad = React.useRef(true);
  const showPageLoader = useDelayedLoading(isFirstLoad.current && loading);

  const loadOffers = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsTableLoading(true);
    }
    setError(null);

    const result = await fetchMyQuantityOffers({
      status: statusFilter === 'todas' ? undefined : (statusFilter as 'active' | 'inactive'),
      page: 1,
      limit: 20,
    });

    setLoading(false);
    setIsTableLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setOffers(result.data.data);
      isFirstLoad.current = false;
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadOffers(isFirstLoad.current);
  }, [statusFilter, loadOffers]);

  const handleRefresh = async () => {
    await loadOffers(false);
  };

  const handleCreateOffer = (productId: string, basePrice: number, hasFlashDeal: boolean) => {
    setSelectedProductId(productId);
    setSelectedProductBasePrice(basePrice);
    setSelectedProductHasFlashDeal(hasFlashDeal);
  };

  const handleEditOffer = (offer: QuantityOfferWithProduct) => {
    setEditingOffer(offer);
    setSelectedProductId(offer.productId);
    setSelectedProductBasePrice(offer.productBasePrice);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingOffer(null);
    setSelectedProductId(undefined);
    setSelectedProductHasFlashDeal(false);
  };

  const handleDeleteOffer = async (tierId: string, productId: string) => {
    if (!confirm('¿Estás seguro de que deseas desactivar esta oferta por cantidad?')) return;

    setDeleting(true);
    const result = await deleteQuantityOffer(productId, tierId);
    setDeleting(false);

    if (!result.error) {
      setOffers((prev) => prev.filter((o) => o.id !== tierId));
    } else {
      toast({ title: 'Error al desactivar la oferta', description: result.error, variant: 'error' });
    }
  };

  const handleOfferSaved = () => {
    handleCloseModal();
    void loadOffers(false);
  };

  // Calcular KPIs
  const activeCount = offers.filter((o) => getStatus(o) === 'active').length;
  const inactiveCount = offers.filter((o) => getStatus(o) === 'inactive').length;

  const stats: StatGridItem[] = [
    { label: 'Activas', value: activeCount, icon: <CheckCircle className="w-5 h-5" />, variant: 'hoja' },
    { label: 'Inactivas', value: inactiveCount, icon: <PauseCircle className="w-5 h-5" />, variant: 'bosque' },
    { label: 'Total ofertas', value: offers.length, icon: <Layers className="w-5 h-5" />, variant: 'pradera' },
  ];

  if (showPageLoader) {
    return <PageLoader message="Cargando ofertas por cantidad..." className="animate-fade-in" />;
  }

  if (error && !loading) {
    return <PageError title="Error al cargar ofertas" message={error} onRetry={() => void loadOffers()} />;
  }

  const isModalOpen = showCreateModal || showEditModal;
  const showProductSelector = !selectedProductId && !editingOffer;

  const filteredOffers = search.trim()
    ? offers.filter((offer) => offer.productName.toLowerCase().includes(search.trim().toLowerCase()))
    : offers;

  const columns: Column<QuantityOfferWithProduct>[] = [
    {
      key: 'producto',
      header: 'Producto',
      accessor: (offer) => (
        <div className="flex items-center gap-3">
          {offer.productMainImageUrl && (
            <img
              src={offer.productMainImageUrl}
              alt={offer.productName}
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
          )}
          <span className="text-sm font-medium text-origen-bosque truncate max-w-[220px]" title={offer.productName}>
            {offer.productName}
          </span>
        </div>
      ),
      sortable: true,
      sortValue: (offer) => offer.productName,
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      accessor: (offer) => (
        <span className="text-xs text-text-subtle whitespace-nowrap">{formatQuantityRange(offer)}</span>
      ),
      sortable: true,
      sortValue: (offer) => offer.minQuantity,
    },
    {
      key: 'oferta',
      header: 'Oferta',
      accessor: (offer) => (
        <span className="text-sm font-semibold text-origen-bosque whitespace-nowrap">
          {formatOfferValue(offer)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      accessor: (offer) => {
        const status = getStatus(offer);
        return <Badge variant={STATUS_BADGE[status]} size="sm">{STATUS_LABEL[status]}</Badge>;
      },
    },
    {
      key: 'acciones',
      header: '',
      accessor: (offer) => {
        if (getStatus(offer) !== 'active') return null;
        return (
          <div className="flex items-center justify-end gap-1 pr-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleEditOffer(offer)}
              title="Editar oferta"
              aria-label="Editar oferta"
              className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 text-origen-pradera hover:text-origen-pradera hover:bg-origen-pastel/40"
            >
              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void handleDeleteOffer(offer.id, offer.productId)}
              disabled={deleting}
              title="Desactivar oferta"
              aria-label="Desactivar oferta"
              className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 text-feedback-danger hover:text-feedback-danger hover:bg-feedback-danger-subtle"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
        <div className={`container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 ${appShellPaddingClass(NAV_HEIGHT_MOBILE_DASHBOARD, 0)} sm:pb-8 space-y-4 sm:space-y-6`}>
          {/* Cabecera */}
          <PageHeader
            title="Ofertas por cantidad"
            description="Gestiona tus descuentos por volumen: crea, edita y monitoriza ofertas por cantidad en tus productos."
            badgeText="Descuentos"
            badgeIcon={Layers}
            tooltip="Ofertas por cantidad"
            tooltipDetailed="Crea descuentos escalonados según la cantidad comprada (porcentaje, precio fijo o packs tipo 'lleva 3, paga 2') en tus productos."
            actions={
              <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4" />
                Nueva oferta
              </Button>
            }
          />

          {/* KPIs */}
          <StatGrid items={stats} columns={3} />

          {/* Filtros */}
          <OfertasPorCantidadFilters
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            search={search}
            onSearchChange={setSearch}
            totalOffers={filteredOffers.length}
          />

          {/* Modal crear/editar oferta */}
          <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
            <DialogContent className={showProductSelector ? 'max-w-md' : 'max-w-lg'}>
              <DialogHeader>
                <DialogTitle>{editingOffer ? 'Editar oferta por cantidad' : 'Crear nueva oferta por cantidad'}</DialogTitle>
                {showProductSelector && (
                  <DialogDescription>Elige el producto al que quieres aplicar el descuento.</DialogDescription>
                )}
              </DialogHeader>
              <div className="px-6 py-4">
                {showProductSelector ? (
                  <ProductSelector onSelect={handleCreateOffer} />
                ) : (
                  <QuantityOfferForm
                    productId={editingOffer ? editingOffer.productId : selectedProductId}
                    basePrice={selectedProductBasePrice}
                    existingOffer={editingOffer}
                    hasFlashDeal={!editingOffer && selectedProductHasFlashDeal}
                    onSaved={handleOfferSaved}
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
          ) : filteredOffers.length === 0 ? (
            <Card>
              <EmptyState
                size="sm"
                icon={<Layers className="w-6 h-6" />}
                title={offers.length === 0 ? 'Sin ofertas por cantidad' : 'Sin resultados'}
                description={
                  offers.length === 0
                    ? 'Crea tu primera oferta por cantidad para incentivar compras más grandes.'
                    : 'No hay ofertas por cantidad que coincidan con la búsqueda o el filtro aplicado.'
                }
              />
            </Card>
          ) : (
            <>
              {/* Móvil: MobileCardList con SwipeableRow para desactivar */}
              <div className="lg:hidden">
                <MobileCardList>
                  {filteredOffers.map((offer) => {
                    const isActive = getStatus(offer) === 'active';
                    const card = <OfferCard offer={offer} onEdit={handleEditOffer} />;

                    return !isActive ? (
                      <div key={offer.id}>{card}</div>
                    ) : (
                      <SwipeableRow
                        key={offer.id}
                        actions={[{
                          label: 'Desactivar',
                          color: 'red',
                          icon: Trash2,
                          disabled: deleting,
                          onPress: () => void handleDeleteOffer(offer.id, offer.productId),
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
                  data={filteredOffers}
                  columns={columns}
                  keyExtractor={(offer) => offer.id}
                  onRowClick={(offer) => {
                    if (getStatus(offer) !== 'active') return;
                    handleEditOffer(offer);
                  }}
                  rowClassName={(offer) => (getStatus(offer) === 'active' ? 'cursor-pointer' : 'cursor-default')}
                  emptyMessage="No hay ofertas por cantidad para mostrar"
                />
              </div>
            </>
          )}
        </div>
      </MobilePullRefresh>
    </div>
  );
}
