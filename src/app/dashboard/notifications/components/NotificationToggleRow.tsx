/**
 * @component NotificationToggleRow
 * @description Fila de preferencia de notificación con layout mobile-first.
 *              Texto en su propio bloque (puede wrappear libremente).
 *              Canales (email / push) en fila separada debajo del texto.
 *              Diseño apilado evita que el texto se parta por tener el toggle en la misma línea.
 *
 * Tokens Origen v3.0.
 */

'use client';

import React from 'react';
import { Mail, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toggle } from '@arcediano/ux-library';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface NotificationChannel {
  checked:  boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export interface NotificationToggleRowProps {
  icon:        React.ElementType;
  title:       string;
  description?: string;
  /** Canal email — si se omite, no se renderiza */
  email?:      NotificationChannel;
  /** Canal push — si se omite, no se renderiza */
  push?:       NotificationChannel;
  /** Si true, muestra "Siempre activo" en lugar de los toggles */
  alwaysActive?: boolean;
  /** Si true, añade separador inferior */
  divider?:    boolean;
  className?:  string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function NotificationToggleRow({
  icon: Icon,
  title,
  description,
  email,
  push,
  alwaysActive = false,
  divider = true,
  className,
}: NotificationToggleRowProps) {
  return (
    <div
      className={cn(
        'py-4',
        divider && 'border-b border-border-subtle last:border-0',
        className,
      )}
    >
      {/* ── Icono + texto (fila 1 — texto libre para wrappear) ── */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-origen-pastel flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-origen-pino" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-origen-bosque leading-snug">{title}</p>
          {description && (
            <p className="text-xs text-text-subtle mt-0.5 leading-snug">{description}</p>
          )}
        </div>
      </div>

      {/* ── Canales (fila 2 — debajo del texto, nunca en la misma línea) ── */}
      {alwaysActive ? (
        <div className="mt-3 pl-11">
          <span className="inline-flex items-center rounded-full bg-origen-pastel px-2.5 py-0.5 text-xs font-medium text-origen-pino">
            Siempre activo
          </span>
        </div>
      ) : (email ?? push) && (
        <div className="mt-3 pl-11 flex items-center gap-5">
          {email && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Mail className="w-3.5 h-3.5 text-text-subtle flex-shrink-0" aria-hidden="true" />
              <span className="text-xs text-text-subtle whitespace-nowrap">Email</span>
              <Toggle
                checked={email.checked}
                onCheckedChange={email.onChange}
                disabled={email.disabled}
                aria-label={`Activar email para ${title}`}
              />
            </label>
          )}
          {push && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Bell className="w-3.5 h-3.5 text-text-subtle flex-shrink-0" aria-hidden="true" />
              <span className="text-xs text-text-subtle whitespace-nowrap">Push</span>
              <Toggle
                checked={push.checked}
                onCheckedChange={push.onChange}
                disabled={push.disabled}
                aria-label={`Activar push para ${title}`}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

