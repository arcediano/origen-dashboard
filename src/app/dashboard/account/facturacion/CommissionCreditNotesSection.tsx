'use client';

/**
 * @component CommissionCreditNotesSection
 * @description Facturas de comisión rectificativas que Origen emite al
 * productor cuando se aprueba un reembolso de un pedido cuya comisión ya
 * estaba facturada (importes negativos, "por diferencias"). No se muestra
 * nada si el productor no tiene ninguna.
 */

import { useEffect, useState } from 'react';
import { Download, FileMinus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button, Pagination, Table, toast, type Column } from '@arcediano/ux-library';
import { fetchSellerCommissionCreditNotes, type CommissionCreditNoteItem } from '@/lib/api/orders';

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

function handleDownload(id: string) {
  try {
    window.open(`/api/v1/orders/seller/commission-credit-notes/${id}/download`, '_blank');
  } catch (err) {
    console.error('Error descargando factura rectificativa:', err);
    toast({ title: 'Error al descargar la factura', description: 'Inténtalo de nuevo en unos segundos.', variant: 'error' });
  }
}

function CreditNoteCard({ note }: { note: CommissionCreditNoteItem }) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-border shadow-origen px-4 py-4 flex items-center gap-3.5">
      <div className="w-11 h-11 rounded-2xl bg-origen-pastel flex items-center justify-center shrink-0 shadow-subtle">
        <FileMinus className="w-5 h-5 text-origen-pino" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-origen-bosque truncate">{note.creditNoteNumber}</p>
        <p className="text-xs text-text-subtle truncate">Pedido {note.orderNumber}</p>
        <p className="text-xs text-text-subtle truncate">Rectifica {note.originalInvoiceNumber}</p>
        <p className="text-[11px] text-text-disabled mt-1">{formatDate(note.issuedAt)}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-base font-bold text-origen-bosque tabular-nums">{formatEuros(note.total)}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => handleDownload(note.id)}
          aria-label={`Descargar factura rectificativa ${note.creditNoteNumber}`}
          className="min-h-11 min-w-11"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function CommissionCreditNotesSection() {
  const [notes, setNotes] = useState<CommissionCreditNoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchSellerCommissionCreditNotes({ page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled || !res.data) return;
        setNotes(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  // Sin rectificativas (o error al cargarlas) no se ocupa espacio en la página.
  if (total === 0) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const columns: Column<CommissionCreditNoteItem>[] = [
    {
      key: 'creditNoteNumber',
      header: 'Nº rectificativa',
      accessor: (n) => <p className="text-sm font-medium text-origen-bosque">{n.creditNoteNumber}</p>,
    },
    {
      key: 'orderNumber',
      header: 'Pedido',
      accessor: (n) => <p className="text-sm text-text-subtle">{n.orderNumber}</p>,
    },
    {
      key: 'originalInvoiceNumber',
      header: 'Rectifica',
      accessor: (n) => <p className="text-sm text-text-subtle">{n.originalInvoiceNumber}</p>,
    },
    {
      key: 'issuedAt',
      header: 'Emitida',
      accessor: (n) => <p className="text-sm text-text-subtle">{formatDate(n.issuedAt)}</p>,
    },
    {
      key: 'total',
      header: 'Importe',
      accessor: (n) => <p className="text-sm font-bold text-origen-bosque tabular-nums">{formatEuros(n.total)}</p>,
    },
    {
      key: 'download',
      header: '',
      accessor: (n) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(n.id);
          }}
          aria-label={`Descargar factura rectificativa ${n.creditNoteNumber}`}
        >
          <Download className="w-4 h-4" />
        </Button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <section aria-labelledby="commission-credit-notes-title" className="space-y-3">
      <div>
        <h2 id="commission-credit-notes-title" className="text-base font-semibold text-origen-bosque">
          Facturas rectificativas de comisión
        </h2>
        <p className="text-sm text-text-subtle">
          Se emiten cuando se aprueba un reembolso de un pedido cuya comisión ya estaba facturada. Restan
          esa comisión (importe negativo) y quedan vinculadas al pedido y a la factura original.
        </p>
      </div>

      <div className="space-y-3 block lg:hidden" aria-busy={isLoading || undefined}>
        {notes.map((note) => (
          <CreditNoteCard key={note.id} note={note} />
        ))}
      </div>

      <div className="hidden lg:block">
        <Table
          data={notes}
          columns={columns}
          keyExtractor={(n) => n.id}
          loading={isLoading}
          emptyMessage="No hay facturas rectificativas"
        />
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />
      )}
    </section>
  );
}
