'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';

type FilterSelectProps = {
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  id?: string;
  name?: string;
  'aria-label'?: string;
};

const DEFAULT_TRIGGER_CLASS = 'h-9 py-0 px-3 text-sm bg-surface-alt border-border w-auto rounded-lg border';

type SelectOptionNode = {
  key: React.Key;
  value: string;
  disabled: boolean;
  label: React.ReactNode;
};

function toOptionNode(child: React.ReactNode): SelectOptionNode | null {
  if (!React.isValidElement(child) || child.type !== 'option') {
    return null;
  }

  const value = child.props.value == null ? '' : String(child.props.value);

  return {
    key: child.key ?? value,
    value,
    disabled: Boolean(child.props.disabled),
    label: child.props.children,
  };
}

/**
 * Componente FilterSelect: reutilizable select compatible con Select de @arcediano/ux-library.
 * Mantiene la API nativa de `<select>` (onChange con HTMLSelectElement) pero renderiza
 * internamente el Select de la UX Library para consistencia visual.
 * 
 * Uso:
 * ```tsx
 * <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
 *   <option value="">Todos</option>
 *   <option value="active">Activo</option>
 * </FilterSelect>
 * ```
 */
export function FilterSelect({
  value,
  onChange,
  disabled,
  className,
  children,
  id,
  name,
  'aria-label': ariaLabel,
}: FilterSelectProps) {
  const optionNodes = React.Children.toArray(children)
    .map((child) => toOptionNode(child))
    .filter((option): option is SelectOptionNode => option !== null);

  const normalizedValue = value == null ? '' : String(value);

  return (
    <Select
      value={normalizedValue}
      onValueChange={(nextValue) => {
        const syntheticEvent = {
          target: { value: nextValue },
          currentTarget: { value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>;

        onChange?.(syntheticEvent);
      }}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn(DEFAULT_TRIGGER_CLASS, className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {optionNodes.map((option) => (
          <SelectItem key={option.key} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
