/**
 * @component AiCreditsPanel
 * @description Estado de los créditos del asistente de IA, siempre visible arriba del
 * alta con IA (sin hacer scroll). Es visual, no textual: una ficha por cada crédito que
 * le queda (sin desglose gratis/comprados ni créditos gastados) y la equivalencia
 * "1 crédito = 1 producto". Sin créditos, cambia a un aviso neutro (no de error) con la
 * acción de recargar.
 */

'use client';

import { Coins, Package, Plus, Sparkles } from 'lucide-react';
import { Button } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';

export interface AiCreditsPanelProps {
  quota: { used: number; total: number; free?: number; purchased?: number };
  onRecharge: () => void;
  /** Alternativa sin IA cuando no quedan créditos. */
  onManual?: () => void;
  className?: string;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Fichas de crédito que se dibujan como máximo; el resto se resume en "+N". */
const MAX_VISIBLE_TOKENS = 8;

function CreditTokens({ remaining }: { remaining: number }) {
  const visible = Math.min(remaining, MAX_VISIBLE_TOKENS);
  const extra = remaining - visible;
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true" data-testid="ai-credits-tokens">
      {Array.from({ length: visible }, (_, i) => (
        <span
          key={i}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-origen-pradera text-white shadow-subtle sm:h-8 sm:w-8"
        >
          <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
      ))}
      {extra > 0 && <span className="text-sm font-semibold text-origen-bosque">+{extra}</span>}
    </div>
  );
}

export function AiCreditsPanel({ quota, onRecharge, onManual, className }: AiCreditsPanelProps) {
  const remaining = Math.max(0, quota.total - quota.used);
  const exhausted = remaining === 0;

  if (exhausted) {
    return (
      <section
        aria-labelledby="ai-credits-title"
        data-testid="ai-credits-panel"
        data-state="exhausted"
        className={cn(
          'rounded-2xl border border-origen-mandarina/40 bg-origen-mandarina/10 p-4 sm:p-5',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-feedback-warning-text shadow-subtle">
            <Coins className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 id="ai-credits-title" className="text-base font-semibold text-origen-bosque">
              No te quedan créditos del asistente
            </h2>
            <p className="text-sm text-text-subtle">
              Recarga con tarjeta{onManual ? ' o crea este producto a mano' : ''}. 1 crédito = 1 producto.
            </p>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button type="button" variant="primary" size="sm" className="w-auto" onClick={onRecharge} leftIcon={<Coins className="h-4 w-4" aria-hidden="true" />}>
                Recargar créditos
              </Button>
              {onManual && (
                <Button type="button" variant="ghost" size="sm" className="w-auto" onClick={onManual}>
                  Prefiero rellenarlo yo
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="ai-credits-title"
      data-testid="ai-credits-panel"
      data-state="available"
      className={cn('rounded-2xl border border-origen-pradera/30 bg-origen-pradera/10 p-4 sm:p-5', className)}
    >
      {/* Una sola rejilla para ambos tamaños. Móvil: icono + título arriba, fichas a todo
          el ancho, y una fila final con la equivalencia a la izquierda y "Recargar" a la
          derecha (el botón deja de ocupar una fila entera y de competir con el resto).
          Escritorio: icono a la izquierda, texto en columna y botón a la derecha. */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-origen-bosque shadow-subtle sm:row-span-3 sm:h-12 sm:w-12">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2
          id="ai-credits-title"
          className="col-span-2 min-w-0 text-base font-semibold text-origen-bosque sm:col-span-1 sm:col-start-2 sm:text-lg"
        >
          Te {plural(remaining, 'queda', 'quedan')}{' '}
          <span className="tabular-nums" data-testid="ai-credits-remaining">{remaining}</span>{' '}
          {plural(remaining, 'crédito', 'créditos')}
        </h2>
        <div className="col-span-3 sm:col-span-1 sm:col-start-2">
          <CreditTokens remaining={remaining} />
        </div>
        <p
          className="col-span-2 inline-flex items-center gap-1.5 justify-self-start whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-medium text-origen-bosque shadow-subtle sm:col-span-1 sm:col-start-2"
          data-testid="ai-credits-equivalence"
        >
          <Coins className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
          1 crédito
          <span aria-hidden="true">=</span>
          <Package className="h-3.5 w-3.5" aria-hidden="true" />
          1 producto
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="col-start-3 w-auto shrink-0 sm:row-span-3 sm:row-start-1 sm:self-center"
          onClick={onRecharge}
          aria-label="Recargar créditos"
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
        >
          Recargar
        </Button>
      </div>
    </section>
  );
}
