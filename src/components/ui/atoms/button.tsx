/**
 * @file button.tsx
 * @description Componente Button con sistema de estados unificado
 * @version 3.0.0 - Actualizado para paleta "Bosque Profundo"
 *
 * @component Button
 *
 * Estados definidos:
 * - default: Estado reposo (sin interacción)
 * - hover: Estado sobre elemento (mouse over)
 * - active: Estado clic activado (scale 0.98)
 * - focus: Estado con foco de teclado (ring origen-menta/20)
 * - disabled: Estado desactivado (opacity 50%, no pointer events)
 * - loading: Estado de carga (spinner + texto)
 *
 * Variantes disponibles:
 * - primary: Fondo origen-bosque, texto blanco
 * - secondary: Fondo origen-pastel, texto origen-bosque
 * - outline: Transparente con borde origen-hoja
 * - ghost: Transparente, hover origen-pastel
 * - destructive: Rojo para acciones destructivas
 *
 * Tamaños disponibles:
 * - xs: Pequeño (h-7, text-xs)
 * - sm: Estándar (h-9, text-sm)
 * - md: Mediano (h-10, text-sm)
 * - lg: Grande (h-11, text-base)
 * - icon: Solo icono (h-10)
 * - icon-sm: Icono pequeño (h-8)
 *
 * @example
 * <Button variant="primary" size="md" loading={isLoading}>
 *   Guardar cambios
 * </Button>
 *
 * @example
 * <Button
 *   variant="secondary"
 *   leftIcon={<ArrowLeft />}
 *   rightIcon={<ArrowRight />}
 * >
 *   Continuar
 * </Button>
 */

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Variantes de botón con estados definidos
 */
const buttonVariants = cva(
  // Clases base aplicadas a todas las variantes
  cn(
    /* === Layout === */
    "inline-flex items-center justify-center",
    /* === Dimensiones y borde === */
    "rounded-xl",
    /* === Tipografía === */
    "font-semibold",
    /* === Transición === */
    "transition-all duration-300",
    /* === Estados === */
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-origen-menta/20",
    "disabled:pointer-events-none",
    "disabled:opacity-50",
    "active:scale-[0.98]",
    /* === Responsive === */
    "w-full sm:w-auto"
  ),
  {
    variants: {
      /**
       * Variantes de color
       * Define fondo, texto, borde y hover para cada tipo
       */
      variant: {
        /**
         * Primary - Botón principal
         * Estado default: bg-origen-bosque, text-white
         * Estado hover: bg-origen-pino
         * Uso: CTAs principales, acciones confirmadas
         */
        primary: cn(
          /* === Estado default === */
          "bg-origen-bosque",
          "text-white",
          "border",
          "border-origen-bosque",
          "shadow-md",
          /* === Estado hover === */
          "hover:bg-origen-pino",
          "hover:shadow-origen",
          "hover:border-origen-pino",
          /* === Estado focus === */
          "focus-visible:ring-origen-menta/40"
        ),

        /**
         * Secondary - Botón secundario
         * Estado default: bg-origen-pastel, text-origen-bosque
         * Estado hover: bg-origen-pradera
         * Uso: Acciones alternativas, botones cancelar
         */
        secondary: cn(
          /* === Estado default === */
          "bg-origen-pastel",
          "text-origen-bosque",
          "border",
          "border-origen-pradera/30",
          /* === Estado hover === */
          "hover:bg-origen-pradera",
          "hover:shadow-subtle",
          /* === Estado focus === */
          "focus-visible:ring-origen-pradera/40"
        ),

        /**
         * Outline - Botón con borde
         * Estado default: transparent, text-origen-hoja, border-origen-hoja
         * Estado hover: bg-origen-hoja/10
         * Uso: Acciones secundarias destacadas
         */
        outline: cn(
          /* === Estado default === */
          "bg-transparent",
          "text-origen-hoja",
          "border-2",
          "border-origen-hoja",
          /* === Estado hover === */
          "hover:bg-origen-hoja/10",
          "hover:border-origen-hoja",
          /* === Estado focus === */
          "focus-visible:ring-origen-hoja/30"
        ),

        /**
         * Ghost - Botón fantasma
         * Estado default: transparent, text-origen-bosque
         * Estado hover: bg-origen-pastel
         * Uso: Acciones sutiles, botones de acción en cards
         */
        ghost: cn(
          /* === Estado default === */
          "bg-transparent",
          "text-origen-bosque",
          /* === Estado hover === */
          "hover:bg-origen-pastel",
          "hover:text-origen-pino",
          /* === Estado focus === */
          "focus-visible:ring-origen-pastel/40"
        ),

        /**
         * Link - Texto con apariencia de enlace
         * Estado default: transparent, text-origen-pradera
         * Estado hover: text-origen-bosque, underline
         * Uso: Acciones secundarias inline, enlaces contextuales
         */
        link: cn(
          /* === Estado default === */
          "bg-transparent",
          "text-origen-pradera",
          "underline-offset-4",
          "h-auto p-0",
          /* === Estado hover === */
          "hover:text-origen-bosque",
          "hover:underline",
          /* === Estado focus === */
          "focus-visible:ring-origen-pradera/30"
        ),

        /**
         * Destructive - Botón destructivo
         * Estado default: bg-red-600, text-white
         * Estado hover: bg-red-700
         * Uso: Borrar, eliminar, acciones irreversibles
         */
        destructive: cn(
          /* === Estado default === */
          "bg-red-600",
          "text-white",
          "border",
          "border-red-600",
          "shadow-md",
          /* === Estado hover === */
          "hover:bg-red-700",
          "hover:shadow-lg",
          /* === Estado focus === */
          "focus-visible:ring-red-500/40"
        ),
      },

      /**
       * Tamaños de botón
       * Define altura, padding y tamaño de texto
       */
      size: {
        /**
         * Extra small - Muy pequeño
         * Uso: Botones compactos en tablas, listas
         */
        xs: cn(
          "h-7",
          "px-2",
          "text-xs",
          "gap-1.5",
          "rounded-md"
        ),

        /**
         * Small - Pequeño
         * Uso: Botones estándar en formularios
         */
        sm: cn(
          "h-9",
          "px-4",
          "text-sm",
          "gap-2",
          "rounded-lg"
        ),

        /**
         * Medium - Mediano (default)
         * Uso: Botones principales, CTAs
         */
        md: cn(
          "h-10",
          "px-5",
          "text-sm",
          "gap-2.5",
          "rounded-xl"
        ),

        /**
         * Large - Grande
         * Uso: CTAs destacados en landing pages
         */
        lg: cn(
          "h-11",
          "px-6",
          "text-base",
          "gap-3",
          "rounded-xl"
        ),

        /**
         * Icon - Solo icono
         * Uso: Botones de acción en toolbars
         */
        icon: cn(
          "h-10",
          "w-10",
          "p-0",
          "rounded-xl"
        ),

        /**
         * Icon small - Icono pequeño
         * Uso: Botones compactos en headers
         */
        "icon-sm": cn(
          "h-8",
          "w-8",
          "p-0",
          "rounded-lg"
        ),
      },
    },

    /**
     * Valores por defecto
     */
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Estado de carga
   * Muestra spinner y deshabilita el botón
   */
  loading?: boolean;

  /**
   * Icono a la izquierda del texto
   */
  leftIcon?: React.ReactNode;

  /**
   * Icono a la derecha del texto
   */
  rightIcon?: React.ReactNode;

  /**
   * Texto a mostrar durante la carga
   * @default "Cargando..."
   */
  loadingText?: string;
}

/**
 * Componente Button
 *
 * @example
 * // Botón primario con carga
 * <Button variant="primary" loading={isLoading} onClick={handleSave}>
 *   Guardar cambios
 * </Button>
 *
 * @example
 * // Botón secundario con iconos
 * <Button
 *   variant="secondary"
 *   leftIcon={<ArrowLeft />}
 *   rightIcon={<ArrowRight />}
 * >
 *   Continuar
 * </Button>
 *
 * @example
 * // Botón outline
 * <Button variant="outline" size="lg">
 *   Ver detalles
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      loadingText = "Cargando...",
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        type={type}
        {...props}
      >
        {loading ? (
          <>
            {/* Spinner de carga */}
            <Loader2 className="h-4 w-4 animate-spin" />
            {/* Texto de carga */}
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            {/* Icono izquierdo (si existe) */}
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {/* Texto del botón */}
            <span>{children}</span>
            {/* Icono derecho (si existe) */}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
