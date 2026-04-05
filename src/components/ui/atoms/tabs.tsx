/**
 * @file tabs.tsx
 * @description Sistema de pestañas profesional
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge, type BadgeVariant } from "@origen/ux-library";

// ============================================================================
// TIPOS
// ============================================================================

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "pills" | "underline" | "minimal" | "card" | "segmented";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

// ============================================================================
// CONTEXTO
// ============================================================================

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
  orientation: "horizontal" | "vertical";
  variant: "default" | "pills" | "underline" | "minimal" | "card" | "segmented";
  size: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("useTabsContext debe usarse dentro de un componente Tabs");
  }
  return context;
};

// ============================================================================
// CONSTANTES DE ESTILO - PALETA ORIGEN
// ============================================================================

const variantStyles = {
  default: {
    list: "bg-origen-crema/50 p-1 rounded-xl border border-origen-pradera/20 flex-wrap items-center",
    trigger: {
      base: "rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
      active: "bg-surface-alt text-origen-bosque shadow-sm border border-origen-pradera/30",
      inactive: "text-muted-foreground hover:text-origen-bosque hover:bg-surface-alt/50",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  pills: {
    list: "flex gap-2 flex-wrap",
    trigger: {
      base: "rounded-full font-medium transition-all duration-200 border whitespace-nowrap",
      active: "bg-origen-pradera text-white border-origen-pradera shadow-sm",
      inactive: "bg-surface-alt border-border text-muted-foreground hover:border-origen-pradera hover:text-origen-bosque",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  underline: {
    list: "border-b border-border flex-wrap",
    trigger: {
      base: "font-medium transition-all duration-200 relative pb-2 whitespace-nowrap",
      active: "text-origen-bosque font-semibold",
      inactive: "text-muted-foreground hover:text-origen-bosque",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  minimal: {
    list: "flex gap-1 flex-wrap",
    trigger: {
      base: "font-medium transition-all duration-200 rounded-lg px-3 py-2 whitespace-nowrap",
      active: "text-origen-pradera bg-origen-pradera/10",
      inactive: "text-muted-foreground hover:text-origen-bosque hover:bg-surface",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  card: {
    list: "bg-surface-alt rounded-xl shadow-sm p-1 border border-border flex-wrap",
    trigger: {
      base: "rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
      active: "bg-origen-pradera/10 text-origen-bosque border border-origen-pradera/30",
      inactive: "text-muted-foreground hover:text-origen-bosque hover:bg-surface",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  segmented: {
    list: "bg-origen-crema/70 p-1 rounded-xl border border-origen-pradera/20 flex-wrap",
    trigger: {
      base: "rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
      active: "bg-surface-alt text-origen-bosque shadow-sm border border-origen-pradera/30",
      inactive: "text-muted-foreground hover:text-origen-bosque",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
};

const sizeStyles = {
  sm: {
    list: "text-xs",
    trigger: "px-3 py-1.5 text-xs",
    gap: "gap-1",
    icon: "w-3.5 h-3.5",
    badge: "xs",
  },
  md: {
    list: "text-sm",
    trigger: "px-4 py-2 text-sm",
    gap: "gap-2",
    icon: "w-4 h-4",
    badge: "sm",
  },
  lg: {
    list: "text-base",
    trigger: "px-5 py-2.5 text-base",
    gap: "gap-3",
    icon: "w-5 h-5",
    badge: "md",
  },
};

// ============================================================================
// COMPONENTE TABS PRINCIPAL
// ============================================================================

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      className = "",
      value,
      defaultValue,
      onValueChange,
      orientation = "horizontal",
      variant = "default",
      size = "md",
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");
    const isControlled = value !== undefined;
    const activeTab = isControlled ? value : internalValue;

    const setActiveTab = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [isControlled, onValueChange]
    );

    const contextValue = React.useMemo(
      () => ({
        activeTab,
        setActiveTab,
        orientation,
        variant,
        size,
        fullWidth,
      }),
      [activeTab, setActiveTab, orientation, variant, size, fullWidth]
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            "w-full",
            orientation === "vertical" && "flex flex-col sm:flex-row gap-4 sm:gap-6",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";

// ============================================================================
// COMPONENTE TABS LIST
// ============================================================================

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className = "", children, ...props }, ref) => {
    const { orientation, variant, size, fullWidth } = useTabsContext();

    const orientationClasses = {
      horizontal: cn(
        "flex",
        sizeStyles[size].gap,
        fullWidth && "w-full"
      ),
      vertical: cn(
        "flex flex-col",
        sizeStyles[size].gap,
        "w-full sm:w-48 shrink-0"
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant].list,
          orientationClasses[orientation],
          sizeStyles[size].list,
          className
        )}
        role="tablist"
        aria-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsList.displayName = "TabsList";

// ============================================================================
// COMPONENTE TABS TRIGGER - CORREGIDO CON MEJOR NAVEGACIÓN POR TECLADO
// ============================================================================

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({
    className = "",
    value,
    disabled = false,
    icon,
    badge,
    badgeVariant = "warning",
    children,
    ...props
  }, ref) => {
    const { activeTab, setActiveTab, orientation, variant, size, fullWidth } = useTabsContext();
    const isActive = activeTab === value;

    const orientationClasses = {
      horizontal: "",
      vertical: "w-full justify-start",
    };

    const widthClass = fullWidth && orientation === "horizontal" ? "flex-1" : "";

    // Determinar la variante del badge según el estado
    const getBadgeVariant = (): BadgeVariant => {
      if (badgeVariant) return badgeVariant;
      return isActive ? "success" : "warning";
    };

    // Manejo de navegación por teclado
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const parentElement = e.currentTarget.parentElement;
      if (!parentElement) return;

      const triggers = Array.from(
        parentElement.querySelectorAll('[role="tab"]')
      ) as HTMLButtonElement[];
      const currentIndex = triggers.indexOf(e.currentTarget);

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % triggers.length;
        triggers[nextIndex]?.focus();
        triggers[nextIndex]?.click();
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? triggers.length - 1 : currentIndex - 1;
        triggers[prevIndex]?.focus();
        triggers[prevIndex]?.click();
      }

      if (e.key === 'Home') {
        e.preventDefault();
        triggers[0]?.focus();
        triggers[0]?.click();
      }

      if (e.key === 'End') {
        e.preventDefault();
        const lastIndex = triggers.length - 1;
        triggers[lastIndex]?.focus();
        triggers[lastIndex]?.click();
      }
    };

    // Indicador para variante underline
    const UnderlineIndicator = () => {
      if (variant !== "underline" || !isActive) return null;

      return (
        <motion.div
          layoutId="underline-indicator"
          className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-origen-pradera rounded-full"
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      );
    };

    // Indicador para variante vertical underline
    const VerticalUnderlineIndicator = () => {
      if (variant !== "underline" || !isActive || orientation !== "vertical") return null;

      return (
        <motion.div
          layoutId="vertical-underline-indicator"
          className="absolute -right-[1px] top-0 bottom-0 w-0.5 bg-origen-pradera rounded-full"
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      );
    };

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        id={`tab-${value}`}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className={cn(
          variantStyles[variant].trigger.base,
          isActive ? variantStyles[variant].trigger.active : variantStyles[variant].trigger.inactive,
          disabled && variantStyles[variant].trigger.disabled,
          sizeStyles[size].trigger,
          orientationClasses[orientation],
          widthClass,
          "relative",
          className
        )}
        onClick={() => !disabled && setActiveTab(value)}
        data-state={isActive ? "active" : "inactive"}
        {...props}
      >
        <span className="flex items-center justify-center gap-2 whitespace-nowrap">
          {/* Icono */}
          {icon && (
            <span className={cn(
              "shrink-0",
              sizeStyles[size].icon,
              isActive ? "text-current" : "text-text-disabled"
            )}>
              {icon}
            </span>
          )}

          {/* Texto - con whitespace-nowrap para evitar saltos de línea */}
          <span className="whitespace-nowrap">{children}</span>

          {/* Badge - usando el componente Badge de la aplicación */}
          {badge !== undefined && badge !== null && badge !== 0 && (
            <Badge
              variant={getBadgeVariant()}
              size={sizeStyles[size].badge as any}
              className="ml-0.5"
            >
              {badge}
            </Badge>
          )}
        </span>

        {/* Indicadores de línea */}
        <UnderlineIndicator />
        <VerticalUnderlineIndicator />
      </button>
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

// ============================================================================
// COMPONENTE TABS CONTENT
// ============================================================================

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className = "", value, children, ...props }, ref) => {
    const { activeTab } = useTabsContext();
    const isActive = activeTab === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        aria-labelledby={`tab-${value}`}
        className={cn(
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera focus-visible:ring-offset-2",
          "animate-in fade-in-0 duration-300",
          "mt-4",
          className
        )}
        tabIndex={0}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = "TabsContent";

// ============================================================================
// TABS CON ICONOS (Wrapper de alto nivel)
// ============================================================================

export interface TabsWithIconProps extends TabsProps {
  tabs: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
    content: React.ReactNode;
    badge?: string | number;
    badgeVariant?: BadgeVariant;
    disabled?: boolean;
  }>;
  className?: string;
}

const TabsWithIcon = React.forwardRef<HTMLDivElement, TabsWithIconProps>(
  ({ tabs, className, ...props }, ref) => {
    return (
      <Tabs ref={ref} className={className} {...props}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              icon={tab.icon}
              badge={tab.badge}
              badgeVariant={tab.badgeVariant}
              disabled={tab.disabled}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.charAt(0)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    );
  }
);

TabsWithIcon.displayName = "TabsWithIcon";

// ============================================================================
// EXPORT
// ============================================================================

export { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent, 
  TabsWithIcon,
  useTabsContext as useTabs
};