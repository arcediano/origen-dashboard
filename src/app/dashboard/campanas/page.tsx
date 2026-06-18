'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Euro, Filter, Megaphone, PauseCircle, Plus, RefreshCw, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { Button, DateInput, Input, Label, PageHeader, StatGrid, EmptyState, PageLoader, PageError, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Card, Badge, MobilePullRefresh, CardIconHeader, MobileCardList, SwipeableRow } from '@arcediano/ux-library';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import type { StatGridItem } from '@arcediano/ux-library';
import {
  createCampaign,
  deleteCampaign,
  fetchMyCampaigns,
  type Campaign,
  type CampaignStatus,
  type CampaignType,
  type CreateCampaignPayload,
} from '@/lib/api/campaigns';

// ─── Status label ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_REVIEW: 'En revisión',
  ACTIVE: 'Activa',
  PAUSED: 'Pausada',
  ENDED: 'Finalizada',
  REJECTED: 'Rechazada',
};

const STATUS_BADGE: Record<CampaignStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  DRAFT:          'neutral',
  PENDING_REVIEW: 'warning',
  ACTIVE:         'success',
  PAUSED:         'neutral',
  ENDED:          'neutral',
  REJECTED:       'danger',
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── Create form ──────────────────────────────────────────────────────────────

const PLACEMENTS = [
  'homepage-strip',
  'catalog-sidebar',
  'catalog-inline',
  'product-related',
];

interface CreateFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function CreateCampaignForm({ onCreated, onCancel }: CreateFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<CreateCampaignPayload>>({ type: 'CPD' });

  const set = (key: keyof CreateCampaignPayload, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await createCampaign(form as CreateCampaignPayload);
    setSubmitting(false);
    if (result.error) {
      alert(result.error);
    } else {
      onCreated();
    }
  };

  const isCpd = form.type === 'CPD';

  return (
    <Card variant="section" padding="md">
      <CardIconHeader
        icon={<Megaphone className="h-5 w-5 text-origen-pradera" />}
        title="Nueva campaña"
        description="Configura tipo, placement y presupuesto de tu campaña."
      />
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-text-subtle">Tipo</Label>
          <Select value={form.type} onValueChange={(v) => set('type', v as CampaignType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CPD">CPD — Coste por día</SelectItem>
              <SelectItem value="CPC">CPC — Coste por clic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-text-subtle">Placement</Label>
          <Select value={form.placement ?? ''} onValueChange={(v) => set('placement', v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {PLACEMENTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input
            label="Slug del producto"
            value={form.productSlug ?? ''}
            onChange={(e) => set('productSlug', e.target.value)}
            required
            placeholder="mi-producto-artesano"
          />
        </div>
        <div>
          <Input
            label="Titular (opcional)"
            value={form.headline ?? ''}
            onChange={(e) => set('headline', e.target.value)}
            maxLength={80}
            placeholder="El mejor queso curado"
          />
        </div>

        {isCpd ? (
          <>
            <div>
              <Input
                type="number"
                label="Precio/día (€)"
                min={0}
                step="0.01"
                value={form.pricePerDay ?? ''}
                onChange={(e) => set('pricePerDay', Number(e.target.value))}
                required
                leftIcon={<Euro />}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-text-subtle">Fecha inicio</Label>
              <DateInput
                value={form.startsAt ? form.startsAt.slice(0, 10) : ''}
                onChange={(e) => set('startsAt', e.target.value)}
                required
                aria-label="Fecha de inicio de la campaña"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-text-subtle">Fecha fin</Label>
              <DateInput
                value={form.endsAt ? form.endsAt.slice(0, 10) : ''}
                onChange={(e) => set('endsAt', e.target.value)}
                required
                aria-label="Fecha de fin de la campaña"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <Input
                type="number"
                label="Puja CPC (€)"
                min={0.01}
                step="0.01"
                value={form.cpcBid ?? ''}
                onChange={(e) => set('cpcBid', Number(e.target.value))}
                required
                leftIcon={<Euro />}
              />
            </div>
            <div>
              <Input
                type="number"
                label="Presupuesto diario (€)"
                min={1}
                step="0.01"
                value={form.dailyBudget ?? ''}
                onChange={(e) => set('dailyBudget', Number(e.target.value))}
                required
                leftIcon={<Euro />}
              />
            </div>
          </>
        )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onCancel} className="w-full sm:w-auto">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? 'Enviando...' : 'Enviar a revisión'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Campaign card ────────────────────────────────────────────────────────────

interface CampaignCardProps {
  campaign: Campaign;
  onDeleted: () => void;
  showDeleteButton?: boolean;
}

function CampaignCard({ campaign, onDeleted, showDeleteButton = true }: CampaignCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta campaña en borrador?')) return;
    setDeleting(true);
    const result = await deleteCampaign(campaign.id);
    setDeleting(false);
    if (result.error) {
      alert(result.error);
    } else {
      onDeleted();
    }
  };

  return (
    <Card padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-text-subtle truncate">
            {campaign.type} · {campaign.placement}
          </p>
          <h3 className="mt-1 font-semibold text-origen-bosque truncate">
            {campaign.headline ?? campaign.productSlug}
          </h3>
          <p className="text-xs text-text-subtle truncate">{campaign.productSlug}</p>
        </div>
        <Badge variant={STATUS_BADGE[campaign.status]} size="sm">
          {STATUS_LABEL[campaign.status]}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        {campaign.type === 'CPD' ? (
          <>
            <div>
              <p className="text-text-subtle">Precio/día</p>
              <p className="font-semibold text-origen-bosque">
                {campaign.pricePerDay ? formatMoney(campaign.pricePerDay) : '—'}
              </p>
            </div>
            <div>
              <p className="text-text-subtle">Inicio</p>
              <p className="font-semibold text-origen-bosque">
                {campaign.startsAt ? campaign.startsAt.slice(0, 10) : '—'}
              </p>
            </div>
            <div>
              <p className="text-text-subtle">Fin</p>
              <p className="font-semibold text-origen-bosque">
                {campaign.endsAt ? campaign.endsAt.slice(0, 10) : '—'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-text-subtle">Puja CPC</p>
              <p className="font-semibold text-origen-bosque">
                {campaign.cpcBid ? formatMoney(campaign.cpcBid) : '—'}
              </p>
            </div>
            <div>
              <p className="text-text-subtle">Presupuesto</p>
              <p className="font-semibold text-origen-bosque">
                {campaign.dailyBudget ? formatMoney(campaign.dailyBudget) : '—'}
              </p>
            </div>
            <div>
              <p className="text-text-subtle">Restante hoy</p>
              <p className="font-semibold text-origen-bosque">
                {campaign.remainingBudget != null ? formatMoney(campaign.remainingBudget) : '—'}
              </p>
            </div>
          </>
        )}
      </div>

      {campaign.status === 'DRAFT' && showDeleteButton && (
        <div className="mt-3 flex gap-2 pt-3 border-t border-border-subtle">
          <Button variant="destructive" size="sm" onClick={() => void handleDelete()} disabled={deleting} className="w-full sm:w-auto">
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');
  const isFirstLoad = React.useRef(true);
  const showPageLoader = useDelayedLoading(isFirstLoad.current && loading);

  const loadCampaigns = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsTableLoading(true);
    }
    setError(null);
    const result = await fetchMyCampaigns({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      limit: 50,
    });
    setLoading(false);
    setIsTableLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setCampaigns(result.data.data);
      isFirstLoad.current = false;
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadCampaigns(isFirstLoad.current);
  }, [loadCampaigns]);

  const active = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const pending = campaigns.filter((c) => c.status === 'PENDING_REVIEW').length;
  const totalBudget = campaigns.reduce((acc, c) => {
    if (c.type === 'CPD' && c.pricePerDay) {
      const days =
        c.startsAt && c.endsAt
          ? Math.max(
              1,
              Math.round(
                (new Date(c.endsAt).getTime() - new Date(c.startsAt).getTime()) /
                  86_400_000,
              ) + 1,
            )
          : 0;
      return acc + c.pricePerDay * days;
    }
    return acc + (c.dailyBudget ?? 0);
  }, 0);

  // Show loader only on initial load
  if (showPageLoader) {
    return <PageLoader message="Cargando campañas..." className="animate-fade-in" />;
  }

  // Show error state if there's an error
  if (error && !loading) {
    return (
      <PageError
        title="Error al cargar campañas"
        message={error}
        onRetry={() => void loadCampaigns()}
      />
    );
  }

  const kpis: StatGridItem[] = [
    { label: 'Campañas activas', value: active, icon: <TrendingUp className="w-5 h-5" />, variant: 'hoja' },
    { label: 'Campañas en revisión', value: pending, icon: <PauseCircle className="w-5 h-5" />, variant: 'mandarina' },
    { label: 'Total campañas', value: campaigns.length, icon: <Megaphone className="w-5 h-5" />, variant: 'pradera' },
    { label: 'Presupuesto total', value: formatMoney(totalBudget), icon: <Wallet className="w-5 h-5" />, variant: 'bosque' },
  ];

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('¿Eliminar esta campaña en borrador?')) return;
    const result = await deleteCampaign(id);
    if (result.error) {
      alert(result.error);
    } else {
      void loadCampaigns();
    }
  };

  return (
    <div className="w-full">
      <MobilePullRefresh onRefresh={async () => { await loadCampaigns(); }}>
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8 space-y-4 sm:space-y-6">
          {/* Header */}
          <PageHeader
            title="Campañas"
            description="Gestiona tus campañas publicitarias"
            badgeText="Campañas"
            badgeIcon={Megaphone}
            tooltip="Campañas"
            tooltipDetailed="Crea y gestiona tus campañas publicitarias. Las estadísticas globales de rendimiento están en el panel principal."
            actions={
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void loadCampaigns()}
                  aria-label="Refrescar"
                >
                  <RefreshCw className={`h-4 w-4 ${(loading || isTableLoading) ? 'animate-spin' : ''}`} aria-hidden="true" />
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" />
                  Nueva campaña
                </Button>
              </div>
            }
          />

          {/* KPIs */}
          <StatGrid items={kpis} columns={4} />

          {/* Form */}
          {showForm && (
            <CreateCampaignForm
              onCreated={() => {
                setShowForm(false);
                void loadCampaigns();
              }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* Filtros desktop — hidden en móvil */}
          <div className="hidden lg:flex items-center gap-3">
            <Label className="text-sm font-medium text-text-subtle shrink-0">Estado:</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CampaignStatus | 'ALL')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="ACTIVE">Activas</SelectItem>
                <SelectItem value="PENDING_REVIEW">En revisión</SelectItem>
                <SelectItem value="PAUSED">Pausadas</SelectItem>
                <SelectItem value="ENDED">Finalizadas</SelectItem>
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
              {statusFilter !== 'ALL' && (
                <Badge variant="leaf" size="xs">{STATUS_LABEL[statusFilter as CampaignStatus]}</Badge>
              )}
            </Button>
          </div>

          {/* Panel de filtros móvil — Dialog simple */}
          {showFilters && (
            <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setShowFilters(false)}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-surface p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-semibold text-origen-bosque">Filtros</h3>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as CampaignStatus | 'ALL'); setShowFilters(false); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas</SelectItem>
                      <SelectItem value="ACTIVE">Activas</SelectItem>
                      <SelectItem value="PENDING_REVIEW">En revisión</SelectItem>
                      <SelectItem value="PAUSED">Pausadas</SelectItem>
                      <SelectItem value="ENDED">Finalizadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" className="w-full" onClick={() => setShowFilters(false)}>Cerrar</Button>
              </div>
            </div>
          )}

          {/* List */}
          {isTableLoading ? (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-origen-pastel/30" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <EmptyState
                size="sm"
                icon={<Megaphone className="w-6 h-6" />}
                title="Sin campañas"
                description="Crea tu primera campaña para empezar a promocionar tus productos."
              />
            </Card>
          ) : (
            <>
              {/* Móvil: MobileCardList con SwipeableRow para borradores */}
              <div className="lg:hidden space-y-3">
                <MobileCardList>
                  {campaigns.map((campaign) =>
                    campaign.status === 'DRAFT' ? (
                      <SwipeableRow
                        key={campaign.id}
                        actions={[{
                          label: 'Eliminar',
                          color: 'red',
                          icon: Trash2,
                          onPress: () => void handleDeleteCampaign(campaign.id),
                        }]}
                      >
                        <CampaignCard campaign={campaign} onDeleted={() => void loadCampaigns()} showDeleteButton={false} />
                      </SwipeableRow>
                    ) : (
                      <CampaignCard key={campaign.id} campaign={campaign} onDeleted={() => void loadCampaigns()} showDeleteButton={false} />
                    )
                  )}
                </MobileCardList>
              </div>

              {/* Desktop: lista normal */}
              <div className="hidden lg:block space-y-3">
                {campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} onDeleted={() => void loadCampaigns()} showDeleteButton />
                ))}
              </div>
            </>
          )}
        </div>
      </MobilePullRefresh>
    </div>
  );
}
