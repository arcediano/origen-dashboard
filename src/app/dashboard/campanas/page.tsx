'use client';

import { useCallback, useEffect, useState } from 'react';
import { Megaphone, PauseCircle, Plus, RefreshCw, Trash2, TrendingUp } from 'lucide-react';
import { SoftStatCard } from '@/components/shared/SoftStatCard';
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
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-blue-100 text-blue-700',
  ENDED: 'bg-gray-100 text-gray-500',
  REJECTED: 'bg-red-100 text-red-700',
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
            Tipo
          </label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value as CampaignType)}
            className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-origen-bosque outline-none focus:border-origen-hoja focus:ring-2 focus:ring-origen-hoja/20"
          >
            <option value="CPD">CPD — Coste por día</option>
            <option value="CPC">CPC — Coste por clic</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
            Placement
          </label>
          <select
            value={form.placement ?? ''}
            onChange={(e) => set('placement', e.target.value)}
            required
            className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-origen-bosque outline-none focus:border-origen-hoja focus:ring-2 focus:ring-origen-hoja/20"
          >
            <option value="">Seleccionar...</option>
            {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
            Slug del producto
          </label>
          <input
            value={form.productSlug ?? ''}
            onChange={(e) => set('productSlug', e.target.value)}
            required
            placeholder="mi-producto-artesano"
            className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-origen-bosque outline-none focus:border-origen-hoja focus:ring-2 focus:ring-origen-hoja/20"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
            Titular (opcional)
          </label>
          <input
            value={form.headline ?? ''}
            onChange={(e) => set('headline', e.target.value)}
            maxLength={80}
            placeholder="El mejor queso curado"
            className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-origen-bosque outline-none focus:border-origen-hoja focus:ring-2 focus:ring-origen-hoja/20"
          />
        </div>

        {isCpd ? (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                Precio/día (€)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.pricePerDay ?? ''}
                onChange={(e) => set('pricePerDay', Number(e.target.value))}
                required
                className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-origen-bosque outline-none focus:border-origen-hoja focus:ring-2 focus:ring-origen-hoja/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={form.startsAt ? form.startsAt.slice(0, 10) : ''}
                onChange={(e) => set('startsAt', e.target.value)}
                required
                className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-origen-bosque outline-none focus:border-origen-hoja focus:ring-2 focus:ring-origen-hoja/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={form.endsAt ? form.endsAt.slice(0, 10) : ''}
                onChange={(e) => set('endsAt', e.target.value)}
                required
                className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-origen-bosque outline-none focus:border-origen-hoja focus:ring-2 focus:ring-origen-hoja/20"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                Puja CPC (€)
              </label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={form.cpcBid ?? ''}
                onChange={(e) => set('cpcBid', Number(e.target.value))}
                required
                className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-origen-bosque outline-none focus:border-origen-hoja focus:ring-2 focus:ring-origen-hoja/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                Presupuesto diario (€)
              </label>
              <input
                type="number"
                min={1}
                step="0.01"
                value={form.dailyBudget ?? ''}
                onChange={(e) => set('dailyBudget', Number(e.target.value))}
                required
                className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-origen-bosque outline-none focus:border-origen-hoja focus:ring-2 focus:ring-origen-hoja/20"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border-subtle px-4 py-2 text-sm text-text-subtle hover:bg-surface"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-origen-bosque px-4 py-2 text-sm font-semibold text-white hover:bg-origen-pino disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : 'Enviar a revisión'}
        </button>
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
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-xl border border-border-subtle px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
        </div>
      )}
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const result = await fetchMyCampaigns({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      limit: 50,
    });
    setLoading(false);
    if (result.data) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-origen-bosque sm:text-2xl">Mis campañas</h1>
          <p className="mt-1 text-sm text-text-subtle">
            Gestiona tu visibilidad en el marketplace con campañas CPC y CPD.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadCampaigns()}
            className="rounded-xl border border-border-subtle p-2 text-text-subtle hover:bg-surface"
            aria-label="Refrescar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-origen-bosque px-3 py-2 text-sm font-semibold text-white hover:bg-origen-pino"
          >
            <Plus className="h-4 w-4" />
            Nueva campaña
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <SoftStatCard
          label="Activas"
          value={active}
          icon={TrendingUp}
          bg="from-origen-hoja/5 to-transparent"
          border="border-origen-hoja/10"
          iconColor="text-origen-hoja"
        />
        <SoftStatCard
          label="En revisión"
          value={pending}
          icon={PauseCircle}
          bg="from-amber-400/10 to-transparent"
          border="border-amber-200/50"
          iconColor="text-amber-500"
        />
        <SoftStatCard
          label="Presupuesto total"
          value={formatMoney(totalBudget)}
          icon={Megaphone}
          bg="from-origen-pradera/5 to-transparent"
          border="border-origen-pradera/10"
          iconColor="text-origen-pradera"
          className="col-span-2 lg:col-span-1"
        />
      </div>

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
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'ACTIVE', 'PENDING_REVIEW', 'PAUSED', 'ENDED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-origen-bosque text-white'
                : 'border border-border-subtle text-text-subtle hover:bg-surface'
            }`}
          >
            {s === 'ALL' ? 'Todas' : STATUS_LABEL[s as CampaignStatus]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando campañas...">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-origen-pastel/30" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-alt px-6 py-10 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-text-subtle" aria-hidden="true" />
          <p className="text-sm text-text-subtle">
            Aún no tienes campañas. Crea una para aumentar tu visibilidad.
          </p>
        </div>
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
