/**
 * @file DisputesInbox.tsx
 * @description Bandeja "Disputas" del productor, con el mismo patrón que Pedidos:
 *  - Lista: tabla en escritorio y tarjetas (como OrderCard) en móvil; las que esperan respuesta
 *    llevan el borde de aviso.
 *  - Detalle: al elegir una disputa se muestra su conversación completa sobre una superficie
 *    blanca a todo el ancho, sin tarjeta, con las secciones separadas por líneas.
 *  - Sin disputas: el estado vacío va directamente sobre el fondo, centrado.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ChevronRight, Scale } from 'lucide-react';
import { Badge, Button, EmptyState, Table, type Column } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import { fetchMyDisputes, type Dispute } from '@/lib/api/disputes';
import { DISPUTE_REASON_LABEL, DISPUTE_STATUS_LABEL, isDisputeClosed } from '@/lib/dispute-labels';
import { DisputeDetail } from './DisputeDetail';

const CONTAINER = 'container mx-auto px-4 sm:px-6 lg:px-8';

const statusVariant = (d: Dispute) =>
  isDisputeClosed(d.status) ? 'success' : d.status === 'AWAITING_PRODUCER' ? 'warning' : 'info';

const openedOn = (d: Dispute) => format(new Date(d.createdAt), "d 'de' MMM yyyy", { locale: es });
const lastActivity = (d: Dispute) => formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true, locale: es });

export function DisputesInbox({
  initialId,
  onSelectChange,
}: {
  initialId?: string | null;
  /** Se llama al abrir o cerrar una disputa (la página lo usa para reflejarlo en la URL). */
  onSelectChange?: (id: string | null) => void;
}) {
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);

  useEffect(() => {
    fetchMyDisputes()
      .then((list) => setDisputes([...list].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))))
      .catch(() => setFailed(true));
  }, []);

  // Atrás/adelante del navegador cambian el ?id= de la URL.
  useEffect(() => {
    setSelectedId(initialId ?? null);
  }, [initialId]);

  const select = (id: string | null) => {
    setSelectedId(id);
    onSelectChange?.(id);
  };

  if (failed) {
    return (
      <div className={`${CONTAINER} py-6`}>
        <p className="text-base text-feedback-danger-text">No se pudieron cargar tus disputas. Inténtalo de nuevo.</p>
      </div>
    );
  }
  if (!disputes) {
    return (
      <div className={`${CONTAINER} py-6`}>
        <p className="text-base text-origen-pino">Cargando disputas…</p>
      </div>
    );
  }
  if (disputes.length === 0) {
    return (
      <div className={`${CONTAINER} py-10`}>
        <EmptyState
          size="sm"
          icon={<Scale className="h-6 w-6" />}
          title="No tienes disputas"
          description="Cuando un comprador abra una disputa sobre uno de tus pedidos, aparecerá aquí con toda la conversación."
        />
      </div>
    );
  }

  const selected = disputes.find((d) => d.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="border-y border-border-subtle bg-white" data-testid="dispute-detail">
        <div className={`${CONTAINER} py-5 sm:py-6`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="md" className="w-auto" onClick={() => select(null)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Todas las disputas
            </Button>
            <Link
              href={`/dashboard/orders/${selected.orderId}`}
              className="text-base font-semibold text-origen-bosque underline decoration-origen-pradera underline-offset-4 hover:text-origen-hoja"
            >
              Ver el pedido
            </Link>
          </div>
          <DisputeDetail key={selected.id} dispute={selected} />
        </div>
      </div>
    );
  }

  const columns: Column<Dispute>[] = [
    {
      key: 'reason',
      header: 'Motivo',
      accessor: (d) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-origen-bosque">{DISPUTE_REASON_LABEL[d.reason] ?? 'Otro motivo'}</p>
          <p className="line-clamp-1 max-w-md text-sm text-origen-pino">{d.description}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (d) => (
        <Badge variant={statusVariant(d)} size="sm">
          {DISPUTE_STATUS_LABEL[d.status] ?? 'En curso'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Abierta',
      accessor: (d) => <p className="text-sm text-origen-bosque">{openedOn(d)}</p>,
    },
    {
      key: 'updatedAt',
      header: 'Última actividad',
      accessor: (d) => <p className="text-sm text-origen-bosque">{lastActivity(d)}</p>,
    },
    {
      key: 'open',
      header: '',
      accessor: () => <ChevronRight className="h-4 w-4 text-origen-pino" aria-hidden />,
      className: 'text-right',
    },
  ];

  return (
    <div className={`${CONTAINER} py-5 sm:py-6 lg:py-8`}>
      {/* Móvil: tarjetas, igual que la lista de Pedidos */}
      <ul className="block space-y-3 lg:hidden" aria-label="Disputas">
        {disputes.map((d) => {
          const needsReply = d.status === 'AWAITING_PRODUCER';
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => select(d.id)}
                aria-label={`${DISPUTE_REASON_LABEL[d.reason] ?? 'Otro motivo'}. Abierta el ${openedOn(d)}`}
                className={cn(
                  'flex w-full items-center gap-3.5 rounded-xl border bg-surface-alt px-4 py-4 text-left shadow-origen sm:rounded-2xl',
                  'transition-all duration-300 hover:border-origen-pradera hover:shadow-origen-lg active:bg-origen-crema/40 focus:outline-none',
                  needsReply ? 'border-feedback-warning-border' : 'border-border',
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-origen-pastel shadow-subtle">
                  <Scale className="h-5 w-5 text-origen-pino" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-origen-bosque">
                    {DISPUTE_REASON_LABEL[d.reason] ?? 'Otro motivo'}
                  </span>
                  <p className="truncate text-sm text-origen-bosque">{d.description}</p>
                  <Badge variant={statusVariant(d)} size="xs" className="mt-2">
                    {DISPUTE_STATUS_LABEL[d.status] ?? 'En curso'}
                  </Badge>
                  <p className="mt-1.5 text-[11px] text-text-subtle">
                    Abierta el {openedOn(d)} · {lastActivity(d)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-origen-pino" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Escritorio: tabla */}
      <div className="hidden lg:block">
        <Table
          data={disputes}
          columns={columns}
          keyExtractor={(d) => d.id}
          onRowClick={(d) => select(d.id)}
          rowClassName="cursor-pointer hover:bg-origen-crema/30 transition-colors"
          emptyMessage="No tienes disputas"
        />
      </div>
    </div>
  );
}
