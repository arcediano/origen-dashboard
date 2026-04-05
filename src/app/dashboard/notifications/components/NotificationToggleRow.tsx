/**
 * @component NotificationToggleRow
 * @description Fila de preferencia de notificación extraída de la página de Notificaciones.
 *              Padding compacto (py-3) y descripción text-xs para evitar overflow en móvil.
 *
 * Tokens Origen v3.0.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Toggle } from '@arcediano/ux-library';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface NotificationToggleRowProps {
  icon:        React.ElementType;
  title:       string;
  description?: string;
  checked:     boolean;
  onChange:    (checked: boolean) => void;
  /** Si true, añade separador inferior */
  divider?:    boolean;
  className?:  string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function NotificationToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  divider = true,
  className,
}: NotificationToggleRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3',
        divider && 'border-b border-border-subtle last:border-0',
        className,
      )}
    >
      {/* Icono + texto */}
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
        <div className="w-8 h-8 rounded-lg bg-origen-pastel flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-origen-pino" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-origen-bosque">{title}</p>
          {description && (
            <p className="text-xs text-text-subtle mt-0.5 leading-snug">{description}</p>
          )}
        </div>
      </div>

      {/* Toggle */}
      <Toggle
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}
