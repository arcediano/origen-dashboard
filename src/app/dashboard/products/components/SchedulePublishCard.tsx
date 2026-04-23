/**
 * @component SchedulePublishCard
 * @description Tarjeta compacta para programar la publicación de un producto.
 *              Solo visible en edición (el producto ya tiene ID).
 *              Muestra un date-time picker nativo y llama a PATCH /products/:id/schedule.
 */

'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@arcediano/ux-library';
import { toast } from '@arcediano/ux-library';
import { scheduleProduct } from '@/lib/api/products';

interface SchedulePublishCardProps {
  productId:   string;
  currentScheduledAt?: string | null; // ISO string si ya estaba programado
}

export function SchedulePublishCard({ productId, currentScheduledAt }: SchedulePublishCardProps) {
  const defaultValue = currentScheduledAt
    ? new Date(currentScheduledAt).toISOString().slice(0, 16)
    : '';

  const [scheduledAt, setScheduledAt] = useState(defaultValue);
  const [isScheduling, setIsScheduling]  = useState(false);
  const [success, setSuccess]            = useState(false);

  // Mínimo: 5 minutos a partir de ahora
  const minDatetime = new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16);

  const handleSchedule = async () => {
    if (!scheduledAt) return;
    const date = new Date(scheduledAt);
    if (date <= new Date()) {
      toast({ title: 'Fecha inválida', description: 'La fecha debe ser en el futuro.', variant: 'error' });
      return;
    }

    setIsScheduling(true);
    setSuccess(false);

    const result = await scheduleProduct(productId, date);

    setIsScheduling(false);
    if (result.error) {
      toast({ title: 'Error al programar', description: result.error, variant: 'error' });
    } else {
      setSuccess(true);
      toast({
        title: 'Publicación programada',
        description: `El producto se publicará el ${date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}.`,
        variant: 'success',
      });
    }
  };

  return (
    <div className="rounded-2xl border border-origen-pradera/20 bg-gradient-to-br from-origen-crema/40 to-white p-4 sm:p-5 space-y-3">
      {/* Cabecera */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-origen-pradera/10 flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4 text-origen-pradera" />
        </div>
        <div>
          <p className="text-sm font-semibold text-origen-bosque">Programar publicación</p>
          <p className="text-xs text-text-subtle">El producto se activará automáticamente en la fecha elegida.</p>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="datetime-local"
          value={scheduledAt}
          min={minDatetime}
          onChange={(e) => { setScheduledAt(e.target.value); setSuccess(false); }}
          className="flex-1 h-10 px-3 rounded-xl border border-border bg-white text-sm text-origen-bosque focus:outline-none focus:ring-2 focus:ring-origen-pradera/30 focus:border-origen-pradera transition-all"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSchedule}
          disabled={!scheduledAt || isScheduling}
          loading={isScheduling}
          leftIcon={<CalendarClock className="w-4 h-4" />}
          className="shrink-0"
        >
          Programar
        </Button>
      </div>

      {/* Feedback */}
      {success && (
        <p className="flex items-center gap-1.5 text-xs text-feedback-success font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Publicación programada correctamente
        </p>
      )}
      {currentScheduledAt && !success && (
        <p className="flex items-center gap-1.5 text-xs text-text-subtle">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          Programado para: {new Date(currentScheduledAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      )}
    </div>
  );
}
