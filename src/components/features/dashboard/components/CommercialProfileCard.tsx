'use client';

/**
 * @component CommercialProfileCard
 * @description «Tu perfil comercial al X %»: cuánto le falta al perfil público del productor para convencer a un
 * comprador (historia, fotos, eslogan…), qué mejoraría más el porcentaje y un acceso directo a «Mejorar con IA» en
 * Mi negocio. Dice cuántos usos de IA le quedan (misma bolsa que crear productos). Se oculta al llegar al 100 %.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Circle, Sparkles } from 'lucide-react';
import { Button, Card, CardContent } from '@arcediano/ux-library';
import { getProducerProfile } from '@/lib/api/producers';
import { getAiAssistQuota } from '@/lib/api/ai-assist';
import { scoreCommercialProfile, type CommercialProfileScore } from '@/lib/profile/commercial-score';
import type { AiAssistQuota } from '@/lib/ai-assist/label-proposal';

const BUSINESS_URL = '/dashboard/profile/business';

/** Frase sobre los usos de IA que le quedan, o null si no hay datos. */
export function aiUsesText(quota: AiAssistQuota | null): string | null {
  if (!quota || !quota.enabled) return null;
  const left = Math.max(0, quota.total - quota.used);
  if (left === 0) return 'No te quedan usos de IA: puedes mejorarlo a mano o comprar más.';
  return `Te ${left === 1 ? 'queda 1 uso' : `quedan ${left} usos`} de IA; revisar tu perfil gasta 1.`;
}

export function CommercialProfileCard({ enabled = true }: { enabled?: boolean }) {
  const [score, setScore] = useState<CommercialProfileScore | null>(null);
  const [quota, setQuota] = useState<AiAssistQuota | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getProducerProfile()
      .then((res) => {
        if (!cancelled) setScore(scoreCommercialProfile(res.data));
      })
      .catch(() => undefined);
    getAiAssistQuota()
      .then((q) => !cancelled && setQuota(q))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled || !score || score.percent >= 100) return null;
  const top = score.missing.slice(0, 3);
  const aiUses = aiUsesText(quota);
  const aiHelps = top.some((c) => c.aiCanHelp);

  return (
    <Card data-testid="commercial-profile-card" className="mb-5">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-origen-bosque">
              Tu perfil comercial está al <span data-testid="commercial-percent">{score.percent}</span> %
            </h3>
            <p className="text-sm text-text-subtle">Un perfil completo da confianza y ayuda a vender más.</p>
          </div>
        </div>

        <div
          className="h-2.5 w-full rounded-full bg-origen-pastel/60"
          role="progressbar"
          aria-label="Completitud del perfil comercial"
          aria-valuenow={score.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-2.5 rounded-full bg-origen-hoja" style={{ width: `${Math.max(3, score.percent)}%` }} />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-subtle">Lo que más te falta</p>
          <ul className="space-y-1.5" data-testid="commercial-missing">
            {top.map((c) => (
              <li key={c.key} className="flex items-start gap-2 text-sm text-origen-bosque">
                <Circle size={14} className="mt-1 shrink-0 text-text-subtle" aria-hidden="true" />
                <span>
                  {c.label} <span className="text-text-subtle">(+{c.weight} %)</span>
                </span>
              </li>
            ))}
          </ul>
          {score.criteria.some((c) => c.done) && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-text-subtle">
              <Check size={12} aria-hidden="true" />
              Ya tienes {score.criteria.filter((c) => c.done).length} de {score.criteria.length} apartados.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="primary" className="min-h-[44px] sm:w-auto">
            <Link href={BUSINESS_URL}>
              {aiHelps ? <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> : null}
              {aiHelps ? 'Mejorar con IA' : 'Completar mi perfil'}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          {aiHelps && aiUses && <p data-testid="ai-uses" className="text-xs text-text-subtle">{aiUses}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
