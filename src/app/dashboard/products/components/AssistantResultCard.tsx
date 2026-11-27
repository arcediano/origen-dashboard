'use client';

/**
 * Resultado del asistente IA al crear un producto: un único bloque claro con lo que ya está listo y
 * lo que falta, cada punto con su acción. Sustituye al aviso genérico de «añade el precio» (que
 * seguía saliendo aunque el precio ya estuviera) y ofrece el formato de venta con sus variantes.
 */
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Button } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';

export type AssistantNutritionSource = 'label' | 'usda' | 'none' | null;

type ResultProduct = Pick<Product, 'id' | 'basePrice' | 'hasVariants' | 'variants' | 'netContent' | 'netContentUnit'>;

export interface ResultItem {
  id: 'texts' | 'price' | 'format' | 'nutrition';
  done: boolean;
  title: string;
  detail: string;
  action?: { label: string; step: 'basic' | 'pricing' | 'nutritional' };
}

const eur = (v: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);

/** Qué ha dejado hecho el asistente y qué falta, a partir del producto real y del origen de la nutrición. */
export function buildResultItems(product: ResultProduct, nutrition: AssistantNutritionSource): ResultItem[] {
  const variantPrices = (product.variants ?? []).map((v) => Number((v as { price?: number }).price ?? 0)).filter((p) => p > 0);
  const hasPrice = product.hasVariants ? variantPrices.length > 0 : (product.basePrice ?? 0) > 0;
  const priceLabel = product.hasVariants
    ? variantPrices.length
      ? `Desde ${eur(Math.min(...variantPrices))}`
      : ''
    : eur(product.basePrice ?? 0);
  const format = product.netContent ? `${product.netContent} ${product.netContentUnit ?? ''}`.trim() : '';

  return [
    {
      id: 'texts',
      done: true,
      title: 'Textos redactados por la IA',
      detail: 'Descripción, origen y elaboración. Léelos y corrige lo que no te encaje.',
      action: { label: 'Revisar textos', step: 'basic' },
    },
    hasPrice
      ? { id: 'price', done: true, title: 'Precio', detail: priceLabel, action: { label: 'Cambiar', step: 'pricing' } }
      : { id: 'price', done: false, title: 'Falta el precio', detail: 'Es obligatorio para publicar.', action: { label: 'Añadir precio', step: 'pricing' } },
    {
      id: 'format',
      done: true,
      title: product.hasVariants ? 'Varios formatos de venta' : format ? `Se vende por ${format}` : 'Formato de venta',
      detail: product.hasVariants
        ? `${product.variants.length} formato${product.variants.length === 1 ? '' : 's'} con su precio y stock.`
        : '¿Lo vendes también en otros formatos (250 g, 500 g…)? Añádelos como variantes, cada uno con su precio.',
      action: { label: product.hasVariants ? 'Gestionar formatos' : 'Añadir formatos', step: 'pricing' },
    },
    nutrition === 'none'
      ? { id: 'nutrition', done: false, title: 'Información nutricional', detail: 'No hemos podido rellenarla. Añádela antes de publicar.', action: { label: 'Añadir', step: 'nutritional' } }
      : nutrition === 'usda'
        ? { id: 'nutrition', done: true, title: 'Información nutricional orientativa', detail: 'Valores por 100 g de la base pública de USDA, no de tu etiqueta: revísalos.', action: { label: 'Revisar', step: 'nutritional' } }
        : { id: 'nutrition', done: true, title: 'Información nutricional', detail: 'Leída de la foto de tu etiqueta: compruébala.', action: { label: 'Comprobar', step: 'nutritional' } },
  ];
}

export function AssistantResultCard({
  product,
  nutrition,
  onLater,
  className,
}: {
  product: ResultProduct;
  nutrition: AssistantNutritionSource;
  onLater: () => void;
  className?: string;
}) {
  const items = buildResultItems(product, nutrition);
  const pending = items.filter((i) => !i.done).length;
  const edit = (step?: string) => `/dashboard/products/${product.id}/edit${step ? `?step=${step}` : ''}`;

  return (
    <section
      data-testid="assistant-result"
      aria-labelledby="assistant-result-title"
      className={cn('rounded-[28px] border border-origen-pradera/25 bg-surface-alt p-5 shadow-sm sm:p-6', className)}
    >
      <h2 id="assistant-result-title" className="text-lg font-semibold text-origen-bosque sm:text-xl">
        Tu borrador está listo
      </h2>
      <p className="mt-1 text-sm text-text-subtle">
        {pending > 0
          ? `Revísalo y completa ${pending === 1 ? 'lo que falta' : `los ${pending} puntos que faltan`} para publicarlo.`
          : 'Revísalo con calma y publícalo cuando quieras.'}
      </p>

      <ul className="mt-4 divide-y divide-border-subtle">
        {items.map((item) => (
          <li key={item.id} data-testid={`assistant-item-${item.id}`} data-done={item.done}>
            <Link
              href={edit(item.action?.step)}
              className="flex min-h-14 items-start gap-3 py-3 text-left transition-colors hover:bg-origen-crema/40"
            >
              {item.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-origen-hoja" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-feedback-warning-text" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-origen-bosque">{item.title}</span>
                <span className="mt-0.5 block text-sm text-text-subtle">{item.detail}</span>
              </span>
              {item.action && (
                <span className="flex shrink-0 items-center gap-0.5 pt-0.5 text-sm font-medium text-hoja-tinta">
                  <span className="hidden sm:inline">{item.action.label}</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href={edit()} className="sm:w-auto">
          <Button variant="primary" size="lg" className="w-full">
            Revisar y completar
          </Button>
        </Link>
        <Button variant="ghost" onClick={onLater}>
          Revisar más tarde
        </Button>
      </div>
    </section>
  );
}
