/**
 * @file textarea.tsx
 * @description Textarea premium con diseño orgánico - 100% responsive
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  AlertCircle, 
  Check, 
  Loader2,
  Info
} from "lucide-react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  autoResize?: boolean;
  success?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "filled" | "minimal";
  textareaSize?: "sm" | "md" | "lg";
  tooltip?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      showCharCount = false,
      maxLength,
      autoResize = true,
      disabled,
      success,
      loading,
      icon,
      variant = "default",
      textareaSize = "md",
      tooltip,
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);
    
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const warningLevel = maxLength 
      ? (charCount / maxLength) * 100 
      : 0;
    
    const isNearLimit = warningLevel >= 80;
    const isAtLimit = charCount === maxLength;
    
    const validationState = error ? "error" : 
                          success ? "success" : 
                          loading ? "loading" : null;

    const variantClasses = {
      default: cn(
        "bg-white border border-origen-pradera/30",
        "hover:border-origen-hoja",
        "focus:border-origen-pradera focus:ring-2 focus:ring-origen-pradera/20",
        error && "border-red-500 hover:border-red-600 focus:ring-red-500/20",
        success && !error && "border-green-500 hover:border-green-600 focus:ring-green-500/20"
      ),
      
      outline: cn(
        "bg-transparent border-2 border-origen-bosque/30",
        "hover:border-origen-bosque/50",
        "focus:border-origen-pradera focus:ring-2 focus:ring-origen-pradera/20",
        error && "border-red-500",
        success && !error && "border-green-500"
      ),
      
      filled: cn(
        "bg-origen-crema border border-transparent",
        "hover:bg-origen-pastel",
        "focus:bg-white focus:border-origen-pradera",
        error && "bg-red-50 border-red-500",
        success && !error && "bg-green-50 border-green-500"
      ),
      
      minimal: cn(
        "bg-transparent border-b-2 border-origen-pradera/30",
        "hover:border-origen-hoja",
        "focus:border-origen-pradera",
        "rounded-none px-0",
        error && "border-red-500",
        success && !error && "border-green-500"
      ),
    };

    const sizeClasses = {
      sm: "min-h-[60px] sm:min-h-[80px] px-3 py-2 text-xs sm:text-sm",
      md: "min-h-[80px] sm:min-h-[100px] px-4 py-3 text-sm sm:text-base",
      lg: "min-h-[100px] sm:min-h-[120px] px-5 py-4 text-base sm:text-lg",
    };

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea && autoResize) {
        textarea.style.height = "auto";
        const newHeight = Math.max(
          textarea.scrollHeight,
          textareaSize === "sm" ? 60 : textareaSize === "lg" ? 100 : 80
        );
        textarea.style.height = `${newHeight}px`;
      }
    }, [autoResize, textareaSize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCharCount) {
        setCharCount(e.target.value.length);
      }
      if (autoResize) {
        adjustHeight();
      }
      onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement) => {
        textareaRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement>).current = node;
        }
      },
      [ref]
    );

    React.useEffect(() => {
      if (autoResize) {
        setTimeout(adjustHeight, 0);
      }
    }, [adjustHeight, autoResize]);

    return (
      <div className="w-full space-y-2">
        {/* Label con tooltip */}
        {(label || tooltip) && (
          <div className="flex items-center gap-2">
            {label && (
              <label
                htmlFor={textareaId}
                className={cn(
                  "block text-xs sm:text-sm font-medium text-origen-bosque",
                  disabled && "opacity-50 cursor-not-allowed",
                  error && "text-red-600"
                )}
              >
                {label}
                {props.required && (
                  <span className="text-red-500 ml-1" aria-label="requerido">
                    *
                  </span>
                )}
              </label>
            )}
            
            {tooltip && (
              <div className="group relative">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-text-disabled cursor-help" />
                <div 
                  className={cn(
                    "absolute left-0 top-5 z-50 hidden group-hover:block",
                    "w-48 sm:w-64 p-2 rounded-lg bg-origen-oscuro text-white text-xs",
                    "shadow-lg animate-in fade-in-0 zoom-in-95"
                  )}
                >
                  {tooltip}
                  <div className="absolute -top-1 left-3 w-2 h-2 bg-origen-oscuro rotate-45" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          {icon && (
            <div className={cn(
              "absolute left-3 top-3 text-text-disabled",
              isFocused && "text-origen-pradera",
              error && "text-red-500",
              success && !error && "text-green-500"
            )}>
              {icon}
            </div>
          )}

          <textarea
            id={textareaId}
            ref={setRefs}
            disabled={disabled}
            maxLength={maxLength}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, helperText && helperId)}
            aria-busy={loading}
            className={cn(
              "flex w-full rounded-xl",
              "text-origen-oscuro placeholder:text-text-disabled",
              "transition-all duration-200",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
              "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
              
              variantClasses[variant],
              sizeClasses[textareaSize],
              
              icon && "pl-9 sm:pl-10",
              
              className
            )}
            {...props}
          />

          {/* Indicadores de estado */}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-origen-pradera" />
            )}
            {success && !error && !loading && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {error && !loading && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Mensajes de ayuda/error — solo se renderiza si hay contenido */}
        {(error || helperText || (showCharCount && maxLength)) && (
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {error && (
                <p
                  id={errorId}
                  className="text-xs text-red-600 flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{error}</span>
                </p>
              )}

              {helperText && !error && (
                <p
                  id={helperId}
                  className="text-xs text-text-subtle"
                >
                  {helperText}
                </p>
              )}

              {showCharCount && maxLength && isNearLimit && !isAtLimit && !error && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  <span>Cerca del límite ({Math.round(warningLevel)}%)</span>
                </p>
              )}
            </div>

            {/* Contador de caracteres */}
            {showCharCount && maxLength && (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  isAtLimit ? "text-red-600" :
                  isNearLimit ? "text-amber-600" : "text-text-subtle"
                )}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };