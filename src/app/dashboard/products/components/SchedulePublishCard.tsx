/**
 * @component SchedulePublishCard
 * @description Tarjeta compacta para programar la publicación de un producto.
 *              Solo visible en edición (el producto ya tiene ID).
 *              Muestra un date-time picker nativo y llama a PATCH /products/:id/schedule.
 */

'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Card } from '@arcediano/ux-library';
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
    // Mismo Card que el resto de pasos del asistente (variant="elevated",
    // padding md = p-4 sm:p-6) -- antes era un <div> a mano con degradado y
    // radio distintos, rompía la secuencia visual del wizard.
    <Card variant="elevated" className="space-y-3">
      {/* Cabecera */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-origen-pradera/10 flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4 text-hoja-tinta" />
        </div>
        <div>
          <p className="text-sm font-semibold text-origen-bosque">Programar publicación</p>
          <p className="text-xs text-text-subtle">El producto se activará automáticamente en la fecha elegida.</p>
        </div>
      </div>

      {/* Selector de fecha — no existe un DateInput de la librería con hora
          (solo type="date"), así que sigue siendo un input nativo, pero
          alineado al mismo tratamiento visual (bg-surface-alt, foco) que
          usan los DateInput del resto del asistente. */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="datetime-local"
          value={scheduledAt}
          min={minDatetime}
          onChange={(e) => { setScheduledAt(e.target.value); setSuccess(false); }}
          className="flex-1 h-10 px-3 rounded-xl border border-border-subtle bg-surface-alt text-sm font-medium text-origen-bosque hover:border-origen-pradera/55 focus:outline-none focus:ring-2 focus:ring-origen-pradera/20 focus:border-origen-pradera transition-colors"
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
          <AlertCircle className="w-3.5 h-3.5 text-feedback-warning" />
          Programado para: {new Date(currentScheduledAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      )}
    </Card>
  );
}
