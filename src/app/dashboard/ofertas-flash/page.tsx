'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Flame,
  Clock,
  CheckCircle,
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
  MobileCardList,
  SwipeableRow,
} from '@arcediano/ux-library';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import type { StatGridItem } from '@arcediano/ux-library';
import { fetchMyFlashDeals, fetchProducts, cancelFlashDeal, type FlashDealWithProduct } from '@/lib/api/products';
import { FlashDealForm } from '../products/components/FlashDealForm';
import type { Product } from '@/types/product';

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
    loadProducts();
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-subtle">Selecciona un producto para crear una nueva oferta flash:</p>
      <div className="max-h-60 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center py-8 text-text-subtle">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-text-subtle">No hay productos disponibles</div>
        ) : (
          products.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product.id, product.basePrice)}
              className="w-full p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors"
            >
              <div className="flex gap-3 items-start">
                {product.mainImage?.url && (
                  <img
                    src={product.mainImage.url}
                    alt={product.name}
                    className="w-12 h-12 rounded object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-origin-text truncate">{product.name}</p>
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OfertasFlashPage() {
  const [deals, setDeals] = useState<FlashDealWithProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todas');
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
    }
    setError(null);

    const result = await fetchMyFlashDeals({
      status: statusFilter === 'todas' ? undefined : (statusFilter as any),
      page: 1,
      limit: 20,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setDeals(result.data.data);
      if (isInitial) {
        isFirstLoad.current = false;
      }
    }
    setLoading(false);
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
    setShowCreateModal(false);
  };

  const handleEditDeal = (deal: FlashDealWithProduct) => {
    setEditingDeal(deal);
    setSelectedProductId(deal.productId);
    setSelectedProductBasePrice(deal.productBasePrice);
    setShowEditModal(true);
  };

  const handleCancelDeal = async (dealId: string, productId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta oferta flash?')) return;

    setDeleting(true);
    const result = await cancelFlashDeal(productId, dealId);
    setDeleting(false);

    if (!result.error) {
      setDeals(deals.filter((d) => d.id !== dealId));
    } else {
      alert(result.error);
    }
  };

  const handleDealSaved = () => {
    setSelectedProductId(undefined);
    setEditingDeal(null);
    setShowEditModal(false);
    void loadDeals(false);
  };

  // Calcular KPIs
  const activeCount = deals.filter((d) => getStatus(d) === 'active').length;
  const scheduledCount = deals.filter((d) => getStatus(d) === 'scheduled').length;
  const finishedCount = deals.filter((d) => getStatus(d) === 'finished').length;

  const stats: StatGridItem[] = [
    {
      label: 'Activas ahora',
      value: activeCount.toString(),
      icon: <Flame className="w-4 h-4" />,
    },
    {
      label: 'Programadas',
      value: scheduledCount.toString(),
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: 'Finalizadas',
      value: finishedCount.toString(),
      icon: <CheckCircle className="w-4 h-4" />,
    },
  ];

  if (showPageLoader) {
    return <PageLoader />;
  }

  if (error) {
    return <PageError message={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <PageHeader
          title="Ofertas flash"
          description="Gestiona tus ofertas relámpago: crea, edita y monitoriza descuentos temporales en tus productos."
        />
        <Button
          onClick={() => setShowCreateModal(true)}
          className="mt-1 bg-origen-bosque hover:bg-origen-bosque/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva oferta
        </Button>
      </div>

      {/* Stats */}
      <StatGrid items={stats} />

      {/* Modal para crear/editar */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingDeal ? 'Editar oferta flash' : 'Crear nueva oferta flash'}
              </h2>
              <button
                onClick={() => {
                  if (editingDeal) {
                    setShowEditModal(false);
                    setEditingDeal(null);
                  } else {
                    setShowCreateModal(false);
                    setSelectedProductId(undefined);
                  }
                }}
                className="text-text-subtle hover:text-origin-text"
              >
                ×
              </button>
            </div>

            {!selectedProductId && !editingDeal ? (
              <ProductSelector onSelect={handleCreateFlashDeal} />
            ) : (
              <FlashDealForm
                productId={editingDeal ? editingDeal.productId : selectedProductId}
                basePrice={selectedProductBasePrice}
                existingDeal={editingDeal}
                onSaved={handleDealSaved}
                onCancel={() => {
                  if (editingDeal) {
                    setShowEditModal(false);
                    setEditingDeal(null);
                  } else {
                    setShowCreateModal(false);
                    setSelectedProductId(undefined);
                  }
                }}
              />
            )}
          </Card>
        </div>
      )}

      {/* Filtro */}
      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las ofertas</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="scheduled">Programadas</SelectItem>
            <SelectItem value="finished">Finalizadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Empty state */}
      {deals.length === 0 && !loading && (
        <EmptyState
          title="Sin ofertas flash"
          description="Crea tu primera oferta flash para destacar tus productos con descuentos relámpago."
          icon={<Zap className="w-12 h-12 text-text-subtle" />}
        />
      )}

      {/* Móvil: MobileCardList con SwipeableRow para cancelar */}
      {deals.length > 0 && (
        <div className="lg:hidden">
          <MobileCardList>
            {deals.map((deal) => {
              const status = getStatus(deal);
              const isFinished = status === 'finished' || status === 'cancelled';
              const card = (
                <Card className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {deal.productMainImageUrl && (
                        <img
                          src={deal.productMainImageUrl}
                          alt={deal.productName}
                          className="w-10 h-10 rounded object-cover shrink-0"
                        />
                      )}
                      <p className="text-sm font-medium text-origen-pradera truncate">{deal.productName}</p>
                    </div>
                    <Badge variant={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-subtle">
                    <span className="font-medium text-sm text-origin-text">
                      {formatPrice(deal.discountValue, deal.discountType)}
                    </span>
                    <span>{formatDate(deal.startsAt)} — {formatDate(deal.endsAt)}</span>
                  </div>
                  {!isFinished && (
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleEditDeal(deal)}>
                        <Edit2 className="w-4 h-4 mr-1" /> Editar
                      </Button>
                    </div>
                  )}
                </Card>
              );

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
      )}

      {/* Desktop: tabla */}
      {deals.length > 0 && (
        <Card className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-subtle">Producto</th>
                  <th className="px-4 py-3 text-left font-medium text-text-subtle">Descuento</th>
                  <th className="px-4 py-3 text-left font-medium text-text-subtle">Período</th>
                  <th className="px-4 py-3 text-left font-medium text-text-subtle">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-text-subtle">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => {
                  const status = getStatus(deal);
                  const isFinished = status === 'finished' || status === 'cancelled';
                  return (
                    <tr key={deal.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-origen-pradera flex items-center gap-2">
                          {deal.productMainImageUrl && (
                            <img
                              src={deal.productMainImageUrl}
                              alt={deal.productName}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          {deal.productName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">
                          {formatPrice(deal.discountValue, deal.discountType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-subtle">
                        {formatDate(deal.startsAt)} — {formatDate(deal.endsAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[status]}>
                          {STATUS_LABEL[status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {!isFinished && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDeal(deal)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelDeal(deal.id, deal.productId)}
                                disabled={deleting}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
