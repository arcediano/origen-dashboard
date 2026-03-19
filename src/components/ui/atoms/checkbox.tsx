/**
 * @file checkbox.tsx
 * @description Checkbox premium con diseño orgánico - 100% responsive
 */

"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { 
  Check, 
  Minus,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TIPOS
// ============================================================================

export interface CheckboxProps 
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  variant?: "seed" | "leaf" | "forest" | "accent";
  size?: "sm" | "md" | "lg";
  hasError?: boolean; 
}

export interface CheckboxWithLabelProps extends Omit<CheckboxProps, 'hasError'> {
  label?: string;
  description?: string;
  errorMessage?: string;
  labelPosition?: "right" | "left";
}

export interface CheckboxGroupProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend?: string;
  description?: string;
  children: React.ReactNode;
  error?: string;
  layout?: "vertical" | "horizontal" | "grid";
}

// ============================================================================
// CHECKBOX BASE
// ============================================================================

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ 
  className, 
  variant = "seed",
  size = "md",
  hasError,
  checked,
  ...props 
}, ref) => {
  const isChecked = checked === true;
  const isIndeterminate = checked === "indeterminate";
  
  const variantClasses = {
    seed: cn(
      "border-origen-pradera/50 bg-white",
      "hover:border-origen-hoja hover:bg-origen-crema/30",
      "data-[state=checked]:bg-origen-pradera data-[state=checked]:border-origen-pradera",
      "data-[state=checked]:hover:bg-origen-hoja",
      "data-[state=indeterminate]:bg-origen-pradera data-[state=indeterminate]:border-origen-pradera",
      hasError && "border-red-500 hover:border-red-600"
    ),
    
    leaf: cn(
      "border-origen-hoja/40 bg-white",
      "hover:border-origen-hoja hover:bg-origen-pastel/30",
      "data-[state=checked]:bg-origen-hoja data-[state=checked]:border-origen-hoja",
      "data-[state=indeterminate]:bg-origen-hoja data-[state=indeterminate]:border-origen-hoja",
      hasError && "border-red-500 hover:border-red-600"
    ),
    
    forest: cn(
      "border-origen-bosque/30 bg-white",
      "hover:border-origen-bosque hover:bg-origen-bosque/5",
      "data-[state=checked]:bg-origen-bosque data-[state=checked]:border-origen-bosque",
      "data-[state=indeterminate]:bg-origen-bosque data-[state=indeterminate]:border-origen-bosque",
      hasError && "border-red-500 hover:border-red-600"
    ),
    
    accent: cn(
      "border-origen-pradera/30 bg-white",
      "hover:border-origen-pradera hover:bg-origen-pradera/5",
      "data-[state=checked]:bg-origen-pradera data-[state=checked]:border-origen-pradera",
      "data-[state=indeterminate]:bg-origen-pradera data-[state=indeterminate]:border-origen-pradera",
      hasError && "border-red-500 hover:border-red-600"
    ),
  };

  const sizeClasses = {
    sm: cn(
      "h-4 w-4 rounded",
      "[&_svg]:h-3 [&_svg]:w-3"
    ),
    md: cn(
      "h-5 w-5 rounded-md",
      "[&_svg]:h-3.5 [&_svg]:w-3.5"
    ),
    lg: cn(
      "h-6 w-6 rounded-md",
      "[&_svg]:h-4 [&_svg]:w-4"
    ),
  };
  
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "shrink-0 border-2 bg-white",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera/50 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "disabled:data-[state=checked]:bg-text-disabled disabled:data-[state=checked]:border-text-disabled",
        
        variantClasses[variant],
        sizeClasses[size],
        
        className
      )}
      checked={checked}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "flex items-center justify-center text-white",
          "transition-all duration-200"
        )}
      >
        {isIndeterminate ? (
          <Minus className="text-current" />
        ) : isChecked ? (
          <Check className="text-current" />
        ) : null}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";

// ============================================================================
// CHECKBOX CON LABEL
// ============================================================================

const CheckboxWithLabel = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxWithLabelProps
>(({ 
  label, 
  description, 
  errorMessage: errorText,
  id,
  labelPosition = "right",
  className,
  size = "md",
  variant = "seed",
  checked,
  onCheckedChange,
  disabled,
  required,
  ...props 
}, ref) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;
  
  return (
    <div className="space-y-1">
      <div className={cn(
        "flex items-start gap-3",
        labelPosition === "left" && "flex-row-reverse justify-end"
      )}>
        <Checkbox
          ref={ref}
          id={checkboxId}
          size={size}
          variant={variant}
          hasError={!!errorText}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          required={required}
          className="mt-0.5"
          {...props}
        />
        
        {label && (
          <div className="flex-1">
            <label
              htmlFor={checkboxId}
              className={cn(
                "text-sm font-medium text-origen-bosque cursor-pointer",
                "transition-colors duration-200",
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {label}
              {required && (
                <span className="text-red-500 ml-1" aria-label="requerido">
                  *
                </span>
              )}
            </label>
            
            {description && (
              <p className="text-xs text-text-subtle mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
      
      {errorText && (
        <p className="text-xs text-red-600 ml-8" role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
});

CheckboxWithLabel.displayName = "CheckboxWithLabel";

// ============================================================================
// CHECKBOX GROUP
// ============================================================================

const CheckboxGroup = React.forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  ({ 
    className, 
    legend, 
    description, 
    children, 
    error,
    layout = "vertical",
    ...props 
  }, ref) => {
    const layoutClasses = {
      vertical: "space-y-3",
      horizontal: "flex flex-col sm:flex-row flex-wrap gap-4",
      grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
    };
    
    return (
      <fieldset 
        ref={ref}
        className={cn("space-y-3", className)}
        {...props}
      >
        {(legend || description) && (
          <div className="space-y-1">
            {legend && (
              <legend className="text-sm font-semibold text-origen-bosque">
                {legend}
              </legend>
            )}
            {description && (
              <p className="text-xs text-text-subtle">
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className={layoutClasses[layout]}>
          {children}
        </div>
        
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

// ============================================================================
// EXPORT
// ============================================================================

export { 
  Checkbox, 
  CheckboxWithLabel, 
  CheckboxGroup 
};