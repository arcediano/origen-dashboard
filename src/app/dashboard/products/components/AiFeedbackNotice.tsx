/**
 * @file AiFeedbackNotice.tsx
 * @description Aviso "Hay datos que debes corregir": lo que la validación de
 * IA (o un administrador al revertir) ha marcado como incorrecto en un
 * producto, con atajo al paso del formulario de cada campo. Al corregir y
 * reenviar, la IA lo revisa de nuevo en segundos.
 */

'use client';

import Link from 'next/link';
import { Edit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle, Button } from '@arcediano/ux-library';
import type { AiFeedback } from '@/lib/api/products';
import { FORM_STEPS, type FormStepId } from '@/types/product';

const FIELD_LABEL: Record<string, string> = {
  name: 'Nombre',
  fullDescription: 'Descripción',
  shortDescription: 'Descripción corta',
  category: 'Categoría',
  categoryId: 'Categoría',
  subcategoryId: 'Subcategoría',
  'productionInfo.story': 'Historia del producto',
  nutritionalInfo: 'Información nutricional',
  allergens: 'Alérgenos',
  ingredients: 'Ingredientes',
  images: 'Imágenes',
};

const FIELD_STEP: Record<string, FormStepId> = {
  name: 'basic',
  fullDescription: 'basic',
  shortDescription: 'basic',
  category: 'basic',
  categoryId: 'basic',
  subcategoryId: 'basic',
  images: 'images',
  nutritionalInfo: 'nutritional',
  allergens: 'nutritional',
  ingredients: 'nutritional',
  'productionInfo.story': 'production',
};

export function aiFieldLabel(field: string): string | null {
  return FIELD_LABEL[field] ?? null;
}

export function aiFieldStep(field: string): FormStepId | null {
  return FIELD_STEP[field] ?? (field.startsWith('productionInfo') ? 'production' : null);
}

export function AiFeedbackNotice({
  feedback,
  productId,
  onJumpToStep,
}: {
  feedback: AiFeedback;
  productId: string;
  /** En el formulario de edición: salta al paso. En el detalle, el atajo enlaza a la edición. */
  onJumpToStep?: (step: FormStepId) => void;
}) {
  const reverted = feedback.kind === 'REVERTED';
  return (
    <Alert variant={reverted ? 'error' : 'warning'} className="mb-4" data-testid="ai-feedback-notice">
      <AlertTitle>
        {reverted ? 'Un administrador ha revertido la publicación' : 'Hay datos que debes corregir'}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <ul className="list-disc space-y-1.5 pl-5">
          {feedback.problems.map((p, i) => {
            const label = aiFieldLabel(p.field);
            const step = aiFieldStep(p.field);
            const stepLabel = step ? FORM_STEPS.find((s) => s.id === step)?.label : undefined;
            return (
              <li key={i}>
                {label && <span className="font-semibold">{label}: </span>}
                {p.message}
                {stepLabel && onJumpToStep && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => onJumpToStep(step!)}
                      className="font-medium underline underline-offset-2"
                    >
                      Ir a «{stepLabel}»
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-xs">
          {feedback.attempt > 1
            ? `Es la revisión nº ${feedback.attempt} de este producto. `
            : ''}
          Cuando lo corrijas y lo vuelvas a enviar, lo revisaremos de nuevo en unos segundos
          y, si todo está bien, se publicará al momento.
        </p>
        {!onJumpToStep && (
          <Link href={`/dashboard/products/${productId}/edit`}>
            <Button variant="outline" size="sm" leftIcon={<Edit className="h-3.5 w-3.5" />}>
              Corregir ahora
            </Button>
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}
