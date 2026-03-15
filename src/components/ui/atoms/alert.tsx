/**
 * @file alert.tsx
 * @description Alertas premium con diseño orgánico - 100% responsive
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  X,
  Leaf,
  Sprout
} from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "organic";
  dismissible?: boolean;
  onDismiss?: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  animate?: boolean;
  alertSize?: "sm" | "md" | "lg";
  position?: "top" | "bottom" | "inline";
}

// ============================================================================
// SISTEMA DE ICONOS
// ============================================================================

const variantIcons = {
  default: <Info className="h-4 w-4 sm:h-5 sm:w-5" />,
  success: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
  warning: <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />,
  error: <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
  info: <Info className="h-4 w-4 sm:h-5 sm:w-5" />,
  organic: <Leaf className="h-4 w-4 sm:h-5 sm:w-5" />,
};

// ============================================================================
// COMPONENTE ALERT PRINCIPAL
// ============================================================================

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className = "",
      variant = "default",
      dismissible = false,
      onDismiss,
      title,
      description,
      icon,
      animate = true,
      alertSize = "md",
      position = "inline",
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) return null;

    const variantClasses = {
      default: "bg-origen-crema border border-origen-pradera/30 text-origen-bosque [&>svg]:text-origen-hoja",
      success: "bg-origen-hoja/10 border border-origen-hoja/20 text-origen-bosque [&>svg]:text-origen-hoja",
      warning: "bg-amber-50 border border-amber-200 text-amber-900 [&>svg]:text-amber-600",
      error: "bg-red-50 border border-red-200 text-red-900 [&>svg]:text-red-600",
      info: "bg-origen-pradera/10 border border-origen-pradera/20 text-origen-bosque [&>svg]:text-origen-pradera",
      organic: "bg-gradient-to-br from-origen-pastel to-origen-crema border-2 border-origen-pradera/30 text-origen-oscuro [&>svg]:text-origen-pradera shadow-lg shadow-origen-pradera/10",
    };

    const sizeClasses = {
      sm: "p-3 text-xs sm:text-sm [&>svg]:h-4 [&>svg]:w-4",
      md: "p-4 text-sm sm:text-base [&>svg]:h-5 [&>svg]:w-5",
      lg: "p-5 text-base sm:text-lg [&>svg]:h-6 [&>svg]:w-6",
    };

    const positionClasses = {
      top: "fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-lg",
      bottom: "fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-lg",
      inline: "relative w-full",
    };

    const animationClasses = animate
      ? cn(
          "animate-in",
          position === "top" && "slide-in-from-top-2 fade-in",
          position === "bottom" && "slide-in-from-bottom-2 fade-in",
          position === "inline" && "fade-in-0 zoom-in-95"
        )
      : "";

    const finalIcon = icon || variantIcons[variant] || variantIcons.default;

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl sm:rounded-2xl",
          "transition-all duration-300 ease-out",
          "shadow-md backdrop-blur-sm",
          "flex items-start gap-2 sm:gap-3",
          dismissible && alertSize === "sm" && "pr-10 sm:pr-12",
          dismissible && alertSize === "md" && "pr-12 sm:pr-14",
          dismissible && alertSize === "lg" && "pr-14 sm:pr-16",
          variantClasses[variant],
          sizeClasses[alertSize],
          positionClasses[position],
          animationClasses,
          className
        )}
        role="alert"
        aria-live={variant === "error" ? "assertive" : "polite"}
        {...props}
      >
        <div className={cn(
          "flex-shrink-0 mt-0.5",
          variant === "organic" && "animate-pulse"
        )}>
          {finalIcon}
        </div>
        
        <div className="flex-1 space-y-1">
          {title && (
            <h5 className={cn(
              "font-semibold leading-tight",
              alertSize === "sm" && "text-sm",
              alertSize === "md" && "text-base",
              alertSize === "lg" && "text-lg"
            )}>
              {title}
            </h5>
          )}
          {description && (
            <div className={cn(
              "text-sm leading-relaxed",
              variant === "organic" && "text-origen-oscuro/90"
            )}>
              {description}
            </div>
          )}
          {children}
        </div>
        
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              "absolute right-2 sm:right-3 top-2 sm:top-3 rounded-lg p-1.5",
              "opacity-70 hover:opacity-100 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              variant === "default" && "hover:bg-origen-pradera/20 focus:ring-origen-pradera",
              variant === "success" && "hover:bg-green-200/50 focus:ring-green-500",
              variant === "warning" && "hover:bg-amber-200/50 focus:ring-amber-500",
              variant === "error" && "hover:bg-red-200/50 focus:ring-red-500",
              variant === "info" && "hover:bg-blue-200/50 focus:ring-blue-500",
              variant === "organic" && "hover:bg-origen-pradera/20 focus:ring-origen-pradera"
            )}
            aria-label="Cerrar alerta"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        )}
        
        {variant === "organic" && (
          <>
            <div className="absolute -bottom-2 -right-2 h-10 w-10 sm:h-12 sm:w-12 text-origen-pradera/30 rotate-12">
              <Leaf className="h-full w-full" />
            </div>
            <div className="absolute -top-2 -left-2 h-8 w-8 sm:h-10 sm:w-10 text-origen-pradera/30 -rotate-12">
              <Sprout className="h-full w-full" />
            </div>
          </>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";

// ============================================================================
// ALERT TITLE
// ============================================================================

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-semibold leading-tight", className)}
    {...props}
  />
));

AlertTitle.displayName = "AlertTitle";

// ============================================================================
// ALERT DESCRIPTION
// ============================================================================

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm leading-relaxed", className)}
    {...props}
  />
));

AlertDescription.displayName = "AlertDescription";

// ============================================================================
// ALERT WITH ICON (Wrapper con icono predefinido)
// ============================================================================

export interface AlertWithIconProps extends AlertProps {
  title?: string;
  description?: string;
}

const AlertWithIcon = React.forwardRef<HTMLDivElement, AlertWithIconProps>(
  ({ variant = "default", title, description, children, ...props }, ref) => {
    return (
      <Alert
        ref={ref}
        variant={variant}
        title={title}
        description={description}
        {...props}
      >
        {children}
      </Alert>
    );
  }
);

AlertWithIcon.displayName = "AlertWithIcon";

// ============================================================================
// ALERT STACK (para múltiples alertas)
// ============================================================================

export interface AlertStackProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  spacing?: "sm" | "md" | "lg";
  align?: "start" | "center" | "end";
  children?: React.ReactNode;
  className?: string;
}

const AlertStack = React.forwardRef<HTMLDivElement, AlertStackProps>(
  ({ 
    className = "", 
    position = "top-right", 
    spacing = "md",
    align = "end",
    children, 
    ...props 
  }, ref) => {
    const positionClasses = {
      "top-right": "fixed top-2 sm:top-4 right-2 sm:right-4",
      "top-left": "fixed top-2 sm:top-4 left-2 sm:left-4",
      "bottom-right": "fixed bottom-2 sm:bottom-4 right-2 sm:right-4",
      "bottom-left": "fixed bottom-2 sm:bottom-4 left-2 sm:left-4",
      "top-center": "fixed top-2 sm:top-4 left-1/2 -translate-x-1/2",
      "bottom-center": "fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2",
    };
    
    const spacingClasses = {
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    };
    
    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          "z-50 flex flex-col w-full max-w-[calc(100%-2rem)] sm:max-w-sm",
          positionClasses[position],
          spacingClasses[spacing],
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AlertStack.displayName = "AlertStack";

// ============================================================================
// EXPORT
// ============================================================================

export { 
  Alert, 
  AlertTitle, 
  AlertDescription,
  AlertWithIcon,
  AlertStack 
};