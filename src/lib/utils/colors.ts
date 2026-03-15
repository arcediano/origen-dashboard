/**
 * @file colors.ts
 * @description Constantes de colores y estados para componentes UI
 * @package @origen/ui/utils
 */

// ============================================================================
// ESTADOS DE ERROR CONSISTENTES
// ============================================================================

export const errorStates = {
  /** Fondo para errores */
  bg: 'bg-red-50',
  /** Borde suave para errores */
  border: 'border-red-200',
  /** Borde fuerte para errores */
  borderStrong: 'border-red-500',
  /** Borde en hover para errores */
  borderHover: 'hover:border-red-600',
  /** Texto principal de error */
  text: 'text-red-900',
  /** Texto de error secundario/mensaje */
  textSecondary: 'text-red-600',
  /** Color de icono de error */
  icon: 'text-red-600',
  /** Anillo de focus para error */
  ring: 'ring-red-200',
  /** Anillo de focus fuerte para error */
  ringStrong: 'ring-red-500',
} as const;

// ============================================================================
// ESTADOS DE ÉXITO
// ============================================================================

export const successStates = {
  bg: 'bg-green-50',
  border: 'border-green-200',
  borderStrong: 'border-green-500',
  borderHover: 'hover:border-green-600',
  text: 'text-green-900',
  textSecondary: 'text-green-600',
  icon: 'text-green-600',
  ring: 'ring-green-200',
  ringStrong: 'ring-green-500',
} as const;

// ============================================================================
// ESTADOS DE ADVERTENCIA
// ============================================================================

export const warningStates = {
  bg: 'bg-amber-50',
  border: 'border-amber-200',
  borderStrong: 'border-amber-500',
  borderHover: 'hover:border-amber-600',
  text: 'text-amber-900',
  textSecondary: 'text-amber-600',
  icon: 'text-amber-600',
  ring: 'ring-amber-200',
  ringStrong: 'ring-amber-500',
} as const;

// ============================================================================
// ESTADOS DE INFORMACIÓN
// ============================================================================

export const infoStates = {
  bg: 'bg-blue-50',
  border: 'border-blue-200',
  borderStrong: 'border-blue-500',
  borderHover: 'hover:border-blue-600',
  text: 'text-blue-900',
  textSecondary: 'text-blue-600',
  icon: 'text-blue-600',
  ring: 'ring-blue-200',
  ringStrong: 'ring-blue-500',
} as const;

// ============================================================================
// PALETA ORIGEN - Accesos directos a tokens de marca
// ============================================================================

export const origenColors = {
  bosque: {
    hex: '#1B2A4B',
    hsl: '221 47% 20%',
    bg: 'bg-origen-bosque',
    text: 'text-origen-bosque',
    border: 'border-origen-bosque',
  },
  pino: {
    hex: '#2E4A6E',
    hsl: '214 41% 31%',
    bg: 'bg-origen-pino',
    text: 'text-origen-pino',
    border: 'border-origen-pino',
  },
  hoja: {
    hex: '#4E7456',
    hsl: '133 20% 38%',
    bg: 'bg-origen-hoja',
    text: 'text-origen-hoja',
    border: 'border-origen-hoja',
  },
  pradera: {
    hex: '#6B90B8',
    hsl: '211 35% 57%',
    bg: 'bg-origen-pradera',
    text: 'text-origen-pradera',
    border: 'border-origen-pradera',
  },
  menta: {
    hex: '#C89B4C',
    hsl: '39 53% 54%',
    bg: 'bg-origen-menta',
    text: 'text-origen-menta',
    border: 'border-origen-menta',
  },
  crema: {
    hex: '#F8F9FC',
    hsl: '228 38% 98%',
    bg: 'bg-origen-crema',
    text: 'text-origen-crema',
    border: 'border-origen-crema',
  },
  pastel: {
    hex: '#E8EEF5',
    hsl: '213 38% 94%',
    bg: 'bg-origen-pastel',
    text: 'text-origen-pastel',
    border: 'border-origen-pastel',
  },
  oscuro: {
    hex: '#0D1626',
    hsl: '221 49% 10%',
    bg: 'bg-origen-oscuro',
    text: 'text-origen-oscuro',
    border: 'border-origen-oscuro',
  },
} as const;

// ============================================================================
// CLASES DE UTILIDAD COMUNES
// ============================================================================

export const commonStates = {
  disabled: 'opacity-50 cursor-not-allowed disabled:cursor-not-allowed disabled:opacity-50',
  focusOutline: 'focus:outline-none focus:ring-2 focus:ring-origen-pradera/50',
  transition: 'transition-all duration-200 ease-in-out',
} as const;

// ============================================================================
// SOMBRAS ORIGEN
// ============================================================================

export const origenShadows = {
  subtle: 'shadow-subtle',
  default: 'shadow-origen',
  large: 'shadow-origen-lg',
  mentaGlow: 'shadow-menta-glow',
  mentaGlowLg: 'shadow-menta-glow-lg',
} as const;

// ============================================================================
// BORDER RADIUS ORIGEN
// ============================================================================

export const origenRadius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
} as const;

// ============================================================================
// TIPOGRAFÍA ORIGEN
// ============================================================================

export const origenTypography = {
  heading: 'font-serif',
  body: 'font-sans',
} as const;

export const origenFontSizes = {
  h1: 'text-2xl sm:text-3xl lg:text-4xl',
  h2: 'text-xl sm:text-2xl lg:text-3xl',
  h3: 'text-lg sm:text-xl lg:text-2xl',
  body: 'text-sm sm:text-base',
  small: 'text-xs sm:text-sm',
  caption: 'text-[10px] sm:text-xs',
} as const;

// ============================================================================
// EXPORTACIONES
// ============================================================================

export type ErrorStatesType = typeof errorStates;
export type SuccessStatesType = typeof successStates;
export type WarningStatesType = typeof warningStates;
export type InfoStatesType = typeof infoStates;
export type OrigenColorsType = typeof origenColors;
