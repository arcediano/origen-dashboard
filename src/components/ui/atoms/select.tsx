/**
 * @file select.tsx
 * @description Select premium con diseño orgánico - 100% responsive
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search, X, AlertCircle } from "lucide-react";

// ============================================================================
// CONTEXTO DEL SELECT
// ============================================================================

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
  error?: string; // Cambiado de boolean a string
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("useSelect debe usarse dentro de un componente Select");
  }
  return context;
};

// ============================================================================
// COMPONENTE SELECT PRINCIPAL
// ============================================================================

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  error?: string; // Cambiado de boolean a string
  children: React.ReactNode;
  items?: Array<{ value: string; label: string }>; // Añadido para compatibilidad
  className?: string;
}

const Select = ({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Selecciona una opción",
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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
    setSearchTerm("");
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
      }}
    >
      <div className={cn("relative w-full", className)}>
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
        
        {/* Mensaje de error */}
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

Select.displayName = "Select";

// ============================================================================
// SELECT TRIGGER
// ============================================================================

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, disabled: contextDisabled, error } = useSelect();
    const disabled = props.disabled || contextDisabled;

    return (
      <button
        ref={ref}
        type="button"
        data-select-trigger
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-2",
          "rounded-xl border bg-white px-3 py-2 sm:px-4 sm:py-3 text-left",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50 focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          
          error
            ? "border-red-500 hover:border-red-600"
            : cn(
                "border-origen-pradera/30",
                "hover:border-origen-hoja",
                open && "border-origen-pradera ring-2 ring-origen-pradera/20"
              ),
          
          className
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={!!error}
        disabled={disabled}
        {...props}
      >
        {children || (
          <>
            <span className="flex-1 truncate text-sm sm:text-base">
              Seleccionar
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 text-gray-500 transition-transform shrink-0",
              open && "rotate-180"
            )} />
          </>
        )}
      </button>
    );
  }
);

SelectTrigger.displayName = "SelectTrigger";

// ============================================================================
// SELECT VALUE
// ============================================================================

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

const SelectValue = ({ placeholder: customPlaceholder, className, children }: SelectValueProps) => {
  const { value, placeholder } = useSelect();
  const displayPlaceholder = customPlaceholder || placeholder;

  if (children) {
    return <span className={cn("flex-1 truncate text-sm sm:text-base", className)}>{children}</span>;
  }

  return (
    <span className={cn(
      "flex-1 truncate text-sm sm:text-base",
      !value && "text-gray-400",
      className
    )}>
      {value || displayPlaceholder}
    </span>
  );
};

SelectValue.displayName = "SelectValue";

// ============================================================================
// SELECT CONTENT
// ============================================================================

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  position?: "popper" | "item-aligned";
  children: React.ReactNode;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, position = "popper", children, ...props }, ref) => {
    const { open, setOpen, searchTerm, setSearchTerm, searchable } = useSelect();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
          setSearchTerm("");
        }
      };

      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, setOpen, setSearchTerm]);

    if (!open) return null;

    return (
      <div
        ref={contentRef}
        className={cn(
          "absolute z-50 w-full mt-1 sm:mt-2",
          "rounded-xl border border-gray-200 bg-white",
          "shadow-lg animate-in fade-in-0 zoom-in-95",
          "max-h-60 sm:max-h-80 overflow-hidden flex flex-col",
          className
        )}
        {...props}
      >
        {searchable && (
          <div className="p-2 sm:p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 sm:py-2 pl-8 sm:pl-10 pr-3 text-xs sm:text-sm outline-none focus:border-origen-pradera focus:ring-1 focus:ring-origen-pradera/50"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div 
          ref={ref}
          className="flex-1 overflow-auto p-1"
          role="listbox"
        >
          {children}
        </div>
      </div>
    );
  }
);

SelectContent.displayName = "SelectContent";

// ============================================================================
// SELECT ITEM
// ============================================================================

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
    
    // Filtrar por término de búsqueda si existe
    if (searchTerm && typeof children === 'string') {
      if (!children.toLowerCase().includes(searchTerm.toLowerCase())) {
        return null;
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 sm:py-2 pl-2 sm:pl-3 pr-8 sm:pr-9 text-xs sm:text-sm outline-none",
          "transition-all duration-150",
          "hover:bg-origen-crema hover:text-origen-bosque",
          "focus:bg-origen-crema focus:text-origen-bosque focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
          disabled && "pointer-events-none opacity-50",
          isSelected && "bg-origen-crema/80 font-medium text-origen-bosque",
          className
        )}
        onClick={() => !disabled && onValueChange(value)}
        disabled={disabled}
        role="option"
        aria-selected={isSelected}
        {...props}
      >
        <span className="truncate">{children}</span>
        
        {isSelected && (
          <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-origen-pradera animate-in zoom-in-50" />
          </span>
        )}
      </button>
    );
  }
);

SelectItem.displayName = "SelectItem";

// ============================================================================
// SELECT GROUP
// ============================================================================

export interface SelectGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  children: React.ReactNode;
}

const SelectGroup = ({ label, children, className, ...props }: SelectGroupProps) => {
  return (
    <div role="group" aria-label={label} className={className} {...props}>
      {label && (
        <div className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50/50">
          {label}
        </div>
      )}
      {children}
    </div>
  );
};

SelectGroup.displayName = "SelectGroup";

// ============================================================================
// EXPORT
// ============================================================================

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
};