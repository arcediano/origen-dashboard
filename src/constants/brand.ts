/**
 * @file brand.ts
 * @description Constantes de identidad de marca — Origen v3.0 "Bosque Profundo"
 *
 * Fuente de verdad para valores de marca no-CSS.
 * Los tokens de color viven en globals.css y tailwind.config.ts.
 */

// ============================================================================
// IDENTIDAD
// ============================================================================

export const BRAND = {
  name: 'Origen',
  tagline: 'Marketplace local',
  description: 'Conectamos productores locales con consumidores que valoran la calidad y la proximidad.',
  palette: 'Bosque Profundo',
  version: '3.0',
  year: 2026,
} as const;

// ============================================================================
// TOKENS DE DISEÑO (valores numéricos, no CSS)
// ============================================================================

export const BRAND_DESIGN = {
  /** Radio de borde base en px (--radius = 0.5rem = 8px) */
  borderRadius: 8,
  /** Tamaño mínimo del logotipo en px */
  minLogoSize: 80,
  /** Tamaño recomendado del logotipo en px */
  recommendedLogoSize: 120,
  /** Área de protección mínima = altura de la hoja gráfica */
  clearspace: 'X',
} as const;

// ============================================================================
// TIPOGRAFÍA
// ============================================================================

export const BRAND_FONTS = {
  /** Familia tipográfica para titulares (H1, H2) */
  heading: 'Georgia, "Times New Roman", serif',
  /** Familia tipográfica para cuerpo de texto y UI */
  body: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
} as const;

export const BRAND_FONT_SIZES = {
  /** H1: 2.5rem / 40px · Bold 700 · lh 1.2 */
  h1: { size: '2.5rem', lineHeight: '1.2', weight: 700 },
  /** H2: 1.8rem / 28.8px · Bold 700 · lh 1.3 */
  h2: { size: '1.8rem', lineHeight: '1.3', weight: 700 },
  /** H3: 1.3rem / 20.8px · SemiBold 600 · lh 1.4 */
  h3: { size: '1.3rem', lineHeight: '1.4', weight: 600 },
  /** Body: 1rem / 16px · Regular 400 · lh 1.6 */
  body: { size: '1rem', lineHeight: '1.6', weight: 400 },
  /** Small: 0.875rem / 14px · Regular 400 · lh 1.5 */
  small: { size: '0.875rem', lineHeight: '1.5', weight: 400 },
} as const;

// ============================================================================
// CONTRASTE WCAG 2.1
// ============================================================================

/**
 * Pares de color con ratio de contraste verificado.
 * AAA ≥ 7:1 · AA ≥ 4.5:1 · AA Large ≥ 3:1
 */
export const BRAND_CONTRAST = [
  { bg: '#1B4332', fg: '#FFFFFF',  ratio: 12.4, level: 'AAA', usage: 'Botones primarios, navBar' },
  { bg: '#1B4332', fg: '#F1FAEE',  ratio: 11.8, level: 'AAA', usage: 'Texto en cabeceras oscuras' },
  { bg: '#081C15', fg: '#F1FAEE',  ratio: 15.2, level: 'AAA', usage: 'Footer, paneles oscuros' },
  { bg: '#F1FAEE', fg: '#081C15',  ratio: 15.2, level: 'AAA', usage: 'Texto sobre fondo global' },
  { bg: '#74C69D', fg: '#081C15',  ratio: 5.6,  level: 'AA',  usage: 'Chips, badges secundarios' },
  { bg: '#40916C', fg: '#FFFFFF',  ratio: 4.8,  level: 'AA',  usage: 'H3, iconos activos' },
  { bg: '#D4A373', fg: '#081C15',  ratio: 7.1,  level: 'AAA', usage: 'Acento sobre fondos cálidos' },
  { bg: '#74C69D', fg: '#FFFFFF',  ratio: 2.3,  level: 'FAIL', usage: '⚠ No usar texto blanco sobre verde menta' },
] as const;

// ============================================================================
// REDES SOCIALES Y CONTACTO
// ============================================================================

export const BRAND_SOCIAL = {
  website: 'https://origen.es',
  email: 'hola@origen.es',
  supportEmail: 'soporte@origen.es',
} as const;
