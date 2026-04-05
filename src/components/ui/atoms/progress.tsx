/**
 * @file progress.tsx
 * @description Barra de progreso premium - 100% responsive
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Leaf, Sprout, Flower, Check, Clock } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  variant?: "seed" | "sprout" | "leaf" | "fruit" | "forest" | "warning";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  description?: string;
  animated?: boolean;
}

export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  variant?: "seed" | "sprout" | "leaf" | "fruit" | "forest";
  showIcon?: boolean;
  animated?: boolean;
}

export interface SteppedProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: number;
  currentStep: number;
  stepLabels?: string[];
  variant?: "seed" | "sprout" | "leaf" | "fruit";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className = "",
      value = 0,
      max = 100,
      showLabel = false,
      label,
      variant = "leaf",
      size = "md",
      showIcon = true,
      description,
      animated = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    // CORREGIDO: Configuración con track e indicator
    const variantConfig = {
      seed: {
        track: "bg-origen-crema",
        indicator: "bg-origen-pradera",
        icon: <Sprout className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      sprout: {
        track: "bg-green-50",
        indicator: "bg-green-400",
        icon: <Sprout className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      leaf: {
        track: "bg-origen-pastel",
        indicator: "bg-gradient-to-r from-origen-pradera to-origen-hoja",
        icon: <Leaf className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      fruit: {
        track: "bg-amber-50",
        indicator: "bg-gradient-to-r from-amber-400 to-orange-500",
        icon: <Flower className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      forest: {
        track: "bg-origen-bosque/10",
        indicator: "bg-gradient-to-r from-origen-pino to-origen-bosque",
        icon: <Sprout className="h-3 w-3 sm:h-4 sm:w-4 text-white" />,
      },
      warning: {
        track: "bg-amber-100",
        indicator: "bg-amber-500",
        icon: <Clock className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
    };
    
    const config = variantConfig[variant] || variantConfig.leaf;
    
    const sizeClasses = {
      sm: "h-1.5 sm:h-2",
      md: "h-2 sm:h-2.5",
      lg: "h-2.5 sm:h-3",
    };

    return (
      <div ref={ref} className={cn("w-full space-y-2", className)} {...props}>
        {(showLabel || label) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {showIcon && config.icon && (
                <div className={cn(
                  "p-1 rounded-lg",
                  variant === "forest" ? "text-white" : "text-origen-pradera"
                )}>
                  {config.icon}
                </div>
              )}
              {label && (
                <span className={cn(
                  "text-xs sm:text-sm font-medium",
                  variant === "forest" ? "text-white" : "text-origen-bosque"
                )}>
                  {label}
                </span>
              )}
            </div>
            {showLabel && (
              <span className={cn(
                "text-xs sm:text-sm font-semibold tabular-nums",
                variant === "forest" ? "text-white/90" : "text-origen-hoja"
              )}>
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "relative overflow-hidden rounded-full",
            config.track,  // AHORA SÍ EXISTE
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              config.indicator,  // AHORA SÍ EXISTE
              animated && "relative overflow-hidden",
              animated && "after:absolute after:inset-0",
              animated && "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
              animated && "after:animate-shimmer"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {description && (
          <p className={cn(
            "text-xs leading-relaxed",
            variant === "forest" ? "text-white/80" : "text-muted-foreground"
          )}>
            {description}
          </p>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

// ============================================================================
// CIRCULAR PROGRESS
// ============================================================================

const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  max = 100,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  variant = "leaf",
  showIcon = true,
  animated = true,
  className = "",
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    seed: { track: "hsl(var(--pradera) / 0.2)", progress: "hsl(var(--pradera))" },
    sprout: { track: "hsl(var(--hoja) / 0.2)", progress: "hsl(var(--hoja))" },
    leaf: { track: "hsl(var(--hoja) / 0.2)", progress: "hsl(var(--hoja))" },
    fruit: { track: "hsl(var(--menta) / 0.2)", progress: "hsl(var(--menta))" },
    forest: { track: "hsl(var(--pino) / 0.2)", progress: "hsl(var(--bosque))" },
  };
  
  const config = variantColors[variant] || variantColors.leaf;

  const variantIcons = {
    seed: <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-origen-pradera" />,
    sprout: <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />,
    leaf: <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-origen-hoja" />,
    fruit: <Flower className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />,
    forest: <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-origen-bosque" />,
  };

  // Responsive size
  const responsiveSize = typeof window !== 'undefined' && window.innerWidth < 640 
    ? size * 0.8 
    : size;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)} {...props}>
      <div className="relative">
        <svg 
          width={responsiveSize} 
          height={responsiveSize} 
          className="transform -rotate-90"
          viewBox={`0 0 ${responsiveSize} ${responsiveSize}`}
        >
          <circle
            cx={responsiveSize / 2}
            cy={responsiveSize / 2}
            r={radius}
            stroke={config.track}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={responsiveSize / 2}
            cy={responsiveSize / 2}
            r={radius}
            stroke={config.progress}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-700 ease-out",
              animated && "animate-[spin_3s_linear_infinite]"
            )}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showIcon && variantIcons[variant] && (
            <div className="mb-0.5 sm:mb-1">
              {variantIcons[variant]}
            </div>
          )}
          {showLabel && (
            <span className="text-sm sm:text-base font-bold text-origen-bosque tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

CircularProgress.displayName = "CircularProgress";

// ============================================================================
// STEPPED PROGRESS
// ============================================================================

const SteppedProgress: React.FC<SteppedProgressProps> = ({
  steps,
  currentStep,
  stepLabels = [],
  variant = "leaf",
  size = "md",
  animated = true,
  className = "",
  ...props
}) => {
  const stepVariants = {
    seed: {
      active: "bg-origen-pradera border-origen-pradera",
      completed: "bg-origen-pradera border-origen-pradera",
      upcoming: "bg-white border-origen-pradera/30",
    },
    sprout: {
      active: "bg-green-400 border-green-400",
      completed: "bg-green-500 border-green-500",
      upcoming: "bg-white border-green-300",
    },
    leaf: {
      active: "bg-origen-pradera border-origen-pradera",
      completed: "bg-origen-hoja border-origen-hoja",
      upcoming: "bg-white border-origen-pradera/30",
    },
    fruit: {
      active: "bg-amber-400 border-amber-400",
      completed: "bg-amber-500 border-amber-500",
      upcoming: "bg-white border-amber-300",
    },
  };
  
  const config = stepVariants[variant] || stepVariants.leaf;

  const sizeClasses = {
    sm: {
      step: "h-6 w-6 sm:h-8 sm:w-8",
      icon: "h-3 w-3 sm:h-4 sm:w-4",
      label: "text-[10px] sm:text-xs",
    },
    md: {
      step: "h-8 w-8 sm:h-10 sm:w-10",
      icon: "h-4 w-4 sm:h-5 sm:w-5",
      label: "text-xs sm:text-sm",
    },
    lg: {
      step: "h-10 w-10 sm:h-12 sm:w-12",
      icon: "h-5 w-5 sm:h-6 sm:w-6",
      label: "text-sm sm:text-base",
    },
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="flex items-center justify-between relative">
        {Array.from({ length: steps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isUpcoming = stepNumber > currentStep;
          
          return (
            <React.Fragment key={index}>
              {index < steps - 1 && (
                <div 
                  className={cn(
                    "flex-1 h-0.5 mx-1 sm:mx-2 transition-all duration-300",
                    isCompleted ? "bg-origen-hoja" : "bg-border"
                  )}
                />
              )}
              
              <div className="flex flex-col items-center relative z-10">
                <div className={cn(
                  "flex items-center justify-center rounded-full border-2",
                  "transition-all duration-300",
                  sizeClasses[size].step,
                  isActive && config.active,
                  isCompleted && config.completed,
                  isUpcoming && config.upcoming,
                  animated && isActive && "animate-pulse"
                )}>
                  {isCompleted ? (
                    <Check className={cn(
                      "text-white",
                      sizeClasses[size].icon
                    )} />
                  ) : isActive ? (
                    <Clock className={cn(
                      "text-white",
                      sizeClasses[size].icon
                    )} />
                  ) : (
                    <span className={cn(
                      "font-semibold",
                      isActive ? "text-white" : "text-muted-foreground"
                    )}>
                      {stepNumber}
                    </span>
                  )}
                </div>
                
                {stepLabels[index] && (
                  <span className={cn(
                    "mt-1 sm:mt-2 text-center max-w-[60px] sm:max-w-[80px]",
                    sizeClasses[size].label,
                    isActive ? "font-semibold text-origen-bosque" : "text-muted-foreground"
                  )}>
                    {stepLabels[index]}
                  </span>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-origen-bosque">
        Paso {currentStep} de {steps}
      </div>
    </div>
  );
};

SteppedProgress.displayName = "SteppedProgress";

// ============================================================================
// EXPORT
// ============================================================================

export { Progress, CircularProgress, SteppedProgress };