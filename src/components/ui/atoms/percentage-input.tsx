/**
 * @file percentage-input.tsx
 * @description Input de porcentaje premium - 100% responsive
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Percent, Info } from "lucide-react";

export interface PercentageInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  error?: string;
  helperText?: string;
  tooltip?: string;
  min?: number;
  max?: number;
  required?: boolean;
  showProgress?: boolean;
}

const PercentageInput = React.forwardRef<HTMLInputElement, PercentageInputProps>(
  ({ 
    className, 
    value, 
    onChange, 
    label, 
    error, 
    helperText, 
    tooltip,
    min = 0,
    max = 100,
    disabled,
    required,
    showProgress = true,
    id,
    placeholder = "0",
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(
      value ? value.toString() : ''
    );
    const [isFocused, setIsFocused] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^\d.-]/g, '');
      
      if (rawValue === '') {
        setDisplayValue('');
        onChange(0);
        return;
      }

      const numericValue = parseFloat(rawValue);
      
      if (isNaN(numericValue)) {
        setDisplayValue('');
        onChange(0);
        return;
      }

      let clampedValue = numericValue;
      if (min !== undefined) clampedValue = Math.max(min, clampedValue);
      if (max !== undefined) clampedValue = Math.min(max, clampedValue);
      
      setDisplayValue(clampedValue.toString());
      onChange(clampedValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (displayValue === '') {
        setDisplayValue('0');
        onChange(0);
      }
      props.onBlur?.(e);
    };

    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className="w-full space-y-1.5 sm:space-y-2">
        {/* Label con tooltip */}
        {(label || tooltip) && (
          <div className="flex items-center gap-2">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  "text-xs sm:text-sm font-medium text-origen-bosque",
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
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "flex h-9 sm:h-10 w-full rounded-xl border bg-white px-3 py-2 pr-8 sm:pr-9",
              "text-sm sm:text-base placeholder:text-text-disabled",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
              
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
          
          <Percent className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "h-3.5 w-3.5 sm:h-4 sm:w-4",
            isFocused ? "text-origen-pradera" : "text-text-disabled",
            error && "text-red-500"
          )} />
        </div>

        {/* Barra de progreso visual */}
        {showProgress && !error && value > 0 && (
          <div className="relative h-1 w-full bg-surface-alt rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute left-0 top-0 h-full transition-all duration-300",
                value >= 90 ? "bg-amber-500" : "bg-origen-pradera"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}

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

PercentageInput.displayName = "PercentageInput";

export { PercentageInput };