'use client';

import { useCallback, useEffect, useState } from 'react';
import { Euro, Megaphone, PauseCircle, Plus, RefreshCw, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { Button, DateInput, Input, Label, PageHeader, StatGrid, EmptyState, PageLoader, PageError, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Card } from '@arcediano/ux-library';
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

const STATUS_COLOR: Record<CampaignStatus, string> = {
  DRAFT:          'bg-surface text-text-subtle',
  PENDING_REVIEW: 'bg-origen-mandarina/15 text-origen-mandarina',
  ACTIVE:         'bg-origen-hoja/20 text-origen-pino',
  PAUSED:         'bg-surface text-text-secondary',
  ENDED:          'bg-surface-alt text-text-subtle',
  REJECTED:       'bg-feedback-danger-subtle text-feedback-danger-text',
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
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl border border-border-subtle bg-surface-alt p-4 shadow-sm space-y-4"
    >
      <h3 className="font-semibold text-origen-bosque">Nueva campaña</h3>

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

      <div className="flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar a revisión'}
        </Button>
      </div>
    </form>
  );
}

// ─── Campaign card ────────────────────────────────────────────────────────────

interface CampaignCardProps {
  campaign: Campaign;
  onDeleted: () => void;
}

function CampaignCard({ campaign, onDeleted }: CampaignCardProps) {
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
    <article className="rounded-2xl border border-border-subtle bg-surface-alt p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">
            {campaign.type} · {campaign.placement}
          </p>
          <h3 className="mt-1 font-semibold text-origen-bosque">
            {campaign.headline ?? campaign.productSlug}
          </h3>
          <p className="text-xs text-text-subtle">{campaign.productSlug}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[campaign.status]}`}>
          {STATUS_LABEL[campaign.status]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
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

      {campaign.status === 'DRAFT' && (
        <div className="mt-3 flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        </div>
      )}
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchMyCampaigns({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      limit: 50,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setCampaigns(result.data.data);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadCampaigns();
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
  if (loading && campaigns.length === 0) {
    return <PageLoader message="Cargando campañas..." />;
  }

  // Show error state if there's an error
  if (error && campaigns.length === 0) {
    return (
      <PageError
        title="Error al cargar campañas"
        message={error}
        onRetry={loadCampaigns}
      />
    );
  }

  const kpis: StatGridItem[] = [
    { label: 'Campañas activas', value: active, icon: <TrendingUp className="w-5 h-5" />, variant: 'hoja' },
    { label: 'Campañas en revisión', value: pending, icon: <PauseCircle className="w-5 h-5" />, variant: 'mandarina' },
    { label: 'Total campañas', value: campaigns.length, icon: <Megaphone className="w-5 h-5" />, variant: 'pradera' },
    { label: 'Presupuesto total', value: formatMoney(totalBudget), icon: <Wallet className="w-5 h-5" />, variant: 'bosque' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Campañas"
        description="Gestiona tus campañas publicitarias"
        badgeText="Campañas"
        badgeIcon={Megaphone}
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void loadCampaigns()}
              aria-label="Refrescar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
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

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium text-text-subtle">Estado:</Label>
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

      {/* List */}
      {loading && campaigns.length > 0 ? (
        <div className="space-y-3" aria-busy="true" aria-label="Actualizando campañas...">
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
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onDeleted={() => void loadCampaigns()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
