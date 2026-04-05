/**
 * @file currency-input.tsx
 * @description Input de moneda premium con soporte para importes grandes
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Euro, Info } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  /** Valor numérico */
  value: number;
  /** Función de cambio */
  onChange: (value: number) => void;
  /** Texto de la etiqueta */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Texto de ayuda */
  helperText?: string;
  /** Texto de tooltip */
  tooltip?: string;
  /** Valor mínimo */
  min?: number;
  /** Valor máximo */
  max?: number;
  /** Número máximo de dígitos enteros (por defecto 15) */
  maxIntegerDigits?: number;
  /** Mostrar separadores de miles */
  showThousandSeparator?: boolean;
  /** Campo requerido */
  required?: boolean;
  /** Tamaño del input (para consistencia con Input component) */
  inputSize?: "sm" | "md" | "lg";
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    className, 
    value, 
    onChange, 
    label, 
    error, 
    helperText, 
    tooltip,
    min = 0,
    max,
    maxIntegerDigits = 15,
    showThousandSeparator = false,
    inputSize = "md",
    disabled,
    required,
    id,
    placeholder = "0,00",
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    // ============================================================================
    // FUNCIONES DE FORMATEO
    // ============================================================================

    /**
     * Formatea un número para mostrarlo con 2 decimales
     * @param num - Número a formatear
     * @returns String formateado (ej: "1234,56")
     */
    const formatNumber = (num: number): string => {
      if (isNaN(num)) return '0,00';
      
      // Asegurar 2 decimales
      const fixed = num.toFixed(2);
      
      if (showThousandSeparator) {
        // Separar parte entera y decimal
        const [integerPart, decimalPart] = fixed.split('.');
        
        // Añadir separadores de miles
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        
        return `${formattedInteger},${decimalPart}`;
      }
      
      // Sin separadores de miles
      return fixed.replace('.', ',');
    };

    /**
     * Parsea un string a número
     * @param str - String a parsear (ej: "1234,56" o "1.234,56")
     * @returns Número parseado
     */
    const parseNumber = (str: string): number => {
      if (!str) return 0;
      
      // Eliminar todos los puntos (separadores de miles)
      const withoutThousands = str.replace(/\./g, '');
      
      // Reemplazar coma por punto para parseFloat
      const normalized = withoutThousands.replace(',', '.');
      
      return parseFloat(normalized) || 0;
    };

    // ============================================================================
    // FUNCIONES DE ESTILO
    // ============================================================================

    /**
     * Clases de tamaño
     */
    const sizeClasses = {
      sm: "h-9 text-xs",
      md: "h-11 text-sm",
      lg: "h-12 text-base",
    };

    /**
     * Padding izquierdo basado en el icono
     */
    const getPaddingLeft = () => "pl-10";

    /**
     * Posición del icono
     */
    const getIconPosition = () => {
      switch (inputSize) {
        case "sm": return "left-2";
        case "md": return "left-3";
        case "lg": return "left-4";
        default: return "left-3";
      }
    };

    /**
     * Posición del indicador EUR
     */
    const getEurPosition = () => {
      switch (inputSize) {
        case "sm": return "right-2";
        case "md": return "right-3";
        case "lg": return "right-4";
        default: return "right-3";
      }
    };

    // ============================================================================
    // EFECTOS
    // ============================================================================

    /**
     * Actualiza el valor mostrado cuando cambia el valor prop
     */
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatNumber(value));
      }
    }, [value, isFocused, showThousandSeparator]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    /**
     * Maneja cambios en el input mientras el usuario escribe
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      
      // Permitir: dígitos, coma, punto (para teclado numérico)
      const cleaned = rawValue.replace(/[^\d,.]/g, '');
      
      // Prevenir múltiples comas/puntos
      const parts = cleaned.split(/[,.]/);
      if (parts.length > 2) {
        // Si hay más de un separador, mantener solo el primero
        const firstPart = parts[0];
        const rest = parts.slice(1).join('');
        setDisplayValue(`${firstPart},${rest}`);
        return;
      }
      
      setDisplayValue(cleaned);
      
      // Intentar parsear el valor actual
      const numericValue = parseNumber(cleaned);
      
      // Validar límite de dígitos enteros
      const integerPart = cleaned.split(/[,.]/)[0].replace(/\D/g, '');
      if (integerPart.length > maxIntegerDigits) {
        return; // No actualizar si excede el límite
      }
      
      // Aplicar límites min/max
      let clampedValue = numericValue;
      if (min !== undefined) clampedValue = Math.max(min, clampedValue);
      if (max !== undefined) clampedValue = Math.min(max, clampedValue);
      
      onChange(clampedValue);
    };

    /**
     * Maneja cuando el input pierde el foco
     * Formatea el valor a 2 decimales
     */
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      // Formatear a 2 decimales
      const numericValue = parseNumber(displayValue);
      
      // Aplicar límites
      let finalValue = numericValue;
      if (min !== undefined) finalValue = Math.max(min, finalValue);
      if (max !== undefined) finalValue = Math.min(max, finalValue);
      
      setDisplayValue(formatNumber(finalValue));
      onChange(finalValue);
      
      props.onBlur?.(e);
    };

    /**
     * Maneja cuando el input gana el foco
     * Muestra el valor sin formato para edición
     */
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      
      // Al enfocar, mostrar el valor sin formato para edición fácil
      if (value !== undefined && !isNaN(value)) {
        // Mostrar con punto decimal para edición
        setDisplayValue(value.toString().replace('.', ','));
      }
      
      props.onFocus?.(e);
    };

    /**
     * Maneja teclas especiales
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevenir múltiples comas
      if (e.key === ',' || e.key === '.') {
        if (displayValue.includes(',') || displayValue.includes('.')) {
          e.preventDefault();
        }
      }
      
      // Prevenir caracteres no numéricos
      if (!/[\d,.\b\-\+]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
        e.preventDefault();
      }
      
      props.onKeyDown?.(e);
    };

    return (
      <div className="w-full space-y-1.5 sm:space-y-2">
        {/* Label con tooltip */}
        {(label || tooltip) && (
          <div className="flex items-center gap-2">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  "block text-xs sm:text-sm font-medium text-origen-bosque",
                  disabled && "opacity-50 cursor-not-allowed",
                  error && "text-red-600"
                )}
              >
                {label}
                {required && (
                  <span className="text-red-500 ml-1" aria-label="requerido">
                    *
                  </span>
                )}
              </label>
            )}
            
            {tooltip && (
              <div className="group relative">
                <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-text-disabled cursor-help" />
                <div 
                  className={cn(
                    "absolute left-0 top-4 sm:top-5 z-50 hidden group-hover:block",
                    "w-40 sm:w-48 p-2 rounded-lg bg-origen-oscuro text-white text-[10px] sm:text-xs",
                    "shadow-lg animate-in fade-in-0 zoom-in-95"
                  )}
                >
                  {tooltip}
                  <div className="absolute -top-1 left-2 w-1.5 h-1.5 bg-origen-oscuro rotate-45" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          {/* Icono Euro */}
          <Euro className={cn(
            "absolute top-1/2 -translate-y-1/2",
            getIconPosition(),
            "w-4 h-4",
            isFocused ? "text-origen-pradera" : "text-text-disabled",
            error && "text-red-500"
          )} />
          
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "flex w-full rounded-xl border bg-white",
              "text-origen-oscuro placeholder:text-text-disabled",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50 focus:border-origen-pradera",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
              
              sizeClasses[inputSize],
              getPaddingLeft(),
              
              error
                ? "border-red-500 hover:border-red-600 focus:ring-red-500/50"
                : cn(
                    "border-origen-pradera/30",
                    "hover:border-origen-hoja",
                    isFocused && "border-origen-pradera"
                  ),
              
              className
            )}
            {...props}
          />
          
          {/* Indicador de moneda */}
          <span className={cn(
            "absolute top-1/2 -translate-y-1/2 text-xs text-text-disabled",
            getEurPosition()
          )}>
            EUR
          </span>
        </div>

        {/* Mensajes de ayuda/error */}
        {error && (
          <p 
            id={errorId}
            className="text-[10px] sm:text-xs text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-[10px] sm:text-xs text-text-subtle">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };