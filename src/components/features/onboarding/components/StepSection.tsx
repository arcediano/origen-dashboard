'use client';

import * as React from 'react';
import { Card, CardIconHeader } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';

interface StepSectionProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  /** Contenido a la derecha del título (p. ej. una insignia "Opcional"). */
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Tarjeta de sección de un paso del onboarding: `Card variant="section"` +
 * `CardIconHeader` de la librería (patrón canónico de las "Section Cards").
 * Sustituye al markup de tarjeta + cabecera con icono que cada paso repetía.
 */
export function StepSection({ icon, title, description, badge, children, className, id }: StepSectionProps) {
  return (
    <Card variant="section" padding="md" className={cn('rounded-2xl', className)} id={id}>
      <CardIconHeader icon={icon} title={title} description={description}>
        {badge}
      </CardIconHeader>
      {children}
    </Card>
  );
}

export default StepSection;
