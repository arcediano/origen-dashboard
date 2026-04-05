/**
 * @file toggle.tsx
 * @description Toggle switch premium - 100% responsive
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, X, Leaf, Sprout, Loader2 } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'size'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  variant?: "leaf" | "seed" | "forest" | "accent";
  toggleSize?: "sm" | "md" | "lg";
  /** Alias for toggleSize */
  size?: "sm" | "md" | "lg";
  activeIcon?: React.ReactNode;
  inactiveIcon?: React.ReactNode;
  label?: string;
  description?: string;
  labelPosition?: "left" | "right" | "top" | "bottom";
  loading?: boolean;
  error?: boolean;
  errorText?: string;
  required?: boolean;
}

// ============================================================================
// TOGGLE COMPONENT
// ============================================================================

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className = "",
      variant = "leaf",
      toggleSize,
      size,
      activeIcon,
      inactiveIcon,
      label,
      description,
      labelPosition = "right",
      loading = false,
      error = false,
      errorText,
      checked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      required = false,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const [isHovered, setIsHovered] = React.useState(false);
    
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;
    
    const variantConfig = {
      leaf: {
        background: "bg-origen-crema",
        checkedBackground: "bg-origen-pradera",
        thumb: "bg-white",
        defaultActiveIcon: <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
        defaultInactiveIcon: <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
      },
      seed: {
        background: "bg-origen-crema",
        checkedBackground: "bg-origen-pradera",
        thumb: "bg-white",
        defaultActiveIcon: <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
        defaultInactiveIcon: <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
      },
      forest: {
        background: "bg-origen-bosque/10",
        checkedBackground: "bg-origen-bosque",
        thumb: "bg-white",
        defaultActiveIcon: <Leaf className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
        defaultInactiveIcon: <Sprout className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
      },
      accent: {
        background: "bg-origen-pradera/20",
        checkedBackground: "bg-origen-pradera",
        thumb: "bg-white",
        defaultActiveIcon: <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
        defaultInactiveIcon: <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
      },
    };
    
    const config = variantConfig[variant];

    const finalActiveIcon = activeIcon || config.defaultActiveIcon;
    const finalInactiveIcon = inactiveIcon || config.defaultInactiveIcon;

    const resolvedSize = toggleSize ?? size ?? "md";

    const sizeConfig = {
      sm: {
        switch: "w-8 h-4 sm:w-10 sm:h-5",
        thumb: "h-3 w-3 sm:h-4 sm:w-4",
        thumbTranslate: "translate-x-4 sm:translate-x-5",
      },
      md: {
        switch: "w-10 h-5 sm:w-12 sm:h-6",
        thumb: "h-4 w-4 sm:h-5 sm:w-5",
        thumbTranslate: "translate-x-5 sm:translate-x-6",
      },
      lg: {
        switch: "w-12 h-6 sm:w-14 sm:h-7",
        thumb: "h-5 w-5 sm:h-6 sm:w-6",
        thumbTranslate: "translate-x-6 sm:translate-x-7",
      },
    };
    
    const sizeStyles = sizeConfig[resolvedSize];

    const handleToggle = () => {
      if (disabled || loading) return;
      
      const newValue = !isChecked;
      
      if (!isControlled) {
        setInternalChecked(newValue);
      }
      
      onCheckedChange?.(newValue);
    };
    
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    };

    const toggleElement = (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={label || "Toggle"}
        aria-required={required}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        disabled={disabled || loading}
        className={cn(
          "group relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera/50 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          
          error && !disabled && "border-red-500",
          
          sizeStyles.switch,
          isChecked ? config.checkedBackground : config.background,
          
          !disabled && !loading && isHovered && "scale-105",
          
          className
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-state={isChecked ? "checked" : "unchecked"}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none inline-block transform rounded-full transition-all duration-300 ease-out",
            "flex items-center justify-center",
            "shadow-md",
            sizeStyles.thumb,
            config.thumb,
            isChecked && sizeStyles.thumbTranslate,
            loading && "animate-pulse"
          )}
        >
          {loading ? (
            <Loader2 className={cn("animate-spin", "h-2.5 w-2.5 sm:h-3 sm:w-3")} />
          ) : isChecked ? (
            <span className="text-white">
              {finalActiveIcon}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {finalInactiveIcon}
            </span>
          )}
        </span>
      </button>
    );

    if (label || description || errorText) {
      return (
        <div className="space-y-1.5 sm:space-y-2">
          <div className={cn(
            "flex items-start gap-2 sm:gap-3",
            labelPosition === "top" && "flex-col",
            labelPosition === "bottom" && "flex-col-reverse",
            labelPosition === "left" && "flex-row-reverse",
            labelPosition === "right" && "flex-row"
          )}>
            {toggleElement}
            
            {(label || description) && (
              <div className={cn(
                "grid gap-0.5 sm:gap-1 leading-none flex-1",
                labelPosition === "left" && "text-right",
                labelPosition === "right" && "text-left"
              )}>
                {label && (
                  <label
                    className={cn(
                      "text-xs sm:text-sm font-medium text-origen-bosque",
                      "transition-colors duration-200",
                      disabled && "cursor-not-allowed opacity-50",
                      isChecked && "text-origen-pino"
                    )}
                    onClick={() => !disabled && !loading && handleToggle()}
                  >
                    {label}
                    {required && (
                      <span className="text-red-500 ml-1" aria-label="requerido">
                        *
                      </span>
                    )}
                  </label>
                )}
                {description && (
                  <p className={cn(
                    "text-[10px] sm:text-xs text-muted-foreground",
                    disabled && "opacity-50"
                  )}>
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {error && errorText && (
            <p className="text-[10px] sm:text-xs text-red-600 flex items-center gap-1 ml-1">
              <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
              <span>{errorText}</span>
            </p>
          )}
        </div>
      );
    }

    return toggleElement;
  }
);

Toggle.displayName = "Toggle";

// ============================================================================
// TOGGLE GROUP
// ============================================================================

export interface ToggleGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  spacing?: "none" | "tight" | "normal" | "loose";
  groupLabel?: string;
  groupDescription?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  exclusive?: boolean;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ 
    className = "",
    children, 
    direction = "vertical", 
    spacing = "normal",
    groupLabel,
    groupDescription,
    value,
    defaultValue,
    onValueChange,
    exclusive = false,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    
    const spacingClasses = {
      none: "gap-0",
      tight: "gap-2 sm:gap-3",
      normal: "gap-3 sm:gap-4",
      loose: "gap-4 sm:gap-6",
    };
    
    const handleValueChange = (itemValue: string) => {
      if (exclusive) {
        const newValue = currentValue === itemValue ? undefined : itemValue;
        
        if (!isControlled) {
          setInternalValue(newValue);
        }
        
        onValueChange?.(newValue || "");
      }
    };
    
    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement<any>(child) && exclusive) {
        const itemValue = child.props.value || child.props.label;
        
        return React.cloneElement(child, {
          checked: currentValue === itemValue,
          onCheckedChange: () => handleValueChange(itemValue),
        });
      }
      return child;
    });
    
    return (
      <div className="space-y-2 sm:space-y-3">
        {(groupLabel || groupDescription) && (
          <div className="space-y-1">
            {groupLabel && (
              <h4 className="text-xs sm:text-sm font-semibold text-origen-bosque">
                {groupLabel}
              </h4>
            )}
            {groupDescription && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {groupDescription}
              </p>
            )}
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(
            "flex",
            direction === "vertical" && "flex-col",
            direction === "horizontal" && "flex-row flex-wrap",
            spacingClasses[spacing],
            className
          )}
          role={exclusive ? "radiogroup" : "group"}
          {...props}
        >
          {childrenWithProps}
        </div>
      </div>
    );
  }
);

ToggleGroup.displayName = "ToggleGroup";

// ============================================================================
// EXPORT
// ============================================================================

export { Toggle, ToggleGroup };