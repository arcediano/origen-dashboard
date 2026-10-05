/**
 * @component AiCreditsPanel
 * @description Estado de los créditos del asistente de IA, siempre visible arriba del
 * alta con IA (sin hacer scroll). Es visual, no textual: una ficha por cada crédito que
 * le queda (sin desglose gratis/comprados ni créditos gastados) y la equivalencia
 * "1 crédito = 1 producto". Sin créditos, cambia a un aviso neutro (no de error) con la
 * acción de recargar.
 */

'use client';

import { Coins, Package, Sparkles } from 'lucide-react';
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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-origen-pradera text-white shadow-subtle"
        >
          <Coins className="h-4 w-4" />
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
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-origen-bosque shadow-subtle">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 id="ai-credits-title" className="text-base font-semibold text-origen-bosque sm:text-lg">
            Te {plural(remaining, 'queda', 'quedan')}{' '}
            <span className="tabular-nums" data-testid="ai-credits-remaining">{remaining}</span>{' '}
            {plural(remaining, 'crédito', 'créditos')}
          </h2>
          <CreditTokens remaining={remaining} />
          <p
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-origen-bosque shadow-subtle"
            data-testid="ai-credits-equivalence"
          >
            <Coins className="h-3.5 w-3.5" aria-hidden="true" />
            1 crédito
            <span aria-hidden="true">=</span>
            <Package className="h-3.5 w-3.5" aria-hidden="true" />
            1 producto
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="hidden w-auto shrink-0 sm:inline-flex" onClick={onRecharge}>
          Recargar
        </Button>
      </div>
      <div className="mt-2 sm:hidden">
        <Button type="button" variant="ghost" size="sm" className="w-auto" onClick={onRecharge}>
          Recargar créditos
        </Button>
      </div>
    </section>
  );
}
