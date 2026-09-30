'use client';

import * as React from 'react';
import { AlertCircle, FileText, X } from 'lucide-react';
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@arcediano/ux-library';
import { cn } from '@/lib/utils';

/** Insignia "Opcional" / "Recomendado" junto al título de una sección o campo. */
export function OptionalBadge({ children = 'Opcional' }: { children?: string }) {
  return (
    <Badge variant="neutral" size="xs">
      {children}
    </Badge>
  );
}

/** Mensaje de error de campo (accesible: se enlaza con `aria-describedby` desde el control). */
export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-xs text-feedback-danger-text">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

/**
 * Selector con etiqueta, ayuda y error, construido sobre `Select` de la
 * librería (composición con `SelectTrigger` para poder asignar `id` y
 * enfocarlo desde el resumen de pendientes del paso).
 */
export function SelectField({
  id,
  label,
  required,
  value,
  onValueChange,
  options,
  placeholder = 'Selecciona una opción',
  disabled,
  error,
  helperText,
  className,
}: SelectFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-origen-bosque">
        {label}
        {required && <span className="ml-0.5 text-feedback-danger" aria-hidden="true">*</span>}
      </label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled} placeholder={placeholder} error={error}>
        <SelectTrigger id={id} aria-required={required}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* El mensaje de error lo pinta `Select` de la librería (prop `error`). */}
      {!error && helperText && <p className="text-xs text-text-subtle">{helperText}</p>}
    </div>
  );
}

interface FileRowProps {
  name: string;
  meta?: string;
  onRemove?: () => void;
  removeLabel: string;
  leading?: React.ReactNode;
}

/** Fila de "archivo ya subido" con botón de quitar (objetivo táctil ≥ 44 px). */
export function FileRow({ name, meta, onRemove, removeLabel, leading }: FileRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-origen-pradera/30 bg-origen-crema/20 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-origen-pradera/10 text-hoja-tinta">
        {leading ?? <FileText className="h-5 w-5" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-origen-bosque">{name}</p>
        {meta && <p className="text-xs text-text-subtle">{meta}</p>}
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={removeLabel}
          className="h-11 w-11 shrink-0 text-text-subtle hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
