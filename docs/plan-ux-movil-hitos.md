# Plan de Acción — UX Mobile-First origen-dashboard
## Pantallas: Productos · Pedidos · Reseñas · Notificaciones

> **Fecha:** Marzo 2026  
> **Manual de marca:** Origen v3.0 "Bosque Profundo"  
> **Metodología:** Mobile-first, hitos desplegables e independientes entre sí

---

## Diagnóstico General

### Problemas críticos identificados en el código

| Problema | Afecta | Impacto |
|---|---|---|
| `container mx-auto px-6 py-8 space-y-8` en todas las páginas | Todos | Padding excesivo en móvil (375px: sólo 327px útiles) |
| Stats con `grid-cols-2 → lg:grid-cols-8` y `text-2xl font-bold` | Productos, Pedidos | Cifras gigantes en tarjetas mini de 2 columnas |
| `OrdersTable` / `ProductTable` son tablas HTML puras | Pedidos, Productos | Scroll horizontal obligatorio en móvil — UX fatal |
| `<select>` nativos en filtros | Todos | Inconsistentes en iOS/Android, desalineados con la marca |
| `CardContent className="p-6"` en notificaciones | Notificaciones | 24px de padding interior desborda filas de toggles en 320px |
| Tokens mezclados: `text-muted-foreground` (shadcn) vs `text-text-subtle` (Origen) | Todos | Inconsistencia visual con el manual de marca |
| Sin `OrderCard` — no existe vista de tarjeta para pedidos en móvil | Pedidos | Sin alternativa a la tabla en pantalla pequeña |
| `ReviewsList` — respuesta inline + expand en una sola tarjeta vertical grande | Reseñas | Tarjetas de 800px de alto en móvil |
| Botón "Guardar" en notificaciones sin posición sticky en móvil | Notificaciones | Perdido al final de la página — no se ve sin scrollear |

### Tokens de marca — Inconsistencias detectadas

```
✗ text-muted-foreground     → ✓ text-text-subtle
✗ text-border               → ✓ text-text-disabled  
✗ bg-origen-crema (fondo)   → ✓ bg-surface
✗ border-border (suelto)    → ✓ border-border-subtle
✗ shadow-lg genérico        → ✓ shadow-subtle / shadow-float (tokens Origen)
```

---

## Hitos del Plan

Los hitos están ordenados por dependencias: HV01 es la base, los demás son independientes entre sí una vez HV01 está desplegado. Cada uno puede ser probado en rama separada.

---

## ▶ HV01 — Fundamentos: Tokens y Layout Base
### Estado: `pendiente` | Dependencia: ninguna | Duración estimada: 1 sesión

**Objetivo:** Normalizar tokens de marca y corregir el sistema de espaciado en las 4 páginas. Sin este hito, los hitos siguientes tendrán inconsistencias visuales.

### Tareas

#### 1.1 — Wrapper de página con padding responsive
Crear `src/components/shared/layout/PageWrapper.tsx`:
```tsx
// Sustituye "container mx-auto px-6 py-8 space-y-8"
// Por: px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8
// Con safe-area-inset considerado
```
Aplicar en: `products/page.tsx`, `orders/page.tsx`, `reviews/page.tsx`, `notifications/page.tsx`

#### 1.2 — Normalización de tokens en los 4 ficheros de componentes principales
Archivos afectados:
- `ProductStats.tsx`: `text-muted-foreground` → `text-text-subtle`
- `ProductFilters.tsx`: `bg-surface-alt`, `border-border` → `border-border-subtle`
- `ReviewsList.tsx`: `text-muted-foreground` → `text-text-subtle`, `text-border` → `text-text-disabled`
- `OrderStats.tsx`: verificar todos los colores inline hardcodeados
- `notifications/page.tsx`: `text-muted-foreground` → `text-text-subtle`

#### 1.3 — Padding de tarjetas en móvil
Clases afectadas:
```
CardContent className="p-6"  →  className="p-4 sm:p-6"
Card className="p-5"         →  className="p-4 sm:p-5"
Card className="p-12"        →  className="p-8 sm:p-12"  (empty states)
```

#### 1.4 — Espaciado de sección
```
space-y-8  →  space-y-5 sm:space-y-6 lg:space-y-8
```

### Archivos a modificar
```
src/app/dashboard/products/page.tsx
src/app/dashboard/orders/page.tsx
src/app/dashboard/reviews/page.tsx
src/app/dashboard/notifications/page.tsx
src/app/dashboard/products/components/ProductStats.tsx
src/app/dashboard/products/components/ProductFilters.tsx
src/app/dashboard/reviews/components/ReviewsList.tsx
src/app/dashboard/orders/components/OrderStats.tsx
```

### Tests de aceptación
- [ ] En iPhone 14 (390px): ninguna sección horizontal supera la pantalla
- [ ] En iPhone SE (375px): el texto no aparece cortado
- [ ] Los colores de icono, borde y texto coinciden con la paleta del manual de marca

---

## ▶ HV02 — Componentes Móviles Reutilizables
### Estado: `pendiente` | Dependencia: HV01 | Duración estimada: 1 sesión

**Objetivo:** Crear la librería de componentes móviles que usarán HV03, HV04, HV05, HV06. Reside en `src/components/shared/mobile/`.

### Componentes a crear

#### 2.1 — `ScrollChipFilter` — Chips de filtro con scroll horizontal
```
src/components/shared/mobile/ScrollChipFilter.tsx
```
- Chips con tokens Origen: `bg-origen-pastel/text-origen-pino` (inactivo), `bg-origen-bosque/text-white` (activo)
- `overflow-x-auto scrollbar-none` con `-mx-4 px-4` para sangrado seguro hasta el borde
- Badge de conteo opcional (`min-w-[18px] h-4.5 px-1 rounded-full`)
- Efecto `whileTap={{ scale: 0.95 }}` con Framer Motion

**Props:**
```tsx
interface ScrollChipFilterProps {
  chips: Array<{ label: string; value: string; count?: number }>
  value: string          // chip activo
  onChange: (value: string) => void
  className?: string
}
```

#### 2.2 — `MobileStatCard` — Tarjeta KPI compacta
```
src/components/shared/mobile/MobileStatCard.tsx
```
- Tamaño: `p-3`, icono `h-8 w-8` (no 5/5 que queda grande en 2 columnas)
- Valor: `text-lg font-bold` (no `text-2xl` que desborda en 2 columnas)
- Etiqueta: `text-[11px]` con `text-text-subtle`
- Acento de color mediante `border-l-2` o icono coloreado
- Variante `skeleton` con `animate-pulse`

#### 2.3 — `MobileKPIRow` — Fila KPI scrollable horizontal
```
src/components/shared/mobile/MobileKPIRow.tsx
```
- Alternativa al grid 2×N en móvil
- `flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4`
- Cada item: `flex-shrink-0 w-[140px]` tarjeta vertical con icono, valor y etiqueta
- Visible solo en `lg:hidden`

#### 2.4 — `EmptyState` — Estado vacío unificado
```
src/components/shared/mobile/EmptyState.tsx
```
Centraliza los empty states que actualmente tienen `p-12` fijo:
- Props: `icon`, `title`, `description`, `action?: { label, onClick }`
- Padding: `py-8 sm:py-12`

#### 2.5 — `SectionTitle` — Título de sección en móvil
```
src/components/shared/mobile/SectionTitle.tsx
```
- `text-base font-semibold text-text-primary` (más pequeño que `text-lg` del PageHeader en desktop)
- Separador sutil `border-b border-border-subtle pb-2 mb-3`

### Tests de aceptación
- [ ] `ScrollChipFilter` funciona con scroll táctil en iOS Safari
- [ ] `MobileStatCard` en `grid-cols-2` cabe bien en iPhone SE (375px)
- [ ] `MobileKPIRow` oculta en `lg:` y visible solo en móvil

---

## ▶ HV03 — Productos: Rediseño Mobile-First Completo
### Estado: `pendiente` | Dependencia: HV01 + HV02 | Duración estimada: 2 sesiones

**Objetivo:** La pantalla de Productos tiene que funcionar como una app nativa en móvil. Actualmente tiene tabla horizontal sin fallback de tarjeta.

### Problemas específicos que resuelve

| Problema actual | Solución HV03 |
|---|---|
| `ProductStats` en 2 cols (móvil) con `text-2xl` — cifras que desbordan | Reemplazar con `MobileKPIRow` en móvil y mantener grid en desktop |
| `ProductFilters` con 4 `<select>` nativos + buscador — panel muy alto en móvil | `ScrollChipFilter` para estado/categoría; búsqueda siempre visible |
| `ProductTable` (tabla HTML) sin fallback móvil — scroll horizontal | Ocultar tabla en móvil (`hidden lg:block`), mostrar `ProductMobileList` |
| Toggle de vista (grid/list) visible también en móvil — redundante | Ocultar toggle en móvil (siempre grid en móvil) |
| `grid-cols-2` de ProductCard: imagen cuadrada aspect-square — en 375px = cards de 160px | Mantener grid 2 cols pero optimizar densidad de información |

### Tareas

#### 3.1 — `ProductMobileList` — Lista de productos para móvil
```
src/app/dashboard/products/components/ProductMobileList.tsx
```
Diseño: tarjeta horizontal (no cuadrada) con:
- Thumbnail `h-16 w-16 rounded-xl flex-shrink-0` a la izquierda
- Derecha: nombre (`text-sm font-semibold`), SKU (`text-[11px] text-text-subtle`), precio + stock badge
- Chip de estado alineado top-right
- Toque → navegar al detalle, swipe-right → botones de acción (Editar / Ajustar stock)
- `motion.div` con `whileTap={{ scale: 0.98 }}`

**Estructura visual:**
```
┌─────────────────────────────────────────────────────┐
│ [IMG] Nombre del producto                  [ACTIVO] │
│       SKU: P-0001                                   │
│       18,50€   ●──●  Stock: 12 uds.                 │
│                                    [Editar] [Stock] │
└─────────────────────────────────────────────────────┘
```

#### 3.2 — Refactorizar `ProductStats` con variante móvil
```
src/app/dashboard/products/components/ProductStats.tsx
```
- En móvil (`lg:hidden`): usar `MobileKPIRow` con scroll horizontal, máx 4 KPIs principales
- En desktop (`hidden lg:grid`): mantener grid actual pero con `text-xl` en vez de `text-2xl`

#### 3.3 — Refactorizar `ProductFilters` con chips en móvil
```
src/app/dashboard/products/components/ProductFilters.tsx
```
- Búsqueda: siempre visible (primera fila)
- Estado: `ScrollChipFilter` (chips: Todos / Activos / Borradores / Sin stock)
- Categoría y ordenación: `<select>` sólo en desktop; en móvil un botón `Filtros +` que abre un bottom sheet (o expande sección colapsable)
- Eliminar el toggle de vista (grid/list) en móvil

#### 3.4 — Actualizar `products/page.tsx`
- En móvil: mostrar `ProductMobileList` en vez de `ProductTable` (para `viewMode === 'list'`)
- En móvil: el grid siempre es el modo visual
- Ocultar el toggle grid/list en `lg:hidden`

#### 3.5 — Mejorar `ProductCard` (vista grid en móvil)
- Reducir `aspect-square` a altura controlada `h-32` para ahorrar espacio
- Comprimir acciones: un solo botón circular `+` → menú de 3 acciones
- Fuentes: `text-sm` → `text-[13px]` para nombre, `text-xs` para resto

### Tests de aceptación
- [ ] En iPhone 14: `ProductMobileList` muestra toda la información sin overflow
- [ ] En iPhone SE: los chips de filtro son scrollables y caben en pantalla
- [ ] En iPad: se ve la tabla desktop correctamente
- [ ] El toggle de vista solo aparece en `lg:` y arriba

---

## ▶ HV04 — Pedidos: OrderCard + Stats Compactos
### Estado: `pendiente` | Dependencia: HV01 + HV02 | Duración estimada: 2 sesiones

**Objetivo:** La pantalla de Pedidos es la más crítica en móvil porque `OrdersTable` es una tabla de 6 columnas sin ningún fallback — es completamente inutilizable en móvil. Necesita un `OrderCard` urgente.

### Tareas

#### 4.1 — `OrderCard` — Tarjeta de pedido para móvil ⚡ CRÍTICO
```
src/app/dashboard/orders/components/OrderCard.tsx
```

Diseño de la tarjeta:
```
┌─────────────────────────────────────────────────────┐
│ #ORD-2024-0145          [ENVIADO ●]        14 mar  │
│ María García · mar****@gmail.com                    │
│─────────────────────────────────────────────────────│
│ 3 productos                              42,50 € ➤ │
│                                        [PAGADO ✓]  │
└─────────────────────────────────────────────────────┘
```

Props:
```tsx
interface OrderCardProps {
  order: Order
  onViewDetails: (id: string) => void
}
```

Elementos:
- Número de pedido: `text-sm font-semibold text-text-primary`
- Fecha: `text-[11px] text-text-subtle` alineada a la derecha
- Estado: `StatusChip` con colores Origen (pendiente=amber, procesando=pino, enviado=hoja, entregado=green, cancelado=red)
- Cliente: `text-sm text-text-secondary`
- Importe: `text-base font-bold text-origen-bosque`
- Pago badge: inline con icono `CheckCircle` o `Clock`
- Tap → `router.push` al detalle; toda la tarjeta es touchable (`cursor-pointer`)
- `motion.div whileTap={{ scale: 0.98 }}`

#### 4.2 — `OrderStatusChip` — Chip de estado con colores Origen
```
src/app/dashboard/orders/components/OrderStatusChip.tsx
```
Reemplaza los `Badge variant="..."` con colores más ricos aplicando tokens Origen:

| Estado | Fondo | Texto | Borde |
|---|---|---|---|
| `pending` | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| `processing` | `bg-origen-pastel` | `text-origen-pino` | `border-origen-pradera/30` |
| `shipped` | `bg-blue-50` | `text-blue-700` | `border-blue-200` |
| `delivered` | `bg-green-50` | `text-green-700` | `border-green-200` |
| `cancelled` | `bg-red-50` | `text-red-700` | `border-red-200` |
| `refunded` | `bg-orange-50` | `text-orange-700` | `border-orange-200` |

#### 4.3 — Refactorizar `OrderStats` con variante móvil
```
src/app/dashboard/orders/components/OrderStats.tsx
```
- Actualmente: `grid-cols-2 md:grid-cols-4 lg:grid-cols-8` con 8 tarjetas = 4 filas en móvil (terrible)
- Solución: En móvil, mostrar sólo 4 KPIs principales en `MobileKPIRow`: Total, Ingresos, Pendientes, Entregados
- Los 4 KPIs secundarios (procesando, enviados, hoy, cancelados) en un bloque expandible `Mostrar más estadísticas`

#### 4.4 — `OrderFilters` con chips en móvil
```
src/app/dashboard/orders/components/OrderFilters.tsx
```
- Sin ver el código actual (leer si necesario), aplicar el mismo patrón que HV03:
- Estado como `ScrollChipFilter`, búsqueda visible, fechas en `Filtros +`

#### 4.5 — Actualizar `orders/page.tsx`
- En móvil (`lg:hidden`): mostrar `OrderCard` list
- En desktop (`hidden lg:block`): mantener `OrdersTable`
- Usar CSS responsive para el switch: no estado JS, sólo clases Tailwind

```tsx
{/* Vista móvil */}
<div className="lg:hidden space-y-3">
  {orders.map(order => <OrderCard key={order.id} order={order} onViewDetails={handleViewDetails} />)}
</div>
{/* Vista desktop */}
<div className="hidden lg:block">
  <OrdersTable orders={orders} ... />
</div>
```

### Tests de aceptación
- [ ] En iPhone 14: `OrderCard` muestra toda la info sin truncar el nombre del cliente
- [ ] En iPad: `OrdersTable` sigue apareciendo con todas las columnas
- [ ] `OrderStatusChip` visualmente diferente de los badges grises actuales
- [ ] En iPhone SE: `OrderStats` sólo muestra 4 KPIs en fila horizontal scrollable

---

## ▶ HV05 — Reseñas: Cards Compactas + Bottom Sheet de Respuesta
### Estado: `pendiente` | Dependencia: HV01 + HV02 | Duración estimada: 2 sesiones

**Objetivo:** Los `ReviewCard` actuales pueden medir 600-800px de alto en móvil (avatar + stars + contenido + respuesta + imágenes + botones). Necesitan compactación y el formulario de respuesta debe salir como bottom sheet.

### Tareas

#### 5.1 — `ReviewCard` — Rediseño compacto para móvil
```
src/app/dashboard/reviews/components/ReviewCard.tsx   (nuevo, extrae de ReviewsList)
```

**Diseño compacto:**
```
┌─────────────────────────────────────────────────────┐
│ ●  María G.    ★★★★☆  [PENDIENTE]       hace 2 días│
│    Queso curado artesanal                           │
│─────────────────────────────────────────────────────│
│ "El queso es increíble, lo mejor que he probado..." │
│                                    [Ver más ▼]      │
│─────────────────────────────────────────────────────│
│ [👍 Útil]  [🚩 Reportar]          [💬 Responder]   │
└─────────────────────────────────────────────────────┘
```

Cambios respecto al diseño actual:
- Reducir avatar de `w-10 h-10` a `w-8 h-8` en móvil
- Eliminar el campo de email del autor (irrelevante para el productor)
- Rating en línea con el nombre (ahorra 1 fila completa)
- Chip del producto como texto inline, no `Badge` grande
- Eliminar sección de imágenes adjuntas del card principal → accesible desde "Ver más"
- Respuesta existente: colapsada por defecto con `border-l-2 border-origen-pradera pl-3`

#### 5.2 — `ReviewResponseSheet` — Bottom sheet de respuesta
```
src/app/dashboard/reviews/components/ReviewResponseSheet.tsx
```
Reemplaza el formulario inline actual que aparece dentro de la tarjeta:

- `fixed inset-x-0 bottom-0 z-50` con `rounded-t-3xl`
- Overlay con `backdrop-blur-sm bg-black/40`
- Textarea con placeholder contextual: `"Responde a la reseña de {authorName}..."`
- Contador de caracteres `{n}/500`
- Botones: Cancelar (gris) + Enviar (bg-origen-bosque)
- `drag-handle` pill en la parte superior
- Animación: `initial={{ y: '100%' }} animate={{ y: 0 }}` con Framer Motion

#### 5.3 — `ReviewFilters` con chips en móvil
Refactorizar usando `ScrollChipFilter` para los estados:
- Chips: Todos / Pendientes / Aprobadas / Rechazadas / Reportadas
- Ocultar filtros avanzados (tipo, rating, verificado) tras botón `Filtros +`

#### 5.4 — `ReviewStats` compacto en móvil
Sin ver el código actual (aplicar mismo patrón):
- En móvil: `MobileKPIRow` con 4 métricas principales
- Rating promedio destacado con stars visuales

#### 5.5 — Actualizar `reviews/page.tsx`
- Reemplazar uso de `ReviewsList` (monolítico) por iteración de `ReviewCard` + `ReviewResponseSheet`
- Simplificar la gestión de estado de respuesta al nivel de página

### Tests de aceptación
- [ ] En iPhone 14: cada `ReviewCard` mide máx 200px de alto (sin expand)
- [ ] El bottom sheet de respuesta no bloquea el teclado virtual (scroll correcto)
- [ ] Los chips de filtro de estado caben en 375px sin wrap
- [ ] La respuesta existente está colapsada por defecto

---

## ▶ HV06 — Notificaciones: Rediseño Nativo Móvil
### Estado: `pendiente` | Dependencia: HV01 | Duración estimada: 1 sesión

**Objetivo:** La pantalla de notificaciones es simple pero tiene problemas de densidad en móvil: el `CardContent p-6` más los iconos y descripciones crean filas muy altas. El botón de guardar está perdido al final. Las tabs de `email/push` son funcionales pero podrían sentirse más nativas.

### Tareas

#### 6.1 — Reducir padding de toggles
```
src/app/dashboard/notifications/page.tsx
```
- `CardContent className="p-6 space-y-6"` → `className="p-4 space-y-4 sm:p-6 sm:space-y-6"`
- Cada fila de toggle: el icono de la izquierda baja de `w-5 h-5` a `w-4 h-4`

#### 6.2 — `NotificationToggleRow` — Componente extraído
```
src/components/shared/mobile/NotificationToggleRow.tsx
```
Separa la lógica de cada fila de toggle para mejor mantenibilidad:
```tsx
interface NotificationToggleRowProps {
  icon: React.ElementType
  iconColor: string          // ej: 'text-origen-pradera'
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}
```
En móvil: descripción en `text-xs` (no `text-sm`), icono más pequeño, padding `py-3` en vez de sin padding.

#### 6.3 — Segmented Control para Email/Push
Reemplazar `TabsList` de shadcn por un control segmentado nativo:
```tsx
// src/components/shared/mobile/SegmentedControl.tsx
// Diseño: bg-origen-bosque/10 rounded-xl, botón activo con bg-origen-bosque text-white pill
// Touch target mínimo 44px de alto
```

#### 6.4 — Botón Guardar — Sticky en móvil
```tsx
{/* En móvil: sticky al bottom con safe-area */}
<div className="lg:hidden fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-0 right-0 px-4 z-40">
  <Button onClick={handleSave} className="w-full">
    <Save className="w-4 h-4 mr-2" />
    Guardar preferencias
  </Button>
</div>

{/* En desktop: en el PageHeader como actualmente */}
<div className="hidden lg:block">
  {/* botón normal en el PageHeader */}
</div>
```

#### 6.5 — Sección de canal de comunicación preferente
Añadir una tarjeta informativa al inicio de la página con el canal principal configurado:
```
┌──────────────────────────────────────────────────────┐
│  📬 Canal principal: Email                           │
│  Las notificaciones urgentes siempre llegarán         │
│  a tu correo registrado.                             │
└──────────────────────────────────────────────────────┘
```

### Tests de aceptación
- [ ] En iPhone SE (375px): los toggles no tienen overflow horizontal
- [ ] El botón guardar es visible sin scrollear en móvil
- [ ] Las tabs de email/push tienen touch target ≥ 44px
- [ ] Las descripciones de texto no generan líneas de más de 2 en 375px

---

## Resumen de Archivos por Hito

### Archivos nuevos a crear
```
src/components/shared/mobile/
  ScrollChipFilter.tsx           (HV02)
  MobileStatCard.tsx             (HV02)
  MobileKPIRow.tsx               (HV02)
  EmptyState.tsx                 (HV02)
  SectionTitle.tsx               (HV02)
  NotificationToggleRow.tsx      (HV06)
  SegmentedControl.tsx           (HV06)

src/app/dashboard/products/components/
  ProductMobileList.tsx          (HV03)

src/app/dashboard/orders/components/
  OrderCard.tsx                  (HV04)
  OrderStatusChip.tsx            (HV04)

src/app/dashboard/reviews/components/
  ReviewCard.tsx                 (HV05)
  ReviewResponseSheet.tsx        (HV05)
```

### Archivos modificados
```
src/app/dashboard/products/page.tsx
src/app/dashboard/orders/page.tsx
src/app/dashboard/reviews/page.tsx
src/app/dashboard/notifications/page.tsx
src/app/dashboard/products/components/ProductStats.tsx
src/app/dashboard/products/components/ProductFilters.tsx
src/app/dashboard/orders/components/OrderStats.tsx
src/app/dashboard/orders/components/OrderFilters.tsx
src/app/dashboard/reviews/components/ReviewFilters.tsx
src/app/dashboard/reviews/components/ReviewsList.tsx
```

---

## Criterios de diseño comunes a todos los hitos

### Tokens de marca a aplicar consistentemente
```css
/* Fondos */
bg-surface             /* Página principal */
bg-surface-alt         /* Tarjetas / inputs */

/* Texto */
text-origen-bosque     /* Títulos, valores importantes */
text-text-subtle       /* Subtítulos, etiquetas KPI */
text-text-disabled     /* Texto deshabilitado / placeholders */

/* Bordes */
border-border-subtle   /* Bordes de tarjetas */

/* Interactivos */
bg-origen-bosque       /* Botón primario */
bg-origen-pradera      /* Acento / chips activos */
bg-origen-pastel       /* Fondo chips inactivos */
text-origen-pino       /* Texto chips inactivos */
```

### Reglas de espaciado mobile
```
Padding horizontal página: px-4 (móvil) → px-6 (tablet) → px-8 (desktop)
Padding vertical página:   py-5 (móvil) → py-6 (tablet) → py-8 (desktop)
Gap entre secciones:       space-y-5 (móvil) → space-y-6 (tablet) → space-y-8 (desktop)
Padding tarjetas:          p-3 sm:p-4 (compactas) / p-4 sm:p-6 (normales)
```

### Tamaños de fuente en móvil
```
Valor KPI:      text-lg font-bold      (no text-2xl — desborda en 2 columnas)
Etiqueta KPI:   text-[11px] font-medium
Nombre item:    text-sm font-semibold  (no text-base)
Descripción:    text-xs                (no text-sm)
SKU / meta:     text-[10px] sm:text-xs
```

### Touch targets
```
Botones: min-h-[44px] (Apple HIG) / min-h-[48px] (Material Design)
Chips:   py-1.5 px-3 (mínimo 36px alto — aceptable en filtros compactos)
Toggles: min-h-[44px] para toda la fila
```

### Animaciones
```
Tap/press: whileTap={{ scale: 0.97 }}  (tarjetas) / scale: 0.95 (chips)
Entrada:   initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
Bottom sheet: initial={{ y: '100%' }} animate={{ y: 0 }} — spring stiffness 400
```

---

## Prioridad de despliegue recomendada

```
Semana 1: HV01 (base) → HV02 (componentes)
Semana 2: HV04 (pedidos — más crítico) → HV03 (productos)
Semana 3: HV05 (reseñas) → HV06 (notificaciones)
```

**HV04 primero** porque `OrdersTable` sin fallback móvil es el mayor bloqueador de usabilidad.

---

*Plan generado con análisis directo del código fuente · origen-dashboard · Marzo 2026*
