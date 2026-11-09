'use client';

/**
 * @component PayoutHistorySection
 * @description Histórico completo de cobros del productor (petición del
 * humano, 2026-11-08): a diferencia de "Próximos cobros" (vista previa de
 * solo 3 pendientes, en payments/page.tsx), aquí se lista TODA la
 * actividad de Transfer -- programado, ya cobrado, revertido o con pedido
 * reembolsado -- paginada, con un aviso fijo sobre la demora adicional
 * hasta que el dinero llega al banco del productor.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { History, CalendarClock, CheckCircle2, RotateCcw, Undo2 } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardIconHeader, Alert, AlertDescription, Pagination, Table, EmptyState, type Column, type BadgeProps } from '@arcediano/ux-library';
import { fetchSellerPayoutHistory, type SellerPayoutHistoryItem, type SellerPayoutHistoryStatus } from '@/lib/api/orders';

const PAGE_SIZE = 10;

const formatEuros = (n: number) =>
  `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const formatDate = (iso: string) => {
  try {
    return format(new Date(iso), 'd MMM yyyy', { locale: es });
  } catch {
    return iso;
  }
};

const STATUS_META: Record<
  SellerPayoutHistoryStatus,
  { label: string; variant: BadgeProps['variant']; icon: typeof CheckCircle2 }
> = {
  scheduled: { label: 'Programado', variant: 'warning', icon: CalendarClock },
  executed: { label: 'Cobrado', variant: 'success', icon: CheckCircle2 },
  reversed: { label: 'Revertido', variant: 'danger', icon: RotateCcw },
  refunded: { label: 'Reembolsado', variant: 'danger', icon: Undo2 },
};

function dateLabelFor(item: SellerPayoutHistoryItem): string {
  if (item.status === 'reversed' && item.transferReversedAt) {
    return `Revertido el ${formatDate(item.transferReversedAt)}`;
  }
  if (item.status === 'refunded' && item.refundedAt) {
    return `Reembolsado el ${formatDate(item.refundedAt)}`;
  }
  if (item.transferExecutedAt) {
    return `Cobrado el ${formatDate(item.transferExecutedAt)}`;
  }
  if (item.transferScheduledAt) {
    return `Programado para el ${formatDate(item.transferScheduledAt)}`;
  }
  return formatDate(item.createdAt);
}

function PayoutHistoryCard({ item, onClick }: { item: SellerPayoutHistoryItem; onClick: () => void }) {
  const meta = STATUS_META[item.status];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl sm:rounded-2xl border border-border-subtle bg-surface-alt px-4 py-3.5 text-left transition-colors hover:border-origen-pradera/50 min-h-11"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-origen-bosque truncate">Pedido {item.orderNumber}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{dateLabelFor(item)}</p>
        </div>
        <span className="text-base font-bold text-origen-bosque tabular-nums shrink-0">
          {formatEuros(item.netAmount)}
        </span>
      </div>
      <Badge variant={meta.variant} size="xs" className="mt-2 flex items-center gap-1.5 w-fit">
        <meta.icon className="h-3 w-3" aria-hidden="true" />
        {meta.label}
      </Badge>
    </button>
  );
}

export function PayoutHistorySection() {
  const router = useRouter();
  const [items, setItems] = useState<SellerPayoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchSellerPayoutHistory({ page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled || !res.data) return;
        setItems(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const goToOrder = (orderId: string) => router.push(`/dashboard/orders/${orderId}`);

  const columns: Column<SellerPayoutHistoryItem>[] = [
    {
      key: 'orderNumber',
      header: 'Pedido',
      accessor: (item) => <p className="text-sm font-medium text-origen-bosque">{item.orderNumber}</p>,
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (item) => {
        const meta = STATUS_META[item.status];
        return (
          <Badge variant={meta.variant} size="sm" className="flex items-center gap-1.5 w-fit">
            <meta.icon className="h-3 w-3" aria-hidden="true" />
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: 'date',
      header: 'Fecha',
      accessor: (item) => <p className="text-sm text-text-subtle">{dateLabelFor(item)}</p>,
    },
    {
      key: 'netAmount',
      header: 'Importe',
      accessor: (item) => (
        <p className="text-sm font-bold text-origen-bosque tabular-nums">{formatEuros(item.netAmount)}</p>
      ),
      className: 'text-right',
    },
  ];

  return (
    <Card variant="section" className="rounded-xl sm:rounded-2xl" padding="none">
      <CardHeader className="p-4 sm:p-5 lg:p-6 border-b border-border-subtle">
        <CardIconHeader
          icon={<History className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />}
          title="Historial de cobros"
          size="md"
        />
      </CardHeader>
      <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4">
        <Alert variant="info">
          <AlertDescription>
            Cuando un cobro se marca como &quot;Cobrado&quot;, Origen ya ha transferido el importe a tu cuenta de
            Stripe. Desde ahí, Stripe lo deposita en tu cuenta bancaria según tu propio calendario de pagos —
            esto puede añadir uno o varios días hábiles adicionales antes de que lo veas reflejado en tu banco.
          </AlertDescription>
        </Alert>

        {total === 0 && !isLoading ? (
          <EmptyState
            size="sm"
            icon={<History className="w-6 h-6" />}
            title="Todavía no hay cobros"
            description="Aquí verás cada cobro programado o ya realizado en cuanto tengas pedidos entregados."
          />
        ) : (
          <>
            <div className="space-y-2.5 block lg:hidden" aria-busy={isLoading || undefined}>
              {items.map((item) => (
                <PayoutHistoryCard key={item.orderId} item={item} onClick={() => goToOrder(item.orderId)} />
              ))}
            </div>

            <div className="hidden lg:block">
              <Table
                data={items}
                columns={columns}
                keyExtractor={(item) => item.orderId}
                onRowClick={(item) => goToOrder(item.orderId)}
                loading={isLoading}
                emptyMessage="No hay cobros todavía"
              />
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-2" />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
