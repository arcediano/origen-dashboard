/**
 * @file slider.tsx
 * @description Slider premium con diseño orgánico - 100% responsive
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { Button } from "./button";

// ============================================================================
// TIPOS
// ============================================================================

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  label?: string;
  variant?: "leaf" | "forest" | "accent";
  sliderSize?: "sm" | "md" | "lg";
  showValue?: boolean;
  showMarks?: boolean;
  marks?: Array<{ value: number; label?: string }>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showControls?: boolean;
  step?: number;
  formatValue?: (value: number) => string;
  orientation?: "horizontal" | "vertical";
  min?: number;
  max?: number;
  disabled?: boolean;
}

// ============================================================================
// SLIDER COMPONENT
// ============================================================================

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className = "",
      label,
      variant = "leaf",
      sliderSize = "md",
      showValue = true,
      showMarks = false,
      marks,
      leftIcon,
      rightIcon,
      showControls = false,
      step = 1,
      formatValue = (val) => val.toString(),
      orientation = "horizontal",
      min = 0,
      max = 100,
      disabled = false,
      value,
      defaultValue = [50],
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<number[]>(
      value || defaultValue
    );
    const [isDragging, setIsDragging] = React.useState(false);
    const [draggingIndex, setDraggingIndex] = React.useState<number>(-1);
    const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);
    
    const sliderRef = React.useRef<HTMLDivElement>(null);
    
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const isRange = currentValue.length === 2;
    
    const variantConfig = {
      leaf: {
        track: "bg-origen-crema",
        range: "bg-origen-pradera",
        thumb: "bg-white border-2 border-origen-pradera",
        thumbHover: "border-origen-hoja",
        thumbActive: "border-origen-hoja",
      },
      forest: {
        track: "bg-origen-bosque/10",
        range: "bg-origen-bosque",
        thumb: "bg-white border-2 border-origen-bosque",
        thumbHover: "border-origen-pino",
        thumbActive: "border-origen-pino",
      },
      accent: {
        track: "bg-origen-pradera/20",
        range: "bg-origen-pradera",
        thumb: "bg-white border-2 border-origen-pradera",
        thumbHover: "border-origen-hoja",
        thumbActive: "border-origen-hoja",
      },
    };
    
    const config = variantConfig[variant];

    const sizeConfig = {
      sm: {
        track: "h-1 sm:h-1.5",
        thumb: "h-3 w-3 sm:h-4 sm:w-4",
        thumbActive: "h-4 w-4 sm:h-5 sm:w-5",
        controls: "h-5 w-5 sm:h-6 sm:w-6",
      },
      md: {
        track: "h-1.5 sm:h-2",
        thumb: "h-4 w-4 sm:h-5 sm:w-5",
        thumbActive: "h-5 w-5 sm:h-6 sm:w-6",
        controls: "h-6 w-6 sm:h-7 sm:w-7",
      },
      lg: {
        track: "h-2 sm:h-2.5",
        thumb: "h-5 w-5 sm:h-6 sm:w-6",
        thumbActive: "h-6 w-6 sm:h-7 sm:w-7",
        controls: "h-7 w-7 sm:h-8 sm:w-8",
      },
    };
    
    const size = sizeConfig[sliderSize];

    const getValueFromPosition = (clientX: number, clientY: number): number => {
      if (!sliderRef.current) return currentValue[0];
      
      const rect = sliderRef.current.getBoundingClientRect();
      
      if (orientation === "horizontal") {
        const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return min + (max - min) * percentage;
      } else {
        const percentage = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
        return min + (max - min) * percentage;
      }
    };
    
    const updateValue = (newValues: number[]) => {
      const clampedValues = newValues.map(v => Math.max(min, Math.min(max, v)));
      
      if (isRange) {
        clampedValues.sort((a, b) => a - b);
      }
      
      if (!isControlled) {
        setInternalValue(clampedValues);
      }
      
      onValueChange?.(clampedValues);
    };
    
    const handleDragStart = (index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (disabled) return;
      
      setIsDragging(true);
      setDraggingIndex(index);
      
      const handleDragMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();
        if (!sliderRef.current) return;
        
        const newValue = getValueFromPosition(moveEvent.clientX, moveEvent.clientY);
        const newValues = [...currentValue];
        newValues[index] = newValue;
        
        updateValue(newValues);
      };
      
      const handleDragEnd = () => {
        setIsDragging(false);
        setDraggingIndex(-1);
        
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
      
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    };
    
    const handleIncrement = () => {
      if (disabled) return;
      
      if (isRange) {
        const newValues = [
          Math.min(currentValue[0] + step, max),
          Math.min(currentValue[1] + step, max)
        ];
        updateValue(newValues);
      } else {
        const newValues = [Math.min(currentValue[0] + step, max)];
        updateValue(newValues);
      }
    };
    
    const handleDecrement = () => {
      if (disabled) return;
      
      if (isRange) {
        const newValues = [
          Math.max(currentValue[0] - step, min),
          Math.max(currentValue[1] - step, min)
        ];
        updateValue(newValues);
      } else {
        const newValues = [Math.max(currentValue[0] - step, min)];
        updateValue(newValues);
      }
    };
    
    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!sliderRef.current) return;
      
      const clickValue = getValueFromPosition(e.clientX, e.clientY);
      
      if (isRange) {
        const distToMin = Math.abs(clickValue - currentValue[0]);
        const distToMax = Math.abs(clickValue - currentValue[1]);
        
        if (distToMin < distToMax) {
          updateValue([clickValue, currentValue[1]]);
        } else {
          updateValue([currentValue[0], clickValue]);
        }
      } else {
        updateValue([clickValue]);
      }
    };

    const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;
    
    return (
      <div 
        ref={ref}
        className={cn(
          "w-full space-y-3 sm:space-y-4",
          orientation === "vertical" && "flex h-48 sm:h-64 items-start gap-3 sm:gap-4",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <div className={cn(
          "flex items-center justify-between",
          orientation === "vertical" && "flex-col items-start gap-1 sm:gap-2"
        )}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {leftIcon && (
              <div className="text-text-disabled">
                {leftIcon}
              </div>
            )}
            {label && (
              <label className="text-xs sm:text-sm font-semibold text-origen-bosque">
                {label}
              </label>
            )}
          </div>
          
          {showValue && (
            <div className="flex items-center gap-1 sm:gap-2 bg-origen-crema px-2 sm:px-3 py-1 rounded-lg">
              {isRange ? (
                <>
                  <span className="text-xs sm:text-sm font-medium text-origen-bosque">
                    {formatValue(currentValue[0])} - {formatValue(currentValue[1])}
                  </span>
                  <span className="text-[10px] sm:text-xs text-origen-pradera">
                    ({formatValue(currentValue[1] - currentValue[0])})
                  </span>
                </>
              ) : (
                <span className="text-xs sm:text-sm font-medium text-origen-bosque">
                  {formatValue(currentValue[0])}
                </span>
              )}
            </div>
          )}
        </div>

        <div className={cn(
          "flex items-center gap-2 sm:gap-3",
          orientation === "vertical" && "flex-col h-full",
          orientation === "horizontal" && "flex-row"
        )}>
          {showControls && (
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={handleDecrement}
              disabled={disabled || (isRange ? currentValue[0] <= min : currentValue[0] <= min)}
              aria-label="Decrementar"
              className={cn(
                size.controls,
                orientation === "vertical" && "rotate-90"
              )}
            >
              <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
          )}
          
          <div 
            ref={sliderRef}
            className={cn(
              "relative",
              orientation === "horizontal" && "flex-1",
              orientation === "vertical" && "h-full w-6 sm:w-8"
            )}
            onClick={handleTrackClick}
          >
            <div className={cn(
              "relative rounded-full",
              config.track,
              orientation === "horizontal" ? "w-full" : "h-full w-full",
              size.track,
              orientation === "vertical" && "h-full"
            )}>
              <div 
                className={cn(
                  "absolute rounded-full",
                  config.range,
                  orientation === "horizontal" 
                    ? "h-full" 
                    : "w-full bottom-0"
                )}
                style={
                  orientation === "horizontal"
                    ? {
                        left: `${getPercentage(currentValue[0])}%`,
                        right: isRange ? `${100 - getPercentage(currentValue[1])}%` : '0%'
                      }
                    : {
                        bottom: `${getPercentage(currentValue[0])}%`,
                        top: isRange ? `${100 - getPercentage(currentValue[1])}%` : '0%'
                      }
                }
              />
              
              {showMarks && marks && marks.map((mark, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute",
                    orientation === "horizontal"
                      ? "top-1/2 -translate-y-1/2"
                      : "left-1/2 -translate-x-1/2"
                  )}
                  style={
                    orientation === "horizontal"
                      ? { left: `${getPercentage(mark.value)}%` }
                      : { bottom: `${getPercentage(mark.value)}%` }
                  }
                >
                  <div className={cn(
                    "h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full border-2",
                    currentValue.some(v => Math.abs(v - mark.value) <= (max - min) * 0.05)
                      ? "bg-origen-pradera border-origen-pradera"
                      : "bg-white border-border"
                  )} />
                  {mark.label && (
                    <span className={cn(
                      "absolute text-[8px] sm:text-xs text-muted-foreground whitespace-nowrap",
                      orientation === "horizontal"
                        ? "top-3 sm:top-4 left-1/2 -translate-x-1/2"
                        : "left-3 sm:left-4 top-1/2 -translate-y-1/2"
                    )}>
                      {mark.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {currentValue.map((val, index) => (
              <div
                key={index}
                className={cn(
                  "absolute",
                  orientation === "horizontal"
                    ? "top-1/2 -translate-y-1/2"
                    : "left-1/2 -translate-x-1/2",
                  "transform -translate-x-1/2 -translate-y-1/2"
                )}
                style={
                  orientation === "horizontal"
                    ? { left: `${getPercentage(val)}%` }
                    : { bottom: `${getPercentage(val)}%` }
                }
              >
                <div
                  role="slider"
                  aria-valuemin={min}
                  aria-valuemax={max}
                  aria-valuenow={val}
                  aria-label={`Thumb ${index + 1}`}
                  tabIndex={disabled ? -1 : 0}
                  className={cn(
                    "rounded-full cursor-pointer",
                    "transition-all duration-200 ease-out",
                    "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50 focus:ring-offset-2",
                    config.thumb,
                    size.thumb,
                    isDragging && draggingIndex === index && cn(
                      size.thumbActive,
                      config.thumbActive,
                      "scale-110"
                    ),
                    !isDragging && !disabled && "hover:scale-110 hover:border-origen-hoja"
                  )}
                  onMouseDown={handleDragStart(index)}
                  onMouseEnter={() => setHoveredValue(val)}
                  onMouseLeave={() => setHoveredValue(null)}
                >
                  {showValue && (hoveredValue === val || isDragging) && (
                    <div className={cn(
                      "absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2",
                      "px-1.5 sm:px-2 py-1 rounded-lg text-[8px] sm:text-xs font-semibold",
                      "bg-origen-bosque text-white shadow-lg",
                      "whitespace-nowrap z-50",
                      "animate-in fade-in-0 zoom-in-95"
                    )}>
                      {formatValue(val)}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-origen-bosque rotate-45" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {showControls && (
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={handleIncrement}
              disabled={disabled || (isRange ? currentValue[1] >= max : currentValue[0] >= max)}
              aria-label="Incrementar"
              className={cn(
                size.controls,
                orientation === "vertical" && "rotate-90"
              )}
            >
              <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
          )}
          
          {rightIcon && (
            <div className="text-text-disabled">
              {rightIcon}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[8px] sm:text-xs">
          <span className="text-muted-foreground">{formatValue(min)}</span>
          <span className="text-origen-pradera font-medium">
            {isRange ? "Rango seleccionado" : "Valor actual"}
          </span>
          <span className="text-muted-foreground">{formatValue(max)}</span>
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };