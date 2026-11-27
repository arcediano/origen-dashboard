'use client';

/**
 * Tarjeta "Calidad de tu ficha": puntuación orientativa y los consejos que más ayudan a vender.
 * No bloquea la publicación (los requisitos obligatorios van en su propio checklist).
 */
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ListingQuality } from '@/lib/products/listing-quality';

export function ListingQualityCard({ quality, editHref, className }: { quality: ListingQuality; editHref: string; className?: string }) {
  if (quality.tips.length === 0) return null;
  return (
    <section
      data-testid="listing-quality"
      aria-labelledby="listing-quality-title"
      className={cn('rounded-2xl border border-origen-pradera/25 bg-surface-alt p-4 shadow-sm', className)}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-origen-pradera/15">
          <Sparkles className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="listing-quality-title" className="text-sm font-semibold text-origen-bosque">
            Calidad de tu ficha: <span data-testid="listing-quality-score">{quality.score}%</span>
          </h2>
          <div
            role="progressbar"
            aria-valuenow={quality.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Calidad de la ficha"
            className="mt-2 h-2 overflow-hidden rounded-full bg-origen-pastel"
          >
            <div className="h-full rounded-full bg-origen-hoja" style={{ width: `${quality.score}%` }} />
          </div>
          <p className="mt-3 text-xs font-medium text-text-subtle">Para vender más:</p>
          <ul className="mt-1.5 space-y-1.5">
            {quality.tips.map((tip) => (
              <li key={tip.id} className="text-sm text-origen-bosque">
                {tip.message}
              </li>
            ))}
          </ul>
          <Link
            href={editHref}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-origen-bosque underline decoration-origen-pradera underline-offset-4 hover:text-origen-hoja"
          >
            Mejorar mi ficha
          </Link>
        </div>
      </div>
    </section>
  );
}
