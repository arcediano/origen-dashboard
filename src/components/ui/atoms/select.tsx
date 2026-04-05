/**
 * @file select.tsx
 * @description Select premium con portal real — el dropdown nunca queda
 * cortado por `overflow:hidden` ni por stacking contexts del contenedor.
 *
 * Mejora sobre la versión anterior:
 *   - `SelectContent` renderiza vía `createPortal` al `document.body`
 *   - Usa `position: fixed` calculando coordenadas desde el `SelectTrigger`
 *   - Se reposiciona automáticamente en scroll y resize
 *   - El resto de la API (SelectTrigger, SelectValue, SelectItem, SelectGroup)
 *     no cambia — compatibilidad total con el código existente
 */

'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Search, X, AlertCircle } from 'lucide-react';

// ─── Contexto ─────────────────────────────────────────────────────────────────

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  placeholder: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  /** Ref al botón trigger — usado por SelectContent para calcular posición */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const useSelect = () => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('useSelect debe usarse dentro de un componente Select');
  return ctx;
};

// ─── Select (raíz) ────────────────────────────────────────────────────────────

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  error?: string;
  children: React.ReactNode;
  /** Lista de items para el select nativo oculto (accesibilidad / formularios) */
  items?: Array<{ value: string; label: string }>;
  className?: string;
}

const Select = ({
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Selecciona una opción',
  searchable = false,
  disabled = false,
  required = false,
  name,
  error,
  children,
  items,
  className,
}: SelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        placeholder,
        searchTerm,
        setSearchTerm,
        searchable,
        disabled,
        error,
        triggerRef,
      }}
    >
      {/* Select nativo oculto — mantiene compatibilidad con formularios y SSR */}
      <div className={cn('relative w-full', className)}>
        <select
          name={name}
          value={currentValue}
          onChange={(e) => handleValueChange(e.target.value)}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          disabled={disabled}
          required={required}
        >
          <option value="">{placeholder}</option>
          {items?.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {children}

        {error && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    </SelectContext.Provider>
  );
};

Select.displayName = 'Select';

// ─── SelectTrigger ────────────────────────────────────────────────────────────

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, forwardedRef) => {
    const { open, setOpen, disabled: ctxDisabled, error, triggerRef } = useSelect();
    const disabled = props.disabled || ctxDisabled;

    // Combinar el ref externo y el interno del contexto
    const setRefs = React.useCallback(
      (el: HTMLButtonElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
        if (typeof forwardedRef === 'function') forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
      },
      [forwardedRef, triggerRef],
    );

    return (
      <button
        ref={setRefs}
        type="button"
        data-select-trigger
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between gap-2',
          'rounded-xl border bg-white px-3 py-2 sm:px-4 sm:py-3 text-left',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-origen-pradera/50 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
          error
            ? 'border-red-500 hover:border-red-600'
            : cn(
                'border-origen-pradera/30',
                'hover:border-origen-hoja',
                open && 'border-origen-pradera ring-2 ring-origen-pradera/20',
              ),
          className,
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={!!error}
        disabled={disabled}
        {...props}
      >
        {children ?? (
          <>
            <span className="flex-1 truncate text-sm sm:text-base">Seleccionar</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-text-subtle transition-transform shrink-0',
                open && 'rotate-180',
              )}
            />
          </>
        )}
      </button>
    );
  },
);

SelectTrigger.displayName = 'SelectTrigger';

// ─── SelectValue ──────────────────────────────────────────────────────────────

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

const SelectValue = ({ placeholder: customPlaceholder, className, children }: SelectValueProps) => {
  const { value, placeholder } = useSelect();
  const display = customPlaceholder ?? placeholder;

  if (children) {
    return (
      <span className={cn('flex-1 truncate text-sm sm:text-base', className)}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn('flex-1 truncate text-sm sm:text-base', !value && 'text-text-disabled', className)}
    >
      {value || display}
    </span>
  );
};

SelectValue.displayName = 'SelectValue';

// ─── SelectContent ────────────────────────────────────────────────────────────
// Renderiza en portal para evitar clipping por overflow:hidden del contenedor.

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, searchTerm, setSearchTerm, searchable, triggerRef } = useSelect();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = React.useState(false);
    const [style, setStyle] = React.useState<React.CSSProperties>({});

    React.useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    // Calcular posición fixed basándose en el trigger
    const updatePosition = React.useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }, [triggerRef]);

    React.useEffect(() => {
      if (!open) return;
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }, [open, updatePosition]);

    // Cerrar al hacer clic fuera
    React.useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        const outsideContent = contentRef.current && !contentRef.current.contains(target);
        const outsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
        if (outsideContent && outsideTrigger) {
          setOpen(false);
          setSearchTerm('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, setOpen, setSearchTerm, triggerRef]);

    if (!open || !mounted) return null;

    return createPortal(
      <div
        ref={contentRef}
        style={style}
        className={cn(
          'rounded-xl border border-border bg-white',
          'shadow-lg animate-in fade-in-0 zoom-in-95',
          'max-h-60 sm:max-h-80 overflow-hidden flex flex-col',
          className,
        )}
        {...props}
      >
        {/* Campo de búsqueda */}
        {searchable && (
          <div className="p-2 sm:p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-text-disabled" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg border border-border bg-surface py-1.5 sm:py-2 pl-8 sm:pl-10 pr-3 text-xs sm:text-sm outline-none focus:border-origen-pradera focus:ring-1 focus:ring-origen-pradera/50"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-muted-foreground"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista de opciones */}
        <div ref={ref} className="flex-1 overflow-auto p-1" role="listbox">
          {children}
        </div>
      </div>,
      document.body,
    );
  },
);

SelectContent.displayName = 'SelectContent';

// ─── SelectItem ───────────────────────────────────────────────────────────────

export interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ value, className, children, disabled, ...props }, ref) => {
    const { value: selectedValue, onValueChange, searchTerm } = useSelect();
    const isSelected = selectedValue === value;

    // Filtrar por término de búsqueda
    if (searchTerm && typeof children === 'string') {
      if (!children.toLowerCase().includes(searchTerm.toLowerCase())) return null;
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center',
          'rounded-lg py-1.5 sm:py-2 pl-2 sm:pl-3 pr-8 sm:pr-9 text-xs sm:text-sm outline-none',
          'transition-all duration-150',
          'hover:bg-origen-crema hover:text-origen-bosque',
          'focus:bg-origen-crema focus:text-origen-bosque focus:outline-none focus:ring-2 focus:ring-origen-pradera/50',
          disabled && 'pointer-events-none opacity-50',
          isSelected && 'bg-origen-crema/80 font-medium text-origen-bosque',
          className,
        )}
        onClick={() => !disabled && onValueChange(value)}
        disabled={disabled}
        role="option"
        aria-selected={isSelected}
        {...props}
      >
        <span className="truncate">{children}</span>
        {isSelected && (
          <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-origen-pradera animate-in zoom-in-50" />
          </span>
        )}
      </button>
    );
  },
);

SelectItem.displayName = 'SelectItem';

// ─── SelectGroup ──────────────────────────────────────────────────────────────

export interface SelectGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  children: React.ReactNode;
}

const SelectGroup = ({ label, children, className, ...props }: SelectGroupProps) => (
  <div role="group" aria-label={label} className={className} {...props}>
    {label && (
      <div className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-text-subtle uppercase tracking-wide bg-surface/50">
        {label}
      </div>
    )}
    {children}
  </div>
);

SelectGroup.displayName = 'SelectGroup';

// ─── Exports ──────────────────────────────────────────────────────────────────

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup };
