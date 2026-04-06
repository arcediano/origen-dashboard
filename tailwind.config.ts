import type { Config } from "tailwindcss";

/**
 * Configuración de Tailwind CSS para Origen
 * Basado en el Manual de Marca v3.0 - Paleta "Bosque Profundo"
 *
 * @version 3.0.0 - NUEVA PALETA:
 *   origen-bosque    #1B4332  Verde Bosque    → Principal
 *   origen-pino     #2D6A4F  Verde Pino      → H2 / hover
 *   origen-hoja     #40916C  Verde Esmeralda → H3 / enlaces
 *   origen-pradera  #74C69D  Verde Menta     → Interactivo
 *   origen-menta    #D4A373  Beige Arena     → Acento cálido
 *   origen-mandarina #FFB347  Naranja         → Acento complementario
 *   origen-crema    #F1FAEE  Blanco Verdeado → Fondo global
 *   origen-oscuro   #081C15  Verde Negro     → Texto principal
 *   origen-pastel   #D8F3DC  Verde Pastel    → Fondos suaves
 *   surface.*                Semántico       → Sustituye bg-white/bg-gray
 *   border-subtle/strong     Semántico       → Sustituye border-gray-*
 *   text-subtle/disabled     Semántico       → Sustituye text-gray-*
 *
 * @created Febrero 2026
 * @updated Marzo 2026
 * @author Equipo de Diseño Origen
 */

const config: Config = {
  darkMode: ["class"],
  
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
      "./node_modules/@arcediano/ux-library/dist/**/*.{js,mjs}",
    ],
  
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    
    // === BREAKPOINTS MOBILE-FIRST (ACTUALIZADO v1.4) ===
    screens: {
      'xs': '475px',      // Móviles grandes
      'sm': '640px',      // Tablets pequeñas
      'md': '768px',      // Tablets
      'tablet': '768px',  // Alias semántico
      'lg': '1024px',     // Desktop
      'desktop': '1024px', // Alias semántico
      'xl': '1280px',     // Desktop grande
      '2xl': '1400px',    // Desktop extra grande
    },
    
    extend: {
      // === PALETA DE COLORES OFICIAL - ORIGEN v3.0 "BOSQUE PROFUNDO" ===
      colors: {
        // Colores principales - Manual Sección 3.1
        origen: {
          // Primarios
          bosque: "hsl(var(--bosque))",      // #1B4332 - Verde Bosque
          pino: "hsl(var(--pino))",          // #2D6A4F - Verde Pino
          hoja: "hsl(var(--hoja))",          // #40916C - Verde Esmeralda
          pradera: "hsl(var(--pradera))",    // #74C69D - Verde Menta
          crema: "hsl(var(--crema))",        // #F1FAEE - Blanco Verdeado

          // Apoyo
          oscuro: "hsl(var(--oscuro))",      // #081C15 - Verde Negro
          pastel: "hsl(var(--pastel))",      // #D8F3DC - Verde Pastel
          mandarina: "hsl(var(--mandarina))", // #FFB347 - Naranja Mandarina
        },

        // Estados hover
        hover: {
          bosque:    "hsl(var(--hover-bosque))",   // #0D2B1D
          pradera:   "hsl(var(--hover-pradera))",  // #5BB580
          menta:     "hsl(var(--hover-menta))",    // #C4905D
          mandarina: "hsl(34 100% 60%)",           // #E6A040
        },

        // Tokens semánticos — sustitutos directos de gray-* de Tailwind
        surface: {
          DEFAULT: "hsl(var(--surface))",          // Fondo de página
          alt:     "hsl(var(--surface-alt))",      // Fondo de tarjetas
          raised:  "hsl(var(--surface-raised))",   // Modales / popovers
        },
        "border-subtle": "hsl(var(--border-subtle))",
        "border-strong":  "hsl(var(--border-strong))",
        "text-subtle":    "hsl(var(--text-subtle))",
        "text-disabled":  "hsl(var(--text-disabled))",

        // Tokens de feedback (estándar en todos los proyectos — BRAND-T2 Sprint 17)
        feedback: {
          "success":        "hsl(var(--hoja))",
          "success-subtle": "hsl(var(--pastel))",
          "success-text":   "hsl(var(--hoja))",
          "danger":         "#ef4444",
          "danger-subtle":  "#fef2f2",
          "danger-text":    "#b91c1c",
          "warning-subtle": "#fffbeb",
        },

        // Variables del sistema (shadcn/ui)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      
      // === BORDES REDONDEADOS ===
      borderRadius: {
        lg: "var(--radius)",      // 8px
        md: "calc(var(--radius) - 2px)", // 6px
        sm: "calc(var(--radius) - 4px)", // 4px
      },
      
      // === TIPOGRAFÍA ===
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "Helvetica Neue", "Helvetica", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      
      fontSize: {
        // Jerarquía según manual Sección 4.2
        "h1": ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],   // 40px
        "h2": ["1.8rem", { lineHeight: "1.3", fontWeight: "700" }],   // 28.8px
        "h3": ["1.3rem", { lineHeight: "1.4", fontWeight: "600" }],   // 20.8px
        "body": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],   // 16px
        "small": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }], // 14px
          "micro": ["0.6875rem", { lineHeight: "1.4", fontWeight: "500" }], // 11px — UXLibrary compat
      },
      
      // === ESPACIADO ===
      spacing: {
        '18': '4.5rem',     // 72px
        '22': '5.5rem',     // 88px
        '26': '6.5rem',     // 104px
        '30': '7.5rem',     // 120px
      },
      
      // === SOMBRAS ===
      boxShadow: {
        'origen': '0 4px 20px hsla(var(--bosque) / 0.1)',
        'origen-lg': '0 10px 40px hsla(var(--bosque) / 0.15)',
        'origen-inner': 'inset 0 2px 4px hsla(var(--bosque) / 0.06)',
        'subtle': '0 2px 8px hsla(var(--bosque) / 0.08)',
        'card-hover': '0 20px 30px hsla(var(--bosque) / 0.15)',
        'menta-glow': '0 0 8px hsl(var(--menta))',
        'menta-glow-lg': '0 2px 8px hsla(var(--menta) / 0.4)',
      },
      
      // === ANIMACIONES (ACTUALIZADO v1.4) ===
      keyframes: {
        // Float & existentes
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'card-hover': {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-5px)' },
        },
        'gradient-shift': {
          '0%': { opacity: '0', transform: 'scale(1)' },
          '100%': { opacity: '1', transform: 'scale(1.02)' },
        },
        // Accordion
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Sheet / drawer
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-out-to-bottom': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        // Fade — BRAND-T3 Sprint 17
        'fade-in':      { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out':     { from: { opacity: '1' }, to: { opacity: '0' } },
        // Scale
        'scale-in':  { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'scale-out': { from: { opacity: '1', transform: 'scale(1)' },   to: { opacity: '0', transform: 'scale(0.95)' } },
        // Slide
        'slide-up':   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-down': { from: { opacity: '1', transform: 'translateY(0)' },    to: { opacity: '0', transform: 'translateY(12px)' } },
        // Bounce
        'bounce-gentle': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
        // Pulse glow
        'pulse-glow':    { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        'pulse-gentle':  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        // Shimmer
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        // Marquee
        marquee: { '0%': { transform: 'translateX(0%)' }, '100%': { transform: 'translateX(-50%)' } },
      },

      animation: {
        float:              'float 3s ease-in-out infinite',
        'pulse-slow':       'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'card-hover':       'card-hover 0.3s ease-out forwards',
        'gradient-shift':   'gradient-shift 0.3s ease-out',
        'accordion-down':   'accordion-down 0.2s ease-out',
        'accordion-up':     'accordion-up 0.2s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-out-to-bottom':  'slide-out-to-bottom 0.3s ease-out',
        // BRAND-T3 Sprint 17
        'fade-in':          'fade-in 0.3s ease-out forwards',
        'fade-in-slow':     'fade-in 0.5s ease-out forwards',
        'fade-in-sm':       'fade-in 0.2s ease-out forwards',
        'fade-out':         'fade-out 0.2s ease-out forwards',
        'scale-in':         'scale-in 0.25s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'scale-out':        'scale-out 0.2s ease-in forwards',
        'slide-up':         'slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up-slow':    'slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-down':       'slide-down 0.25s ease-in forwards',
        'bounce-gentle':    'bounce-gentle 0.5s ease-in-out 1',
        'pulse-glow':       'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-gentle':     'pulse-gentle 2s ease-in-out infinite',
        shimmer:            'shimmer 2s linear infinite',
        marquee:            'marquee 24s linear infinite',
      },

      // Animation delays — BRAND-T3 Sprint 17
      animationDelay: {
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
        '700': '700ms',
      },
      
      // === GRADIENTES ===
      backgroundImage: {
        // Verde Bosque → Verde Pino → Verde Menta (profundidad monocromática verde)
        'gradient-origen': 'linear-gradient(135deg, hsl(var(--bosque)) 0%, hsl(var(--pino)) 50%, hsl(var(--pradera)) 100%)',
        // Beige Arena → Verde Esmeralda (calidez a naturaleza)
        'gradient-menta': 'linear-gradient(135deg, hsl(var(--menta)) 0%, hsl(var(--hoja)) 100%)',
        // Blanco Verdeado → Blanco (fondo neutro)
        'gradient-crema': 'linear-gradient(135deg, hsl(var(--crema)) 0%, #FFFFFF 100%)',
      },
      
      // === TRANSICIONES ===
      transitionDuration: {
        'DEFAULT': '200ms',
        'fast': '150ms',
        'slow': '300ms',
      },
      
      transitionTimingFunction: {
        'DEFAULT': 'ease',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // === TRANSITION PROPERTY ===
      transitionProperty: {
        'card': 'transform, box-shadow, border-color',
        'gradient': 'opacity, transform',
      },
    },
  },
  
  // Plugins necesarios
  plugins: [require("tailwindcss-animate")],
};

export default config;
