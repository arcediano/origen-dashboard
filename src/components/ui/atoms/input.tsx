/**
 * @file input.tsx
 * @description Input premium con diseño orgánico
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff, 
  Loader2,
  Info 
} from "lucide-react";
import { Button } from "./button";

// ============================================================================
// TIPOS
// ============================================================================

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Texto de la etiqueta */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Texto de ayuda */
  helperText?: string;
  /** Icono a la izquierda */
  leftIcon?: React.ReactNode;
  /** Icono a la derecha */
  rightIcon?: React.ReactNode;
  /** Mostrar contador de caracteres */
  showCharCount?: boolean;
  /** Longitud máxima */
  maxLength?: number;
  /** Estado de éxito */
  success?: boolean;
  /** Estado de carga */
  loading?: boolean;
  /** Variante de estilo */
  variant?: "default" | "outline" | "filled" | "minimal";
  /** Tamaño del input */
  inputSize?: "sm" | "md" | "lg";
  /** Texto de tooltip informativo */
  tooltip?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      showCharCount,
      maxLength,
      success,
      loading,
      tooltip,
      variant = "default",
      inputSize = "md",
      disabled,
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [charCount, setCharCount] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);
    
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    
    const validationState = error ? "error" : 
                          success ? "success" : 
                          loading ? "loading" : null;
    
    // ============================================================================
    // HANDLERS
    // ============================================================================
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showCharCount) {
        setCharCount(e.target.value.length);
      }
      onChange?.(e);
    };
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    // ============================================================================
    // CLASES DE ESTILO
    // ============================================================================

    const variantClasses = {
      default: cn(
        "bg-white border border-origen-pradera/30",
        "hover:border-origen-hoja",
        "focus:border-origen-pradera",
        error && "border-red-500 hover:border-red-600",
        success && !error && "border-green-500 hover:border-green-600"
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
        "rounded-none",
        error && "border-red-500",
        success && !error && "border-green-500"
      ),
    };

    const sizeClasses = {
      sm: "h-9 text-xs",
      md: "h-11 text-sm",
      lg: "h-12 text-base",
    };

    /**
     * Padding izquierdo - NUNCA combinar px-* con pl-*
     */
    const getPaddingLeft = () => {
      if (leftIcon) {
        switch (inputSize) {
          case "sm": return "pl-8";
          case "md": return "pl-10";
          case "lg": return "pl-12";
          default: return "pl-10";
        }
      }
      return "";
    };

    /**
     * Padding derecho - NUNCA combinar px-* con pr-*
     */
    const getPaddingRight = () => {
      const hasRightElements = rightIcon || isPassword || validationState;
      if (hasRightElements) {
        switch (inputSize) {
          case "sm": return "pr-8";
          case "md": return "pr-10";
          case "lg": return "pr-12";
          default: return "pr-10";
        }
      }
      return "";
    };

    /**
     * Padding horizontal:
     * - Si hay icono izquierdo Y elementos derecha → ambos lados gestionados aparte
     * - Si solo hay icono izquierdo → añadir padding derecho
     * - Si solo hay elementos derecha → añadir padding IZQUIERDO (bug fix: antes se omitía)
     * - Sin iconos → padding simétrico
     */
    const getHorizontalPadding = () => {
      const hasRightElements = rightIcon || isPassword || validationState;

      if (leftIcon && hasRightElements) return "";

      if (leftIcon) {
        switch (inputSize) {
          case "sm": return "pr-3";
          case "md": return "pr-4";
          case "lg": return "pr-5";
          default: return "pr-4";
        }
      }

      if (hasRightElements) {
        switch (inputSize) {
          case "sm": return "pl-3";
          case "md": return "pl-4";
          case "lg": return "pl-5";
          default: return "pl-4";
        }
      }

      switch (inputSize) {
        case "sm": return "px-3";
        case "md": return "px-4";
        case "lg": return "px-5";
        default: return "px-4";
      }
    };

    /**
     * Posición del icono izquierdo
     */
    const getIconLeftPosition = () => {
      switch (inputSize) {
        case "sm": return "left-2";
        case "md": return "left-3";
        case "lg": return "left-4";
        default: return "left-3";
      }
    };

    /**
     * Posición de elementos derechos
     */
    const getRightElementsPosition = () => {
      switch (inputSize) {
        case "sm": return "right-2";
        case "md": return "right-3";
        case "lg": return "right-4";
        default: return "right-3";
      }
    };

    /**
     * Tamaño del icono
     */
    const getIconSize = () => {
      switch (inputSize) {
        case "sm": return "w-3.5 h-3.5";
        case "md": return "w-4 h-4";
        case "lg": return "w-5 h-5";
        default: return "w-4 h-4";
      }
    };

    const progressPercentage = maxLength 
      ? Math.min((charCount / maxLength) * 100, 100) 
      : 0;
    
    const getProgressColor = () => {
      if (!maxLength) return "bg-origen-pradera";
      if (charCount === maxLength) return "bg-red-500";
      if (charCount > maxLength * 0.9) return "bg-amber-500";
      if (charCount > maxLength * 0.75) return "bg-origen-hoja";
      return "bg-origen-pradera";
    };

    // Determinar si hay contenido en el footer
    const hasFooterContent = error || helperText || (showCharCount && maxLength);

    return (
      <div className="w-full space-y-2">
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
          {/* Icono izquierdo */}
          {leftIcon && (
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2",
              getIconLeftPosition(),
              "flex items-center justify-center",
              "text-text-disabled pointer-events-none",
              "z-10",
              isFocused && "text-origen-pradera",
              error && "text-red-500",
              success && !error && "text-green-500"
            )}>
              {React.isValidElement(leftIcon) 
                ? React.cloneElement(leftIcon as React.ReactElement, { 
                    className: getIconSize()
                  })
                : leftIcon
              }
            </div>
          )}

          <input
            type={inputType}
            id={inputId}
            ref={ref}
            disabled={disabled}
            maxLength={maxLength}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={!!error}
            aria-describedby={cn(
              error && errorId,
              helperText && helperId
            )}
            aria-busy={loading}
            className={cn(
              "flex w-full rounded-xl",
              "text-origen-oscuro placeholder:text-text-disabled",
              "transition-all duration-200",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
              "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50 focus:border-origen-pradera",
              
              variantClasses[variant],
              sizeClasses[inputSize],
              
              getPaddingLeft(),
              getPaddingRight(),
              getHorizontalPadding(),
              
              className
            )}
            {...props}
          />

          {/* Elementos a la derecha */}
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2",
            getRightElementsPosition(),
            "flex items-center gap-1",
            "z-10"
          )}>
            {validationState === "success" && (
              <Check className={cn(getIconSize(), "text-green-500")} />
            )}
            
            {validationState === "loading" && (
              <Loader2 className={cn(getIconSize(), "animate-spin text-origen-pradera")} />
            )}
            
            {validationState === "error" && !isPassword && (
              <AlertCircle className={cn(getIconSize(), "text-red-500")} />
            )}

            {isPassword && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  "rounded-lg",
                  inputSize === "sm" && "h-6 w-6",
                  inputSize === "md" && "h-7 w-7",
                  inputSize === "lg" && "h-8 w-8"
                )}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className={cn(getIconSize())} />
                ) : (
                  <Eye className={cn(getIconSize())} />
                )}
              </Button>
            )}
            
            {rightIcon && !validationState && !isPassword && (
              <div className="text-text-disabled">
                {React.isValidElement(rightIcon)
                  ? React.cloneElement(rightIcon as React.ReactElement, { 
                      className: getIconSize()
                    })
                  : rightIcon
                }
              </div>
            )}
          </div>
          
          {/* Barra de progreso para contador */}
          {showCharCount && maxLength && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-surface-alt rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  getProgressColor()
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Footer - SOLO se renderiza si hay contenido */}
        {hasFooterContent && (
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
            </div>

            {/* Contador de caracteres */}
            {showCharCount && maxLength && (
              <span 
                className={cn(
                  "text-xs tabular-nums",
                  charCount === maxLength 
                    ? "text-red-600" 
                    : charCount > maxLength * 0.9 
                    ? "text-amber-600"
                    : "text-text-subtle"
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

Input.displayName = "Input";

// ============================================================================
// INPUT GROUP
// ============================================================================

interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Dirección de los inputs */
  direction?: "vertical" | "horizontal";
  /** Contenido del grupo */
  children: React.ReactNode;
  /** Etiqueta del grupo */
  groupLabel?: string;
  /** Descripción del grupo */
  groupDescription?: string;
}

/**
 * Componente para agrupar múltiples inputs
 * @component InputGroup
 */
const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, direction = "vertical", groupLabel, groupDescription, children, ...props }, ref) => {
    return (
      <div className="space-y-3">
        {(groupLabel || groupDescription) && (
          <div className="space-y-1">
            {groupLabel && (
              <h4 className="text-sm font-semibold text-origen-bosque">
                {groupLabel}
              </h4>
            )}
            {groupDescription && (
              <p className="text-xs text-text-subtle">
                {groupDescription}
              </p>
            )}
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            direction === "vertical" && "space-y-3",
            direction === "horizontal" && "flex flex-col sm:flex-row gap-3",
            className
          )}
          role="group"
          {...props}
        >
          {React.Children.map(children, (child) => (
            <div className="flex-1">{child}</div>
          ))}
        </div>
      </div>
    );
  }
);

InputGroup.displayName = "InputGroup";

export { Input, InputGroup };