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
          'rounded-2xl border border-origen-mandarina/40 bg-origen-mandarina/10 p-3 sm:p-4',
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
      className={cn('rounded-2xl border border-origen-pradera/30 bg-origen-pradera/10 p-3 sm:p-4', className)}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Icono + contenido en fila propia, sin los botones de acción --
            este panel SOLO se usa en la columna lateral de 360px fijos de
            AiAssistChat.tsx (lg:grid-cols-[...]_360px]). Los breakpoints de
            Tailwind responden al ancho del VIEWPORT, no al de ese contenedor
            -- a partir de 640px (`sm:`) el título entraba en fila junto a los
            2 botones de acción, compitiendo por un ancho real de ~360px y
            partiéndose palabra por palabra (hallazgo real, captura de
            pantalla del humano en escritorio, 2026-10-27). Las acciones se
            quedan siempre en su propia fila, sin depender del viewport. */}
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-origen-bosque shadow-subtle sm:h-12 sm:w-12">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 id="ai-credits-title" className="min-w-0 text-base font-semibold leading-tight text-origen-bosque sm:text-lg">
              Te {plural(remaining, 'queda', 'quedan')}{' '}
              <span className="tabular-nums" data-testid="ai-credits-remaining">{remaining}</span>{' '}
              {plural(remaining, 'crédito', 'créditos')}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CreditTokens remaining={remaining} />
              <p
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-origen-bosque shadow-subtle sm:text-xs"
                data-testid="ai-credits-equivalence"
              >
                <Coins className="h-3 w-3" aria-hidden="true" />
                <span>1 crédito = 1 producto</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 xs:flex-row xs:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 px-3 xs:w-auto"
            onClick={onRecharge}
            aria-label="Recargar créditos"
            leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Recarga
          </Button>
        </div>
      </div>
    </section>
  );
}
