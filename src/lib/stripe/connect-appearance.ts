/**
 * Configuración de theming para Stripe Connect Embedded Components
 *
 * Este archivo centraliza el objeto `appearance` (variables de theming) y
 * la configuración de fuentes para conectar una sola instancia de
 * StripeConnectInstance en todo `origen-dashboard`.
 *
 * Los valores vienen de la guía de marca Origen v6 y están mapeados 1:1
 * a las variables soportadas por Connect.js según su documentación oficial.
 */

export const stripeConnectAppearance = {
  overlays: 'drawer' as const,
  variables: {
    fontFamily: 'Manrope, "Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif',
    fontSizeBase: '16px',
    spacingUnit: '8px',
    borderRadius: '12px',
    colorPrimary: '#215943',
    colorBackground: '#FFFFFF',
    colorText: '#11271F',
    colorDanger: '#ef4444',

    buttonPrimaryColorBackground: '#215943',
    buttonPrimaryColorBorder: '#215943',
    buttonPrimaryColorText: '#FFFFFF',
    buttonSecondaryColorBackground: '#FFFFFF',
    buttonSecondaryColorBorder: 'hsl(156, 26%, 86%)',
    buttonSecondaryColorText: '#215943',
    buttonDangerColorBackground: '#fef2f2',
    buttonDangerColorBorder: 'rgba(239,68,68,0.55)',
    buttonDangerColorText: '#b91c1c',
    buttonBorderRadius: '12px',
    buttonPaddingX: '20px',
    buttonPaddingY: '12px',
    buttonLabelFontSize: '14px',
    buttonLabelFontWeight: '600',
    buttonLabelTextTransform: 'none',

    colorSecondaryText: 'hsl(158, 15%, 32%)',
    actionPrimaryColorText: '#2E7355',
    actionPrimaryTextDecorationLine: 'underline',
    actionPrimaryTextDecorationColor: '#2E7355',
    actionSecondaryColorText: 'hsl(158, 15%, 32%)',

    formBorderRadius: '12px',
    formHighlightColorBorder: 'hsl(156, 49%, 63%)',
    formAccentColor: '#215943',
    formPlaceholderTextColor: 'hsl(156, 12%, 62%)',
    colorBorder: 'hsl(156, 26%, 86%)',
    inputFieldPaddingX: '16px',
    inputFieldPaddingY: '12px',

    badgeSuccessColorBackground: '#f0fdf4',
    badgeSuccessColorText: '#14532d',
    badgeSuccessColorBorder: '#15803d',
    badgeWarningColorBackground: '#fffbeb',
    badgeWarningColorText: '#78350f',
    badgeWarningColorBorder: '#b45309',
    badgeDangerColorBackground: '#fef2f2',
    badgeDangerColorText: '#7f1d1d',
    badgeDangerColorBorder: '#b91c1c',
    badgeNeutralColorBackground: '#f3f4f6',
    badgeNeutralColorText: '#374151',
    badgeNeutralColorBorder: '#9ca3af',
    badgeBorderRadius: '999px',

    overlayBorderRadius: '16px',
    overlayBackdropColor: 'rgba(17, 39, 31, 0.4)',
  },
} as const;

/**
 * Configuración de fuentes para Stripe Connect.
 *
 * Connect.js no hereda de `next/font` (self-hosted), así que requiere
 * una URL explícita a Google Fonts para Manrope.
 *
 * Esta es una dependencia de red externa acotada a los componentes embebidos
 * de Connect.js, no afecta al resto de la app.
 */
export const stripeConnectFonts = [
  {
    cssSrc: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap',
  },
];
