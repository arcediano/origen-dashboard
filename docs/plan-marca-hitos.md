# Plan de Aplicación del Manual de Marca — Origen Dashboard
## Informe de Hitos · Versión 1.0 · Marzo 2026

---

## 📋 Diagnóstico del estado actual

### Hallazgos clave del análisis

| Área | Estado | Descripción del problema |
|------|--------|--------------------------|
| **Tokens de color** | ⚠️ Parcial | La paleta "Bosque Profundo" está definida en `globals.css` y `tailwind.config.ts`, pero muchos componentes y páginas todavía usan `text-gray-*`, `bg-gray-*`, `border-gray-*` de Tailwind en lugar de tokens propios |
| **Componentes UI atoms** | ⚠️ Parcial | `button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx` ya tienen tokens de marca, pero con `className` residuales en algunos estados (bordes de input, textos de placeholder) |
| **Páginas `src/app/`** | ❌ Sin aplicar | `login/page.tsx`, `onboarding/page.tsx`, `register/page.tsx`, `ayuda/page.tsx` y muchas otras tienen `className` inline con colores genéricos de Tailwind |
| **Componentes de dashboard** | ⚠️ Parcial | `StatsCard`, `DashboardHeader`, `DashboardSidebar` usan algunos tokens, pero mezclan `text-gray-500`, `border-gray-200`, `bg-white/90` sin tokens |
| **Landing sections** | ⚠️ Parcial | `hero-section.tsx` usa tokens pero con código duplicado y `className` hardcoded en línea |
| **Páginas de contenido** | ❌ Sin aplicar | `ayuda`, `soporte`, `cookies`, `privacidad`, `terminos`, `aviso-legal` tienen estilos ad-hoc totalmente genéricos |
| **Responsive / Mobile** | ⚠️ Parcial | El sidebar tiene versión móvil con overlay, pero faltan componentes específicos: `BottomNavBar`, `MobileDrawer`, `MobileCard` |
| **Estructura de carpetas** | ⚠️ Mejorable | Componentes dentro de `src/app/dashboard/components/` deberían estar en `src/components/features/dashboard/` |
| **Código muerto** | ❌ Existe | `StatusBanner` comentado en `layout.tsx`, `molecules/` y `organisms/` comentados en `ui/index.ts`, comentarios de debug en varios archivos |

### Inventario de componentes UI atoms existentes
```
src/components/ui/atoms/
  ├── accordion.tsx     ← shadcn base, sin tokens Origen aplicados
  ├── alert-dialog.tsx  ← shadcn base, sin tokens Origen
  ├── alert.tsx         ← tiene variantes, pendiente tokens
  ├── avatar.tsx        ← tiene AvatarGroup, tokens parciales
  ├── badge.tsx         ✅ tokens aplicados
  ├── button.tsx        ✅ tokens aplicados
  ├── card.tsx          ✅ tokens aplicados (complejo, 1400 líneas)
  ├── checkbox.tsx      ← tokens parciales
  ├── currency-input.tsx ← wrapper de input, tokens heredados
  ├── dialog.tsx        ← shadcn base, sin tokens Origen
  ├── input.tsx         ⚠️ tokens parciales (placeholder, bordes error en gray)
  ├── label.tsx         ⚠️ tokens parciales
  ├── pagination.tsx    ← sin tokens Origen
  ├── percentage-input.tsx ← wrapper
  ├── progress.tsx      ← tokens parciales
  ├── radio-group.tsx   ← tokens parciales
  ├── select.tsx        ← tokens parciales
  ├── separator.tsx     ← base
  ├── sheet.tsx         ← shadcn base
  ├── slider.tsx        ← tokens parciales
  ├── stepper.tsx       ← tokens aplicados
  ├── switch.tsx        ← tokens parciales
  ├── table.tsx         ← sin tokens Origen (usa gray)
  ├── tabs.tsx          ← tokens parciales
  ├── tags-input.tsx    ← tokens parciales
  ├── textarea.tsx      ← tokens parciales
  ├── toast.tsx         ✅ tokens aplicados
  ├── toggle.tsx        ← tokens parciales
  └── tooltip.tsx       ← tokens parciales
```

### Páginas con mayor deuda de estilos inline
- `src/app/auth/login/page.tsx` — ~200 líneas de `className` inline complejos
- `src/app/onboarding/page.tsx` — +700 líneas, `gray-*` por todas partes
- `src/app/dashboard/page.tsx` — `OnboardingProgressBanner` inline sin componente
- `src/app/ayuda/page.tsx`, `soporte/page.tsx`, `cookies/page.tsx` — sin tokens
- `src/app/dashboard/configuracion/page.tsx` — mezcla de `gray-*` y tokens

---

## 🗺️ Plan de Hitos

### Principios de ejecución

1. **Cada hito = 1 rama git** con nombre `feature/hito-XX-descripcion`
2. **Cada hito es desplegable de forma independiente** en Vercel preview
3. **No se rompe funcionalidad** — solo se cambian estilos y estructura
4. **Los tokens CSS no se modifican** — son la fuente de verdad (`globals.css`)
5. **Se elimina código muerto** en cada hito donde se toque
6. **Mobile-first**: si un componente no es responsive, se crea versión móvil

---

## 🏁 HITO 01 — Tokens y base del sistema de diseño
**Rama:** `feature/hito-01-design-tokens`  
**Duración estimada:** 1-2 días  
**Riesgo:** 🟢 Bajo (solo CSS y config)

### Objetivo
Consolidar y limpiar la capa de tokens CSS como única fuente de verdad. Cero estilos hard-coded fuera del sistema de tokens.

### Tareas

#### 1.1 Limpiar y auditar `globals.css`
- Eliminar comentarios de debug (`@note Los componentes personalizados ahora viven en...`)
- Revisar que todos los valores HSL coinciden exactamente con los HEX del manual
- Añadir token faltante: `--mandarina` como variable CSS (actualmente hardcoded en tailwind)
- Verificar que `--border`, `--input`, `--ring` usan colores de la paleta Origen

#### 1.2 Actualizar `tailwind.config.ts`
- Añadir color `origen.mandarina` como token HSL (actualmente es `hsl(34, 100%, 67%)` directo)
- Añadir tokens semánticos para reemplazar grises de Tailwind:
  ```ts
  // Tokens semánticos que mapean grises a paleta Origen
  "text-subtle": "hsl(var(--hoja))",        // reemplaza text-gray-500
  "text-muted-body": "hsl(var(--oscuro))",  // con opacity
  "surface": "hsl(var(--crema))",
  "surface-alt": "#FFFFFF",
  "border-subtle": "hsl(var(--pastel))",    // reemplaza border-gray-100/200
  "border-strong": "hsl(var(--hoja))",      // reemplaza border-gray-300
  ```
- Añadir `colors.gray` override si se quiere mantener compatibilidad temporal

#### 1.3 Crear `src/lib/utils/cn.ts`
- Centralizar `cn()` helper con comentario de uso
- Añadir tipo `ClassValue` exportable

#### 1.4 Actualizar `src/lib/utils/colors.ts`
- Corregir los HEX en `origenColors` que están desfasados (muestran paleta anterior)
  - `bosque.hex` dice `#1B2A4B` → debe ser `#1B4332`
  - `pino.hex` dice `#2E4A6E` → debe ser `#2D6A4F`
  - `pradera.hex` dice `#6B90B8` → debe ser `#74C69D`
  - `crema.hex` dice `#F8F9FC` → debe ser `#F1FAEE`
  - Etc.

#### 1.5 Añadir `src/constants/brand.ts`
```ts
// Archivo único con constantes de marca no-CSS
export const BRAND = {
  name: 'Origen',
  tagline: 'Marketplace local',
  version: '3.0',
  palette: 'Bosque Profundo',
  minLogoSize: 80, // px
  borderRadius: 8, // px
} as const;
```

### Archivos afectados
- `src/app/globals.css`
- `tailwind.config.ts`
- `src/lib/utils/colors.ts`
- `src/lib/utils/cn.ts` (nuevo)
- `src/constants/brand.ts` (nuevo)

### Criterios de aceptación
- [ ] `npx tailwindcss --dry-run` sin warnings de tokens desconocidos
- [ ] `colors.ts` con HEX exactos del manual
- [ ] No existen referencias `#1B2A4B`, `#6B90B8`, etc. en el codebase

---

## 🏁 HITO 02 — Átomos UI: completar tokens en los 27 componentes base
**Rama:** `feature/hito-02-ui-atoms-tokens`  
**Duración estimada:** 3-4 días  
**Riesgo:** 🟡 Medio (cambios en componentes compartidos)  
**Prerequisito:** Hito 01 mergeado

### Objetivo
Todos los átomos UI usan exclusivamente tokens `origen-*` y variables `--*`. Cero `gray-*`, cero colores hardcoded. Los componentes exponen solo las props necesarias; sin `className` de override de color.

### Tareas por componente

#### 2.1 `input.tsx`
- Reemplazar `border-gray-300` → `border-border`
- Reemplazar `placeholder:text-gray-400` → `placeholder:text-muted-foreground`
- Estados `error`: usar `border-destructive` y `text-destructive`
- Estados `success`: usar `border-origen-hoja` y `text-origen-hoja`
- Border `focus`: `ring-origen-pradera` consistente
- Reducir líneas: eliminar código duplicado entre variantes

#### 2.2 `select.tsx`
- Trigger: `border-border`, `focus:ring-origen-pradera`
- Item seleccionado: `bg-origen-pastel text-origen-bosque`
- Scroll area: `scrollbar-origen`

#### 2.3 `textarea.tsx`
- Mismos tokens que `input.tsx` para consistencia

#### 2.4 `checkbox.tsx`
- Checked state: `bg-origen-bosque border-origen-bosque`
- Focus: `ring-origen-pradera/20`
- `CheckboxGroup` horizontal y vertical responsive

#### 2.5 `radio-group.tsx`
- Indicador activo: `bg-origen-bosque`
- Focus: consistente con checkbox

#### 2.6 `switch.tsx`
- Track active: `bg-origen-hoja`
- Track inactive: `bg-muted`
- Thumb: `bg-white shadow-subtle`

#### 2.7 `tabs.tsx`
- Tab activo: `text-origen-bosque border-b-2 border-origen-menta`
- Tab inactivo: `text-muted-foreground hover:text-origen-hoja`
- Variante `pill`: `bg-origen-pastel text-origen-bosque`

#### 2.8 `table.tsx`
- Header: `bg-origen-crema text-origen-bosque font-semibold`
- Row hover: `hover:bg-origen-crema/50`
- Border: `border-border`
- Sortable column: `text-origen-hoja`

#### 2.9 `pagination.tsx`
- Botón activo: `bg-origen-bosque text-white`
- Botón hover: `hover:bg-origen-pastel hover:text-origen-bosque`
- Flechas: `text-origen-hoja`

#### 2.10 `dialog.tsx` y `alert-dialog.tsx`
- Overlay: `bg-origen-oscuro/50`
- Panel: `bg-white border border-border`
- Footer CTA: `Button variant="primary"` del sistema

#### 2.11 `accordion.tsx`
- Trigger: `text-origen-bosque hover:text-origen-pino`
- Indicador: `text-origen-hoja`
- Border: `border-border`

#### 2.12 `sheet.tsx`
- Overlay: `bg-origen-oscuro/60`
- Panel: `bg-white` con shadow `shadow-origen-lg`
- Botón close: `text-muted-foreground hover:text-origen-bosque`

#### 2.13 `tooltip.tsx`
- Fondo: `bg-origen-oscuro text-white`
- Arrow: `fill-origen-oscuro`

#### 2.14 `progress.tsx`
- Track: `bg-origen-pastel`
- Fill: `bg-origen-hoja`
- `CircularProgress`: stroke `origen-hoja`, track `origen-pastel`

#### 2.15 `avatar.tsx`
- Fallback: `bg-origen-pastel text-origen-bosque font-semibold`
- Border (group): `ring-2 ring-white`

#### 2.16 `alert.tsx`
- `success`: `bg-green-50 border-l-4 border-green-500 text-green-900`
- `warning`: `bg-amber-50 border-l-4 border-amber-500 text-amber-900`
- `error`: `bg-red-50 border-l-4 border-destructive text-red-900`
- `info`: `bg-blue-50 border-l-4 border-blue-500 text-blue-900`
- `brand` (nuevo): `bg-origen-pastel border-l-4 border-origen-menta text-origen-bosque`

#### 2.17 `separator.tsx`
- Color: `bg-border`

#### 2.18 `slider.tsx`
- Track: `bg-origen-pastel`
- Range: `bg-origen-hoja`
- Thumb: `bg-origen-bosque ring-2 ring-white`

#### 2.19 `toggle.tsx`
- Active: `bg-origen-pastel text-origen-bosque`
- Hover: `hover:bg-origen-crema hover:text-origen-bosque`

#### 2.20 Eliminar código muerto en `card.tsx`
- El fichero tiene 1400 líneas. Refactorizar en sub-componentes internos
- Mantener exports pero mover lógica de `ProductCard` y `StatCard` a sus propios archivos en `src/components/features/`

### Criterios de aceptación
- [ ] Grep de `text-gray-|bg-gray-|border-gray-` en `src/components/ui/atoms/` = 0 resultados
- [ ] Todos los componentes aceptan `className` solo para layout (margin, padding, width), no para color
- [ ] `card.tsx` reducido a < 400 líneas (resto extraído)

---

## 🏁 HITO 03 — Componentes compartidos y layout del dashboard
**Rama:** `feature/hito-03-dashboard-layout`  
**Duración estimada:** 2-3 días  
**Riesgo:** 🟡 Medio  
**Prerequisito:** Hito 02 mergeado

### Objetivo
Estandarizar el layout del dashboard: sidebar, header, footer y shell. Mover componentes de `src/app/dashboard/components/` a `src/components/features/dashboard/`. Limpiar código comentado.

### Tareas

#### 3.1 Reestructurar carpetas
```
ANTES:
src/app/dashboard/components/
  header/
  sidebar/
  footer/
  PageHeader.tsx

DESPUÉS:
src/components/features/dashboard/components/
  layout/                     ← ya existe, ampliar
    dashboard-shell.tsx
    page-header.tsx            ← mover desde app/
    dashboard-layout.tsx       ← nuevo, extraer de layout.tsx
  header/                     ← mover desde app/dashboard/components/header/
    index.ts
    dashboard-header.tsx
    header-logo.tsx
    mobile-menu.tsx
    notification-bell.tsx
    notification-item.tsx
    user-menu.tsx
    dashboard-breadcrumb.tsx
  sidebar/                    ← mover desde app/dashboard/components/sidebar/
    index.ts
    dashboard-sidebar.tsx
    sidebar-menu-item.tsx
    sidebar-submenu.tsx
  footer/                     ← mover desde app/dashboard/components/footer/
    dashboard-footer.tsx
```

#### 3.2 `DashboardSidebar` — aplicar tokens
- Logo: svg leaf con `text-origen-bosque` sobre fondo `bg-origen-pastel`
- Item activo: `bg-origen-bosque/10 text-origen-bosque border-l-2 border-origen-bosque`
- Item hover: `hover:bg-origen-pastel hover:text-origen-bosque`
- Texto secundario: `text-muted-foreground` (no `text-gray-500`)
- Badge: usar `<Badge variant="leaf">` del sistema
- Botón logout: `Button variant="ghost"` con `text-destructive`
- Fondo sidebar: `bg-white border-r border-border`
- Eliminar `motion` de framer-motion en overlay si se puede sustituir con CSS transitions

#### 3.3 `DashboardHeader` — aplicar tokens
- Fondo scroll: `bg-white/90 backdrop-blur-md border-b border-border shadow-subtle`
- Fondo normal: `bg-white/50 backdrop-blur-sm border-b border-border`
- `text-gray-*` → tokens
- Añadir `aria-label` al header

#### 3.4 `DashboardFooter` — crear si no existe
- Fondo: `bg-origen-crema border-t border-border`
- Texto: `text-muted-foreground text-xs`
- Links: `text-origen-hoja hover:text-origen-bosque`

#### 3.5 `PageHeader.tsx` — tokens + responsive
- Back button: usar `<Button variant="ghost" size="icon-sm">`
- Título: `text-origen-bosque font-serif`
- Subtítulo: `text-muted-foreground`
- Eliminar `text-gray-500`, `border-gray-200`

#### 3.6 `OnboardingProgressBanner` en `dashboard/page.tsx`
- Extraer a `src/components/features/dashboard/components/alerts/onboarding-banner.tsx`
- Aplicar tokens: usar `<Alert variant="brand">` + `<Button variant="primary" size="sm">`
- Eliminar `className` inline del componente padre

#### 3.7 `layout.tsx` — limpieza
- Eliminar import comentado de `StatusBanner`
- Eliminar `MOCK_PRODUCER_STATUS` y el type importado (no se usa)
- Eliminar logs de debug o moverlos detrás de `if (process.env.NODE_ENV !== 'production')` (ya lo tiene, asegurar consistencia)

### Criterios de aceptación
- [ ] `src/app/dashboard/components/` solo contiene re-exports a la nueva ubicación (o se elimina)
- [ ] Grep de `text-gray-|bg-gray-` en archivos de layout = 0
- [ ] `layout.tsx` sin imports comentados
- [ ] No hay `className` de color en las páginas que usen estos componentes de layout

---

## 🏁 HITO 04 — Páginas de autenticación y onboarding
**Rama:** `feature/hito-04-auth-onboarding`  
**Duración estimada:** 3-4 días  
**Riesgo:** 🟡 Medio (afecta flujo principal de captación)  
**Prerequisito:** Hito 02 mergeado

### Objetivo
Eliminar todo `className` inline de color en las páginas `login`, `register`, `forgot-password`, `onboarding`. Crear componentes reutilizables para el layout de auth.

### Tareas

#### 4.1 Crear `AuthLayout` compartido
```
src/components/features/auth/components/auth-layout.tsx (nuevo)
```
- Header con logo (extraer de `login/page.tsx`, hoy tiene SVG inline hardcoded)
- Wrapper de dos columnas (form izquierda, panel derecho con stats)
- Panel derecho: `bg-gradient-to-br from-origen-bosque to-origen-pino` con texto blanco
- Mobile: solo columna de formulario, header compacto

#### 4.2 `LoginPage` — refactorizar
- Usar `<AuthLayout>` para el wrapper
- Extraer `LoginSocialProof` (los stats de la derecha) a componente propio
- El logo SVG inline → usar `<BrandLogo>` (componente nuevo en `src/components/shared/`)
- `className` inline de `bg-origen-crema/30`, `border-gray-200`, etc. → tokens en el componente

#### 4.3 `RegisterPage` — refactorizar
- Usar `<AuthLayout>` para consistencia visual
- Extraer título + subtítulo a `SectionHeader` reutilizable
- El `Shield` de pie de formulario → `<TrustBadge>` componente en `shared/`

#### 4.4 `ForgotPasswordPage` — completar tokens
- Actualmente página básica, aplicar mismo patrón de `AuthLayout`

#### 4.5 `OnboardingPage` — refactorizar (mayor esfuerzo)
El fichero actual de onboarding es monolítico (~700 líneas). Plan de extracción:

```
src/app/onboarding/
  page.tsx                              ← solo orquestación, sin JSX directo
  components/
    onboarding-header.tsx               ← header sticky con progress
    onboarding-stepper.tsx              ← stepper lateral de pasos
    onboarding-step-card.tsx            ← card individual de cada paso
    onboarding-navigation.tsx           ← botones anterior/siguiente
    mobile-stepper.tsx (nuevo)          ← versión compacta para móvil
```
- Reemplazar todos `bg-gray-*`, `border-gray-*` por tokens
- `progress bar`: usar `<Progress>` del sistema
- Step indicators: usar `<Badge>` del sistema
- Botones de navegación: `<Button>` del sistema sin `className` de override

#### 4.6 Componente `BrandLogo` (nuevo)
```
src/components/shared/brand-logo.tsx
```
- Props: `variant: "full" | "icon" | "wordmark"`, `size`, `theme: "light" | "dark"`
- Encapsula el SVG de la hoja + wordmark
- Responsive: puede tener tamaño responsive automático
- Elimina el SVG duplicado que existe en `login/page.tsx`, `sidebar`, `manual`

### Criterios de aceptación
- [ ] `login/page.tsx` sin `className` de color inline — solo usa componentes
- [ ] `onboarding/page.tsx` < 150 líneas (solo composición)
- [ ] `BrandLogo` usado en al menos: sidebar, login, register, header auth
- [ ] Tests visuales: capturas antes/después en PR

---

## 🏁 HITO 05 — Páginas del dashboard (productos, pedidos, perfil, configuración)
**Rama:** `feature/hito-05-dashboard-pages`  
**Duración estimada:** 4-5 días  
**Riesgo:** 🟡 Medio  
**Prerequisito:** Hitos 02 y 03 mergeados

### Objetivo
Todas las páginas del dashboard aplican tokens de marca. Sin `className` de color inline en páginas. Los componentes de features del dashboard usan el sistema de diseño atómico.

### Tareas

#### 5.1 `dashboard/page.tsx` — limpiar
- `OnboardingProgressBanner` → usar componente extraído en H03
- La sección de stats usa `StatsCard` del sistema
- Eliminar `text-gray-500` residuales

#### 5.2 `dashboard/products/` — estandarizar
Componentes a revisar:
- `ProductCard.tsx` → usar `<Card variant="elevated">` del sistema
- `ProductTable.tsx` → usar `<Table>` del sistema con tokens
- `ProductFilters.tsx` → usar `<Input>`, `<Select>`, `<Badge>` del sistema
- `ProductStats.tsx` → usar `<StatsCard>`
- `ProductTableRow.tsx` → eliminar `bg-gray-*` inline
- Steps de creación → usar `<Stepper>` del sistema

#### 5.3 `dashboard/orders/` — estandarizar
- Lista de pedidos: `<Table>` con tokens
- Filtros: `<Select>` + `<Input>` del sistema
- Estados de pedido: `<Badge variant="success|warning|danger|info">`
- `[id]/page.tsx`: tokens en detalles del pedido

#### 5.4 `dashboard/profile/` — estandarizar
- Tabs de secciones: `<Tabs>` del sistema
- Formularios: `<Input>`, `<Select>`, `<Textarea>` del sistema
- Avatares: `<Avatar>` del sistema
- Business info: `<Card>` del sistema

#### 5.5 `dashboard/configuracion/` — limpiar
- Eliminar `border-gray-200/50`, `text-gray-500` inline
- Settings cards: `<Card variant="default">`
- Inputs de configuración: `<Input>` + `<Switch>` del sistema

#### 5.6 `dashboard/reviews/`, `notifications/`, `security/` — tokens
- Aplicar mismo patrón: componentes atómicos, tokens de marca
- `notifications/`: usar `<Alert>` del sistema para ítems
- `security/`: formularios con `<Input>` del sistema

#### 5.7 `StatsCard` — ampliar para dashboard
- Ya existe en `dashboard/components/stats/stats-card.tsx`
- Mover a `src/components/ui/atoms/` para que sea atómico
- Unificar con `StatCard` de `card.tsx` (actualmente duplicado)

### Criterios de aceptación
- [ ] Grep `text-gray-|bg-gray-` en `src/app/dashboard/**` = 0
- [ ] Todos los formularios del dashboard usan átomos del sistema
- [ ] No hay JSX con `className` de color directamente en archivos `page.tsx`

---

## 🏁 HITO 06 — Landing, secciones de marketing y páginas legales
**Rama:** `feature/hito-06-landing-legal`  
**Duración estimada:** 2-3 días  
**Riesgo:** 🟢 Bajo (no afecta funcionalidad core)  
**Prerequisito:** Hito 02 mergeado

### Objetivo
Landing page con tokens de marca. Páginas legales y de soporte con layout estandarizado. Limpiar código muerto de las secciones de marketing.

### Tareas

#### 6.1 Crear `ContentPageLayout` (nuevo)
```
src/components/features/landing/components/content-page-layout.tsx
```
- Header con `BrandLogo`
- Breadcrumb opcional
- Wrapper de contenido con `prose-origen` aplicado
- Footer con links legales
- Usado por: `ayuda`, `soporte`, `privacidad`, `terminos`, `aviso-legal`, `cookies`

#### 6.2 Páginas legales y de soporte
Aplicar `<ContentPageLayout>` y eliminar `className` genérico:
- `src/app/ayuda/page.tsx` — actualmente usa `text-gray-*` en todo
- `src/app/soporte/page.tsx`
- `src/app/privacidad/page.tsx`
- `src/app/terminos/page.tsx`
- `src/app/aviso-legal/page.tsx`
- `src/app/cookies/page.tsx`
- `src/app/contacto/page.tsx`
- `src/app/como-funciona/page.tsx`
- `src/app/casos-exito/page.tsx`

#### 6.3 Secciones de landing
- `hero-section.tsx`: eliminar `className` inline de colores, usar tokens
- `benefits-section.tsx`: `<FeatureCard>` del sistema
- `process-section.tsx`: usar `<Badge>` para numeración de pasos
- `testimonials-section.tsx`: `<Card variant="elevated">` para testimonios
- `final-cta-section.tsx`: `bg-gradient-origen` del sistema

#### 6.4 `mobile-card-slider.tsx` — ampliar
- Este componente ya existe para móvil en landing
- Aplicar tokens correctos
- Añadir accesibilidad (`aria-label`, keyboard navigation)

#### 6.5 Limpiar imports no usados en las secciones
- Cada sección de landing importa muchos iconos Lucide que pueden no usarse todos
- Hacer un grep-audit de imports no usados

### Criterios de aceptación
- [ ] Páginas legales usan `ContentPageLayout` y `prose-origen`
- [ ] Grep `text-gray-|bg-gray-` en `src/app/ayuda|soporte|privacidad|terminos|aviso-legal|cookies` = 0
- [ ] Secciones de landing sin colores hardcoded

---

## 🏁 HITO 07 — Componentes móviles específicos
**Rama:** `feature/hito-07-mobile-components`  
**Duración estimada:** 4-5 días  
**Riesgo:** 🟡 Medio  
**Prerequisito:** Hito 03 mergeado

### Objetivo
Crear componentes específicos para mejorar la experiencia en móvil. El dashboard en móvil debe tener navegación inferior, acciones compactas y cards adaptadas.

### Nuevos componentes a crear

#### 7.1 `BottomNavBar` (nuevo)
```
src/components/features/dashboard/components/layout/bottom-nav-bar.tsx
```
- Navegación inferior fija para móvil (< 768px)
- 4-5 iconos con label: Inicio, Productos, Pedidos, Notificaciones, Perfil
- Item activo: `bg-origen-bosque/10 text-origen-bosque` con indicador superior
- Fondo: `bg-white border-t border-border` con `safe-area-inset-bottom`
- Oculto en desktop (`hidden lg:hidden` → solo visible `block lg:hidden`)
- Badge de notificaciones: `<Badge variant="notification">`

#### 7.2 `MobilePageHeader` (nuevo)
```
src/components/features/dashboard/components/header/mobile-page-header.tsx
```
- Header compacto para páginas internas en móvil
- Back button + título centrado + acción derecha
- Diferente al `DashboardHeader` genérico
- Sticky, `bg-white/95 backdrop-blur-sm`

#### 7.3 `MobileFilterDrawer` (nuevo)
```
src/components/features/dashboard/components/layout/mobile-filter-drawer.tsx
```
- Sheet/Drawer desde abajo con filtros
- Usa `<Sheet>` del sistema
- Botones "Aplicar" y "Limpiar" con tokens
- Sustituye los filtros horizontales que no caben en móvil

#### 7.4 `MobileActionSheet` (nuevo)
```
src/components/shared/mobile-action-sheet.tsx
```
- Sheet de acciones para menús contextuales en móvil (reemplaza dropdowns)
- Usa `<Sheet>` del sistema
- Lista de opciones con iconos
- Destructive actions en rojo

#### 7.5 `MobileCard` (nuevo)
```
src/components/ui/atoms/mobile-card.tsx
```
- Card compacta horizontal para listas en móvil
- Imagen thumbnail izquierda + info derecha + badge estado
- Swipe actions opcionales (delete/edit) usando CSS transitions
- Útil en listas de productos y pedidos en móvil

#### 7.6 `MobileStepper` (nuevo)
```
src/components/ui/atoms/mobile-stepper.tsx
```
- Versión compacta del `Stepper` para formularios multi-paso en móvil
- Muestra solo paso actual "3 / 5" con barra de progreso
- Sin lista lateral de pasos (ocupa demasiado espacio)

#### 7.7 Integrar `BottomNavBar` en `DashboardLayout`
- Mostrar solo en móvil (`< lg`)
- El sidebar se oculta en móvil y se muestra `BottomNavBar`
- Añadir `pb-16` al `main` en móvil para compensar la barra fija

#### 7.8 Actualizar `DashboardHeader` para móvil
- En móvil: logo + hamburger (ya existe) + notificaciones
- Ocultar breadcrumb en móvil (ya ocupa demasiado espacio)
- El `UserMenu` en móvil: trigger compacto

### Criterios de aceptación
- [ ] Dashboard navegable en móvil sin sidebar (usando BottomNavBar)
- [ ] Listas de productos y pedidos usan `MobileCard` en viewport < 768px
- [ ] Formularios multi-paso usan `MobileStepper` en < 768px
- [ ] Lighthouse Mobile Score ≥ 85

---

## 🏁 HITO 08 — Limpieza final y QA de marca
**Rama:** `feature/hito-08-cleanup-qa`  
**Duración estimada:** 2-3 días  
**Riesgo:** 🟢 Bajo  
**Prerequisito:** Todos los hitos anteriores mergeados en `main`

### Objetivo
Auditoría final de consistencia. Cero deuda técnica de estilos. Preparar para producción.

### Tareas

#### 8.1 Audit automatizado de tokens
```bash
# Script de auditoría a añadir en package.json
"scripts": {
  "audit:tokens": "grep -r 'text-gray-\\|bg-gray-\\|border-gray-\\|#[0-9a-fA-F]\\{3,6\\}' src/ --include='*.tsx' --include='*.ts'"
}
```
- Ejecutar y que el resultado sea vacío (o solo en archivos de sistema como `colors.ts`)

#### 8.2 Audit de imports no usados
- Revisar cada `page.tsx` y `component.tsx` para eliminar imports de Lucide no usados
- Eliminar variables declaradas pero no usadas
- Eliminar comentarios de TODO/FIXME que estén resueltos

#### 8.3 Audit de código muerto
- `src/components/ui/index.ts`: descomentar o eliminar `molecules`, `organisms`, `templates` si no existen
- `src/mocks/sellers.ts`: marcar claramente como mock o eliminar si hay datos reales
- `StatusBanner` en `layout.tsx`: eliminar la línea comentada definitivamente
- Cualquier `console.log` fuera de condicional de desarrollo

#### 8.4 Verificar accesibilidad WCAG 2.1
- Ejecutar axe-core o similar en las páginas principales
- Verificar contrastes: todos los pares en la tabla del manual (Hito 01)
- `aria-label` en botones solo-icono
- Focus ring visible en todos los interactivos (`ring-origen-pradera/20`)

#### 8.5 Verificar responsive en breakpoints definidos
- `xs (475px)`: móviles grandes
- `sm (640px)`: tablets pequeñas
- `md (768px)`: tablets
- `lg (1024px)`: desktop
- `xl (1280px)`: desktop grande

#### 8.6 Documentar componentes creados en este sprint
- Actualizar `manual-de-marca.html` con ejemplos reales de los nuevos componentes móviles
- Añadir sección "Componentes del Dashboard" al manual

#### 8.7 Crear `CHANGELOG.md`
```
src/CHANGELOG.md
```
- Registrar todos los cambios por hito para facilitar revisiones futuras

### Criterios de aceptación
- [ ] Script `audit:tokens` devuelve 0 líneas afectadas
- [ ] 0 `console.log` en producción
- [ ] Lighthouse Desktop ≥ 90, Mobile ≥ 85
- [ ] WCAG 2.1 AA en todas las páginas
- [ ] Manual de marca actualizado con capturas de pantalla reales

---

## 📊 Resumen del plan

| Hito | Rama | Días est. | Riesgo | Prereq |
|------|------|-----------|--------|--------|
| H01 · Tokens base | `feature/hito-01-design-tokens` | 1-2 | 🟢 Bajo | — |
| H02 · Átomos UI | `feature/hito-02-ui-atoms-tokens` | 3-4 | 🟡 Medio | H01 |
| H03 · Layout dashboard | `feature/hito-03-dashboard-layout` | 2-3 | 🟡 Medio | H02 |
| H04 · Auth y onboarding | `feature/hito-04-auth-onboarding` | 3-4 | 🟡 Medio | H02 |
| H05 · Páginas dashboard | `feature/hito-05-dashboard-pages` | 4-5 | 🟡 Medio | H02+H03 |
| H06 · Landing y legales | `feature/hito-06-landing-legal` | 2-3 | 🟢 Bajo | H02 |
| H07 · Móvil específico | `feature/hito-07-mobile-components` | 4-5 | 🟡 Medio | H03 |
| H08 · QA final | `feature/hito-08-cleanup-qa` | 2-3 | 🟢 Bajo | Todos |
| **TOTAL** | | **21-29 días** | | |

### Orden de ejecución recomendado (paralelo donde posible)

```
H01 ──► H02 ──┬──► H03 ──► H07
              ├──► H04
              ├──► H05 (requiere H03)
              └──► H06
                          └──► H08 (todos)
```

---

## 🔀 Comandos git para cada hito

```bash
# Iniciar cada hito desde main actualizado
git checkout main
git pull origin main
git checkout -b feature/hito-01-design-tokens

# Al finalizar el hito, crear PR a main
git push origin feature/hito-01-design-tokens
# → Abrir PR en GitHub/GitLab con descripción del hito
# → Vercel desplegará preview automáticamente
# → Revisar en preview URL antes de mergear

# Merge al completar QA de la preview
git checkout main
git merge --no-ff feature/hito-01-design-tokens -m "feat: Hito 01 - Consolidar design tokens"
git push origin main
git tag v3.0.1-hito01
git push origin --tags
```

### Convención de commits en cada hito
```
feat(tokens): descripción del cambio
fix(button): descripción del fix
refactor(sidebar): mover a nueva ubicación
style(dashboard): aplicar tokens de marca
chore(cleanup): eliminar código muerto
```

---

## ⚠️ Reglas de oro durante el sprint

1. **Nunca** añadir `text-gray-*` / `bg-gray-*` nuevos — usar tokens Origen
2. **Nunca** poner colores hexadecimales en `className` de JSX
3. **Siempre** que un `page.tsx` tenga color en `className`, extraer a componente
4. **Siempre** que un componente tenga más de 300 líneas, valorar división
5. **Probar en móvil real** (o DevTools 375px) antes de cada PR
6. **Una PR = un hito** — no mezclar cambios de hitos distintos
7. **El manual de marca HTML** es la referencia visual — si hay duda, consultar
