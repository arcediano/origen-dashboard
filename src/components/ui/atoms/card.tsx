/**
 * @file card.tsx
 * @description Sistema de Cards premium con patrones de estados definidos
 * @version 3.0.0 - Actualizado para paleta "Bosque Profundo"
 *
 * @component Card
 *
 * Estados definidos para cards interactivas:
 * - default: Estado reposo (sin interacción)
 * - hover: Estado sobre elemento (elevación + borde + sombra)
 * - focus: Estado con foco de teclado (ring)
 * - selected: Estado seleccionado (borde origen-hoja + indicador)
 * - unselected: Estado no seleccionado (borde gris + sin indicador)
 * - disabled: Estado desactivado (opacity 50%, no pointer events)
 *
 * Variantes disponibles:
 * - default: Fondo blanco, borde sutil, sombra subtle
 * - elevated: Fondo blanco, sombra origen, hover shadow-origen-lg
 * - outline: Transparente con borde 2px
 * - flat: Fondo origen-pastel, sin sombra
 * - organic: Con elementos decorativos de hojas
 * - dark: Degradado verde, texto blanco
 *
 * Efectos hover disponibles:
 * - none: Sin efecto hover
 * - lift: Elevación vertical (-translate-y)
 * - glow: Sombra incrementada
 * - scale: Escala ligera (1.01 → 1.02)
 * - organic: Combinación de sombra + borde
 *
 * @example
 * // Card interactiva con hover lift
 * <Card variant="elevated" interactive hoverEffect="lift">
 *   <CardHeader>
 *     <CardTitle>Título</CardTitle>
 *   </CardHeader>
 *   <CardContent>Contenido</CardContent>
 * </Card>
 *
 * @example
 * // Card de estadística
 * <StatCard
 *   label="Ventas"
 *   value="€12,450"
 *   trend={{ value: 15, isPositive: true }}
 *   icon={<TrendingUp />}
 * />
 *
 * @example
 * // Card de producto
 * <ProductCard
 *   image="/producto.jpg"
 *   name="Producto"
 *   price="19.99"
 *   producer="Productor Local"
 *   rating={4.5}
 *   reviewCount={128}
 *   onAddToCart={() => {}}
 * />
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Leaf, Sprout, ArrowRight, Star } from "lucide-react";
import { Button } from "./button";

// ============================================================================
// TIPOS
// ============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variante de card
   * - default: Fondo blanco, borde sutil, sombra subtle
   * - elevated: Fondo blanco, sombra origen, hover shadow-origen-lg
   * - outline: Transparente con borde 2px
   * - flat: Fondo origen-pastel, sin sombra
   * - organic: Con elementos decorativos de hojas
   * - dark: Degradado verde, texto blanco
   */
  variant?: "default" | "elevated" | "outline" | "flat" | "organic" | "dark";

  /**
   * Card interactiva (clickeable)
   * Añade cursor pointer, hover ring y navegación por teclado
   */
  interactive?: boolean;

  /**
   * Padding interno
   * - none: Sin padding
   * - sm: p-4 sm:p-5
   * - md: p-5 sm:p-6 (default)
   * - lg: p-6 sm:p-8
   */
  padding?: "none" | "sm" | "md" | "lg";

  /**
   * Borde redondeado
   * - none: Sin redondeo
   * - sm: rounded-lg sm:rounded-xl
   * - md: rounded-xl sm:rounded-2xl
   * - lg: rounded-2xl sm:rounded-3xl (default)
   * - xl: rounded-3xl sm:rounded-4xl
   * - full: rounded-3xl sm:rounded-[2rem]
   */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";

  /**
   * Imagen de fondo
   */
  backgroundImage?: string;

  /**
   * Overlay de imagen de fondo
   * - none: Sin overlay
   * - light: bg-black/10
   * - medium: bg-black/30
   * - dark: bg-black/50
   */
  overlay?: "none" | "light" | "medium" | "dark";

  /**
   * Efecto hover para cards interactivas
   * - none: Sin efecto
   * - lift: Elevación vertical (-translate-y-1 → -translate-y-2)
   * - glow: Sombra incrementada (shadow-subtle → shadow-origen-lg)
   * - scale: Escala ligera (1.01 → 1.02)
   * - organic: Combinación de sombra + borde origen-pradera/50
   */
  hoverEffect?: "none" | "lift" | "glow" | "scale" | "organic";

  /**
   * Animación de entrada
   */
  animate?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Espaciado entre elementos
   * - sm: space-y-1 mb-3
   * - md: space-y-1.5 mb-4
   * - lg: space-y-2 mb-5
   */
  spacing?: "sm" | "md" | "lg";
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Espaciado entre elementos
   * - sm: space-y-2
   * - md: space-y-3
   * - lg: space-y-4
   */
  spacing?: "sm" | "md" | "lg";
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Espaciado desde contenido superior
   * - sm: mt-3 pt-2
   * - md: mt-4 pt-3
   * - lg: mt-5 pt-4
   */
  spacing?: "sm" | "md" | "lg";

  /**
   * Alineación del contenido
   * - left: justify-start
   * - center: justify-center
   * - right: justify-end
   */
  align?: "left" | "center" | "right";
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Tamaño del título
   * - sm: text-base sm:text-lg
   * - md: text-lg sm:text-xl
   * - lg: text-xl sm:text-2xl
   */
  size?: "sm" | "md" | "lg";
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /**
   * Tamaño del texto
   * - sm: text-xs sm:text-sm
   * - md: text-sm sm:text-base
   * - lg: text-base sm:text-lg
   */
  size?: "sm" | "md" | "lg";
}

// ============================================================================
// COMPONENTE CARD PRINCIPAL
// ============================================================================

/**
 * Componente Card
 *
 * Patrón de hover para cards interactivas:
 * - Capa de glow absoluto detrás (origen-pradera/5)
 * - Card con bg-white, borde, sombra
 * - Hover: sombra incrementada + borde origen-hoja/40
 *
 * @see https://origen-brand.github.io/manual/components/cards
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = "",
      variant = "default",
      interactive = false,
      padding = "md",
      rounded = "lg",
      backgroundImage,
      overlay = "none",
      hoverEffect = "none",
      animate = false,
      children,
      ...props
    },
    ref
  ) => {
    /**
     * Clases para cada variante de card
     */
    const variantClasses = {
      /**
       * default: Fondo blanco, borde sutil, sombra subtle
       * Uso: Cards de contenido estándar
       */
      default: cn(
        /* === Fondo === */
        "bg-white",
        /* === Borde === */
        "border",
        "border-origen-pradera/20",
        /* === Sombra === */
        "shadow-subtle",
        /* === Estado hover (si interactive) === */
        interactive && "hover:shadow-origen",
        interactive && "hover:border-origen-hoja/40",
        interactive && "transition-all duration-300"
      ),

      /**
       * elevated: Fondo blanco, sin borde, sombra origen
       * Uso: Cards de acción, estadísticas destacadas
       */
      elevated: cn(
        /* === Fondo === */
        "bg-white",
        /* === Borde === */
        "border-0",
        /* === Sombra === */
        "shadow-origen",
        /* === Estado hover === */
        "hover:shadow-origen-lg",
        "transition-all duration-300"
      ),

      /**
       * outline: Transparente con borde 2px
       * Uso: Cards con contenido visible de fondo
       */
      outline: cn(
        /* === Fondo === */
        "bg-transparent",
        /* === Borde === */
        "border-2",
        "border-origen-pradera/30",
        /* === Estado hover === */
        "hover:border-origen-hoja",
        "transition-colors duration-300"
      ),

      /**
       * flat: Fondo origen-pastel, sin sombra
       * Uso: Cards sutiles, información complementaria
       */
      flat: cn(
        /* === Fondo === */
        "bg-origen-pastel",
        /* === Borde === */
        "border-0",
        /* === Sombra === */
        "shadow-none"
      ),

      /**
       * organic: Con elementos decorativos de hojas
       * Uso: Cards con identidad de marca fuerte
       */
      organic: cn(
        /* === Fondo === */
        "bg-white",
        /* === Borde === */
        "border",
        "border-origen-pradera/30",
        /* === Sombra === */
        "shadow-origen",
        /* === Estado hover === */
        "hover:shadow-origen-lg",
        "hover:border-origen-pradera/50",
        /* === Layout === */
        "relative",
        "overflow-hidden",
        "transition-all duration-500"
      ),

      /**
       * dark: Degradado verde, texto blanco
       * Uso: Banners, hero cards, destacados
       */
      dark: cn(
        /* === Fondo === */
        "bg-gradient-to-br",
        "from-origen-bosque",
        "to-origen-pino",
        /* === Borde === */
        "border",
        "border-origen-bosque/30",
        /* === Texto === */
        "text-white",
        /* === Sombra === */
        "shadow-lg",
        "shadow-origen-bosque/20"
      ),
    };

    /**
     * Clases de padding
     */
    const paddingClasses = {
      none: "p-0",
      sm: "p-4 sm:p-5",
      md: "p-5 sm:p-6",
      lg: "p-6 sm:p-8",
    };

    /**
     * Clases de borde redondeado
     */
    const roundedClasses = {
      none: "rounded-none",
      sm: "rounded-lg sm:rounded-xl",
      md: "rounded-xl sm:rounded-2xl",
      lg: "rounded-2xl sm:rounded-3xl",
      xl: "rounded-3xl sm:rounded-4xl",
      full: "rounded-3xl sm:rounded-[2rem]",
    };

    /**
     * Clases de overlay
     */
    const overlayClasses = {
      none: "",
      light: "bg-origen-oscuro/10",
      medium: "bg-origen-oscuro/30",
      dark: "bg-origen-oscuro/50",
    };

    /**
     * Clases de efecto hover
     */
    const hoverClasses = {
      none: "",
      lift: cn(
        /* === Estado default === */
        "transition-transform duration-300",
        /* === Estado hover === */
        "hover:-translate-y-1",
        "sm:hover:-translate-y-2"
      ),
      glow: cn(
        /* === Estado default === */
        "transition-shadow duration-300",
        /* === Estado hover === */
        "hover:shadow-origen-lg"
      ),
      scale: cn(
        /* === Estado default === */
        "transition-transform duration-300",
        /* === Estado hover === */
        "hover:scale-[1.01]",
        "sm:hover:scale-[1.02]"
      ),
      organic: cn(
        /* === Estado default === */
        "transition-all duration-500",
        /* === Estado hover === */
        "hover:shadow-origen-lg",
        "hover:border-origen-pradera/50"
      ),
    };

    /**
     * Clases de animación de entrada
     */
    const animationClasses = animate
      ? "animate-in fade-in-0 zoom-in-95 duration-500"
      : "";

    /**
     * Estilo de imagen de fondo
     */
    const backgroundStyle = backgroundImage
      ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {};

    return (
      <div
        ref={ref}
        className={cn(
          /* === Layout === */
          "relative",
          "flex",
          "flex-col",
          /* === Borde redondeado === */
          roundedClasses[rounded],
          /* === Variante === */
          variantClasses[variant],
          /* === Padding === */
          paddingClasses[padding],
          /* === Efecto hover === */
          hoverEffect !== "none" && hoverClasses[hoverEffect],
          /* === Estados interactivos === */
          interactive && cn(
            "cursor-pointer",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-origen-menta/20",
            "focus-visible:ring-offset-2"
          ),
          /* === Animación === */
          animationClasses,
          /* === Clases personalizadas === */
          className
        )}
        style={backgroundStyle}
        role={interactive ? "button" : "article"}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {/* === Overlay de imagen === */}
        {backgroundImage && overlay !== "none" && (
          <div
            className={cn(
              "absolute",
              "inset-0",
              roundedClasses[rounded],
              overlayClasses[overlay]
            )}
          />
        )}

        {/* === Contenido de la card === */}
        <div className={cn(
          "relative",
          "z-10",
          variant === "dark" && "text-white"
        )}>
          {children}
        </div>

        {/* === Elementos decorativos para variante organic === */}
        {variant === "organic" && (
          <>
            {/* Hoja bottom-right */}
            <div
              className={cn(
                "absolute",
                "-bottom-4",
                "-right-4",
                "h-16",
                "w-16",
                "text-origen-pradera/10",
                "rotate-12"
              )}
            >
              <Leaf className="h-full w-full" />
            </div>
            {/* Hoja top-left */}
            <div
              className={cn(
                "absolute",
                "-top-4",
                "-left-4",
                "h-12",
                "w-12",
                "text-origen-pradera/10",
                "-rotate-12"
              )}
            >
              <Sprout className="h-full w-full" />
            </div>
          </>
        )}

        {/* === Overlay hover para variante dark === */}
        {variant === "dark" && (
          <div
            className={cn(
              "absolute",
              "inset-0",
              "bg-gradient-to-t",
              "from-origen-oscuro/20",
              "to-transparent",
              "opacity-0",
              "hover:opacity-100",
              "transition-opacity",
              "duration-500",
              "rounded-[inherit]"
            )}
          />
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

// ============================================================================
// CARD HEADER
// ============================================================================

/**
 * CardHeader
 *
 * Cabecera de la card con título y descripción
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", spacing = "md", ...props }, ref) => {
    const spacingClasses = {
      sm: "space-y-1 mb-3",
      md: "space-y-1.5 mb-4",
      lg: "space-y-2 mb-5",
    };

    return (
      <div
        ref={ref}
        className={cn(
          /* === Layout === */
          "flex",
          "flex-col",
          /* === Espaciado === */
          spacingClasses[spacing],
          /* === Clases personalizadas === */
          className
        )}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

// ============================================================================
// CARD TITLE
// ============================================================================

/**
 * CardTitle
 *
 * Título de la card con tamaño variable
 */
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = "", size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "text-base sm:text-lg",
      md: "text-lg sm:text-xl",
      lg: "text-xl sm:text-2xl",
    };

    return (
      <h3
        ref={ref}
        className={cn(
          /* === Tipografía === */
          "font-bold",
          "leading-tight",
          "tracking-tight",
          /* === Color === */
          "text-origen-bosque",
          /* === Tamaño === */
          sizeClasses[size],
          /* === Clases personalizadas === */
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

// ============================================================================
// CARD DESCRIPTION
// ============================================================================

/**
 * CardDescription
 *
 * Descripción de la card con tamaño variable
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = "", size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "text-xs sm:text-sm",
      md: "text-sm sm:text-base",
      lg: "text-base sm:text-lg",
    };

    return (
      <p
        ref={ref}
        className={cn(
          /* === Tipografía === */
          "leading-relaxed",
          /* === Color === */
          "text-muted-foreground",
          /* === Tamaño === */
          sizeClasses[size],
          /* === Clases personalizadas === */
          className
        )}
        {...props}
      />
    );
  }
);

CardDescription.displayName = "CardDescription";

// ============================================================================
// CARD CONTENT
// ============================================================================

/**
 * CardContent
 *
 * Contenido principal de la card
 */
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", spacing = "md", ...props }, ref) => {
    const spacingClasses = {
      sm: "space-y-2",
      md: "space-y-3",
      lg: "space-y-4",
    };

    return (
      <div
        ref={ref}
        className={cn(
          /* === Layout === */
          "flex-1",
          /* === Espaciado === */
          spacingClasses[spacing],
          /* === Clases personalizadas === */
          className
        )}
        {...props}
      />
    );
  }
);

CardContent.displayName = "CardContent";

// ============================================================================
// CARD FOOTER
// ============================================================================

/**
 * CardFooter
 *
 * Pie de la card con alineación variable
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", spacing = "md", align = "left", ...props }, ref) => {
    const spacingClasses = {
      sm: "mt-3 pt-2",
      md: "mt-4 pt-3",
      lg: "mt-5 pt-4",
    };

    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    };

    return (
      <div
        ref={ref}
        className={cn(
          /* === Layout === */
          "flex",
          "items-center",
          /* === Borde superior === */
          "border-t",
          "border-origen-pradera/10",
          /* === Espaciado === */
          spacingClasses[spacing],
          /* === Alineación === */
          alignClasses[align],
          /* === Clases personalizadas === */
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

// ============================================================================
// FEATURE CARD (PREMIUM)
// ============================================================================

export interface FeatureCardProps extends Omit<CardProps, 'children'> {
  /**
   * Icono principal de la feature
   */
  icon: React.ReactNode;

  /**
   * Título de la feature
   */
  title: string;

  /**
   * Descripción de la feature
   */
  description: string;

  /**
   * Acción opcional (botón o link)
   */
  action?: React.ReactNode;

  /**
   * Color del icono
   */
  iconColor?: string;

  /**
   * Badge opcional (texto o número)
   */
  badge?: string | number;
}

/**
 * FeatureCard
 *
 * Card de feature con icono, título, descripción y acción opcional
 * Usa el patrón de hover "organic" (sombra + borde)
 */
const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({
    icon,
    title,
    description,
    action,
    badge,
    iconColor,
    variant = "elevated",
    interactive = true,
    padding = "lg",
    className = "",
    ...props
  }, ref) => {
    return (
      <Card
        ref={ref}
        variant={variant}
        interactive={interactive}
        hoverEffect="organic"
        padding={padding}
        className={cn("group relative", className)}
        {...props}
      >
        {/* === Badge opcional === */}
        {badge && (
          <div className="absolute top-4 right-4 z-20">
            <span className={cn(
              "inline-flex",
              "items-center",
              "justify-center",
              "px-2",
              "py-1",
              "text-xs",
              "font-semibold",
              "bg-origen-pradera",
              "text-white",
              "rounded-full"
            )}>
              {badge}
            </span>
          </div>
        )}

        {/* === Header con icono, título y descripción === */}
        <CardHeader spacing="lg">
          {/* Icono con hover effect */}
          <div
            className={cn(
              /* === Layout === */
              "mb-3",
              "sm:mb-4",
              "inline-flex",
              "h-10",
              "w-10",
              "sm:h-12",
              "sm:w-12",
              "items-center",
              "justify-center",
              /* === Borde === */
              "rounded-xl",
              /* === Fondo === */
              "bg-gradient-to-br",
              "from-origen-pradera/10",
              "to-origen-hoja/10",
              /* === Color === */
              "text-origen-hoja",
              /* === Estado hover === */
              "group-hover:scale-110",
              "group-hover:shadow-origen",
              /* === Transición === */
              "transition-all",
              "duration-300",
              /* === Clases personalizadas === */
              iconColor
            )}
          >
            {icon}
          </div>

          {/* Título con hover effect */}
          <CardTitle
            size="lg"
            className="group-hover:text-origen-pino transition-colors"
          >
            {title}
          </CardTitle>

          {/* Descripción */}
          <CardDescription size="md">
            {description}
          </CardDescription>
        </CardHeader>

        {/* === Footer con acción opcional === */}
        {action && (
          <CardFooter align="right" spacing="lg">
            {action}
          </CardFooter>
        )}

        {/* === Flecha indicadora en hover === */}
        <div
          className={cn(
            "absolute",
            "bottom-4",
            "right-4",
            "opacity-0",
            "group-hover:opacity-100",
            "transition-opacity",
            "duration-300"
          )}
        >
          <ArrowRight
            className={cn(
              "h-4",
              "w-4",
              "sm:h-5",
              "sm:w-5",
              "text-origen-pradera"
            )}
          />
        </div>
      </Card>
    );
  }
);

FeatureCard.displayName = "FeatureCard";

// ============================================================================
// STAT CARD (PREMIUM)
// ============================================================================

export interface StatCardProps extends Omit<CardProps, 'children'> {
  /**
   * Etiqueta de la estadística
   */
  label: string;

  /**
   * Valor de la estadística
   */
  value: string | number;

  /**
   * Tendencia opcional
   */
  trend?: {
    value: number;
    isPositive: boolean;
  };

  /**
   * Icono opcional
   */
  icon?: React.ReactNode;

  /**
   * Descripción opcional
   */
  description?: string;

  /**
   * Tamaño del valor
   * - sm: text-xl sm:text-2xl
   * - md: text-2xl sm:text-3xl
   * - lg: text-3xl sm:text-4xl
   */
  valueSize?: "sm" | "md" | "lg";
}

/**
 * StatCard
 *
 * Card de estadística con label, valor, trend opcional e icono
 * Usa el patrón de hover con barra inferior animada
 */
const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({
    label,
    value,
    trend,
    icon,
    description,
    valueSize = "lg",
    variant = "elevated",
    padding = "lg",
    className = "",
    ...props
  }, ref) => {
    const valueSizeClasses = {
      sm: "text-xl sm:text-2xl",
      md: "text-2xl sm:text-3xl",
      lg: "text-3xl sm:text-4xl",
    };

    return (
      <Card
        ref={ref}
        variant={variant}
        padding={padding}
        className={cn("relative overflow-hidden group", className)}
        {...props}
      >
        <CardContent spacing="lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* === Contenido principal: label, valor, trend === */}
            <div className="space-y-2">
              {/* Label */}
              <p className={cn(
                "text-xs",
                "sm:text-sm",
                "font-medium",
                "text-origen-hoja",
                "uppercase",
                "tracking-wider"
              )}>
                {label}
              </p>

              {/* Valor */}
              <p className={cn(
                "font-bold",
                "text-origen-bosque",
                valueSizeClasses[valueSize]
              )}>
                {value}
              </p>

              {/* Trend opcional */}
              {trend && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      "text-xs",
                      "font-semibold",
                      "px-2",
                      "py-0.5",
                      "rounded-full",
                      trend.isPositive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-xs text-text-subtle">vs mes anterior</span>
                </div>
              )}

              {/* Descripción opcional */}
              {description && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            {/* === Icono opcional === */}
            {icon && (
              <div className={cn(
                /* === Layout === */
                "p-2",
                "sm:p-3",
                "rounded-xl",
                "self-start",
                /* === Fondo === */
                "bg-gradient-to-br",
                "from-origen-pradera/10",
                "to-origen-hoja/10",
                /* === Color === */
                "text-origen-pradera",
                /* === Estado hover === */
                "group-hover:scale-110",
                "group-hover:rotate-3",
                /* === Transición === */
                "transition-all",
                "duration-300"
              )}>
                {icon}
              </div>
            )}
          </div>
        </CardContent>

        {/* === Barra inferior animada en hover === */}
        <div
          className={cn(
            "absolute",
            "bottom-0",
            "left-0",
            "right-0",
            "h-1",
            "bg-gradient-to-r",
            "from-origen-pradera",
            "to-origen-hoja",
            "transform",
            "scale-x-0",
            "group-hover:scale-x-100",
            "transition-transform",
            "duration-500"
          )}
        />
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

// ============================================================================
// PRODUCT CARD (PREMIUM)
// ============================================================================

export interface ProductCardProps extends Omit<CardProps, 'children'> {
  /**
   * Imagen del producto
   */
  image: string;

  /**
   * Nombre del producto
   */
  name: string;

  /**
   * Precio actual
   */
  price: string | number;

  /**
   * Precio original (para mostrar descuento)
   */
  originalPrice?: string | number;

  /**
   * Productor
   */
  producer?: string;

  /**
   * Rating (0-5)
   */
  rating?: number;

  /**
   * Número de reviews
   */
  reviewCount?: number;

  /**
   * Badges opcionales
   */
  badges?: React.ReactNode[];

  /**
   * Handler para añadir al carrito
   */
  onAddToCart?: () => void;

  /**
   * Handler para vista rápida
   */
  onQuickView?: () => void;
}

/**
 * ProductCard
 *
 * Card de producto con imagen, nombre, precio, rating y acciones
 * Usa el patrón de hover "lift" con botón de vista rápida
 */
const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({
    image,
    name,
    price,
    originalPrice,
    producer,
    rating = 0,
    reviewCount,
    badges,
    onAddToCart,
    onQuickView,
    variant = "elevated",
    interactive = true,
    padding = "none",
    className = "",
    ...props
  }, ref) => {
    // Calcular descuento si hay precio original
    const discount = originalPrice
      ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
      : 0;

    return (
      <Card
        ref={ref}
        variant={variant}
        interactive={interactive}
        hoverEffect="lift"
        padding={padding}
        className={cn("group overflow-hidden", className)}
        {...props}
      >
        {/* === Imagen del producto === */}
        <div className="relative aspect-square overflow-hidden bg-origen-pastel">
          <img
            src={image}
            alt={name}
            className={cn(
              "h-full",
              "w-full",
              "object-cover",
              "transition-transform",
              "duration-700",
              "group-hover:scale-110"
            )}
          />

          {/* === Overlay gradient === */}
          <div
            className={cn(
              "absolute",
              "inset-0",
              "bg-gradient-to-t",
              "from-origen-oscuro/60",
              "via-origen-oscuro/20",
              "to-transparent",
              "opacity-0",
              "group-hover:opacity-100",
              "transition-opacity",
              "duration-300"
            )}
          />

          {/* === Badges === */}
          {badges && badges.length > 0 && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1.5 z-10">
              {badges}
            </div>
          )}

          {/* === Badge de descuento === */}
          {discount > 0 && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
              <span className={cn(
                "inline-flex",
                "items-center",
                "justify-center",
                "px-2",
                "py-1",
                "text-xs",
                "font-bold",
                "bg-red-500",
                "text-white",
                "rounded-full"
              )}>
                -{discount}%
              </span>
            </div>
          )}

          {/* === Botón de vista rápida (mobile/tablet) === */}
          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView();
              }}
              className={cn(
                "absolute",
                "inset-x-0",
                "bottom-0",
                "translate-y-full",
                "group-hover:translate-y-0",
                "transition-transform",
                "duration-300",
                "bg-origen-bosque/90",
                "text-white",
                "py-2",
                "text-sm",
                "font-medium",
                "backdrop-blur-sm"
              )}
            >
              Vista rápida
            </button>
          )}
        </div>

        {/* === Contenido del producto === */}
        <CardContent spacing="md" className="p-3 sm:p-4">
          {/* Productor */}
          {producer && (
            <p className={cn(
              "text-xs",
              "sm:text-sm",
              "text-origen-hoja",
              "mb-1",
              "truncate"
            )}>
              {producer}
            </p>
          )}

          {/* Nombre del producto */}
          <CardTitle size="sm" className="mb-1 line-clamp-2 min-h-[2.5rem]">
            {name}
          </CardTitle>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {/* Estrellas */}
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3",
                      "w-3",
                      "sm:h-4",
                      "sm:w-4",
                      i < Math.floor(rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-border"
                    )}
                  />
                ))}
              </div>
              {/* Número de reviews */}
              {reviewCount !== undefined && (
                <span className="text-xs text-text-subtle">({reviewCount})</span>
              )}
            </div>
          )}

          {/* Precio y botón añadir al carrito */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-2">
              {/* Precio actual */}
              <span className={cn(
                "text-lg",
                "sm:text-xl",
                "font-bold",
                "text-origen-bosque"
              )}>
                {typeof price === 'number' ? `${price.toFixed(2)}€` : price}
              </span>
              {/* Precio original (tachado) */}
              {originalPrice && (
                <span className={cn(
                  "text-xs",
                  "sm:text-sm",
                  "text-text-disabled",
                  "line-through"
                )}>
                  {typeof originalPrice === 'number' ? `${originalPrice.toFixed(2)}€` : originalPrice}
                </span>
              )}
            </div>

            {/* Botón añadir al carrito */}
            {onAddToCart && (
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                className={cn(
                  "opacity-0",
                  "group-hover:opacity-100",
                  "transition-opacity",
                  "duration-300"
                )}
                aria-label="Añadir al carrito"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

ProductCard.displayName = "ProductCard";

// ============================================================================
// EXPORT
// ============================================================================

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  FeatureCard,
  StatCard,
  ProductCard
};
