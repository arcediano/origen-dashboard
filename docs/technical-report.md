# Informe Técnico Detallado — origen-dashboard (v2.0.0)

> **Fecha:** 17 de marzo de 2026  
> **Versión analizada:** 2.0.0  
> **Framework:** Next.js 15 (App Router) · TypeScript 5.6 · React 18  
> **Autor del análisis:** GitHub Copilot

---

## Índice

1. [Visión General de la Arquitectura](#1-visión-general-de-la-arquitectura)
2. [Estructura de Rutas y Páginas](#2-estructura-de-rutas-y-páginas)
3. [Sistema de Autenticación y Seguridad de Sesión](#3-sistema-de-autenticación-y-seguridad-de-sesión)
4. [Capa de Comunicación con el Backend (API Client)](#4-capa-de-comunicación-con-el-backend-api-client)
5. [Módulos de API por Dominio](#5-módulos-de-api-por-dominio)
6. [Flujo de Onboarding (6 pasos)](#6-flujo-de-onboarding-6-pasos)
7. [Módulo de Productos](#7-módulo-de-productos)
8. [Módulo de Pedidos](#8-módulo-de-pedidos)
9. [Módulo de Reseñas](#9-módulo-de-reseñas)
10. [Módulo de Notificaciones](#10-módulo-de-notificaciones)
11. [Integración con Stripe Connect](#11-integración-con-stripe-connect)
12. [API Routes Internas de Next.js](#12-api-routes-internas-de-nextjs)
13. [Estado Global y Providers](#13-estado-global-y-providers)
14. [Hooks Personalizados](#14-hooks-personalizados)
15. [Sistema de Tipos TypeScript](#15-sistema-de-tipos-typescript)
16. [Componentes UI y Diseño](#16-componentes-ui-y-diseño)
17. [Configuración del Proyecto](#17-configuración-del-proyecto)
18. [Análisis de Mejoras: Orden, Rendimiento y Seguridad](#18-análisis-de-mejoras-orden-rendimiento-y-seguridad)

---

## 1. Visión General de la Arquitectura

`origen-dashboard` es un **panel de administración para productores** del marketplace Origen. Permite a los vendedores gestionar su catálogo, pedidos, reseñas, notificaciones y configuración de pagos.

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15.1 (App Router) |
| Lenguaje | TypeScript 5.6 |
| UI base | React 18.3 |
| Estilos | Tailwind CSS 3.4 + `tailwind-merge` + `clsx` |
| Componentes | Radix UI (accordion, checkbox, dialog, dropdown, label, progress, radio-group, select, separator, slot, tabs, toast) |
| Animaciones | Framer Motion 12 |
| Formularios | React Hook Form 7 + Zod 3 + `@hookform/resolvers` |
| Gráficas | Recharts 2 |
| Iconografía | Lucide React 0.468 |
| Notificaciones toast | Sonner 1.7 |
| Pagos | Stripe SDK 17 (servidor) |
| JWT (Edge) | `jose` (verificación RS256 en middleware) |
| Upload de archivos | `react-dropzone` 15 |
| Fechas | `date-fns` 4 |

### Diagrama de capas

```
Browser
  │
  ├── Middleware (Edge Runtime) ─────────── Verificación JWT RS256 local
  │
  ├── Next.js App Router
  │     ├── Pages (Client Components)
  │     ├── API Routes (Node.js Runtime)
  │     └── Providers → AuthContext
  │
  ├── Capa de API (src/lib/api/)
  │     ├── client.ts       → gatewayClient (fetch wrapper universal)
  │     ├── auth.ts         → Operaciones de autenticación
  │     ├── onboarding.ts   → Pasos del onboarding (REAL)
  │     ├── media.ts        → Subida de archivos a S3
  │     ├── products.ts     → CRUD de productos (MOCK)
  │     ├── orders.ts       → Gestión de pedidos (MOCK)
  │     ├── reviews.ts      → Gestión de reseñas (MOCK)
  │     └── notifications.ts→ Sistema de notificaciones (MOCK)
  │
  └── API Gateway (origen-gateway)
        ├── /auth/*          → auth-service
        ├── /producers/*     → producers-service
        ├── /media/upload    → producers-service / S3
        └── /products/*      → products-service (pendiente integración)
```

---

## 2. Estructura de Rutas y Páginas

### Rutas públicas (sin autenticación requerida)

| Ruta | Descripción |
|---|---|
| `/` | Landing page principal |
| `/auth/login` | Formulario de inicio de sesión |
| `/auth/register` | Landing de captación + formulario de registro de productor |
| `/auth/forgot-password` | Recuperación de contraseña |
| `/aviso-legal`, `/privacidad`, `/cookies`, `/terminos` | Páginas legales |
| `/casos-exito`, `/como-funciona`, `/ayuda`, `/soporte`, `/contacto` | Páginas informativas |

### Rutas protegidas (`/dashboard/*`)

| Ruta | Descripción |
|---|---|
| `/dashboard` | Panel principal con métricas KPI y actividad reciente |
| `/dashboard/products` | Catálogo de productos con filtros y paginación |
| `/dashboard/products/create` | Formulario multi-paso de creación de producto (7 pasos) |
| `/dashboard/products/[id]` | Edición de producto existente |
| `/dashboard/orders` | Listado de pedidos con filtros |
| `/dashboard/orders/[id]` | Detalle de pedido individual |
| `/dashboard/reviews` | Panel de gestión de reseñas |
| `/dashboard/business` | Información del negocio |
| `/dashboard/profile` | Perfil personal del productor |
| `/dashboard/profile/personal` | Datos personales |
| `/dashboard/profile/business` | Datos del negocio |
| `/dashboard/profile/certifications` | Certificaciones del productor |
| `/dashboard/profile/settings` | Preferencias |
| `/dashboard/configuracion` | Configuración general |
| `/dashboard/configuracion/envios` | Configuración de envíos |
| `/dashboard/configuracion/pagos` | Configuración de pagos |
| `/dashboard/configuracion/perfil` | Perfil de configuración |
| `/dashboard/notifications` | Preferencias de notificaciones |
| `/dashboard/security` | Seguridad (contraseña y preferencias) |

### Ruta especial

| Ruta | Descripción |
|---|---|
| `/onboarding` | Flujo de alta de 6 pasos (solo si `onboardingCompleted: false`) |

### API Routes internas

| Ruta | Método | Descripción |
|---|---|---|
| `/api/keepalive` | GET | Ping a los servicios de Render (desarrollo) |
| `/api/stripe/connect` | POST | Crear cuenta Stripe Connect Express |
| `/api/sellers/register` | POST | Registro inicial de vendedor (stub) |

---

## 3. Sistema de Autenticación y Seguridad de Sesión

### 3.1 Middleware (Edge Runtime)

**Archivo:** [middleware.ts](middleware.ts)

El middleware se ejecuta **antes** de cualquier render de Next.js, en el Edge Runtime (V8 Isolates, sin Node.js APIs).

#### Flujo de validación

```
Request llega
    │
    ├─ ¿Ruta protegida? (/dashboard/*)
    │     ├─ Sin cookie accessToken → redirect /auth/login?next={path}
    │     └─ Con cookie accessToken
    │           ├─ JWT válido (RS256) → NextResponse.next()
    │           └─ JWT inválido/expirado
    │                 → delete cookie + redirect /auth/login?reason=expired
    │
    └─ ¿Ruta de auth? (/auth/login, /auth/register)
          ├─ Sin cookie → NextResponse.next()
          └─ Con cookie válida → redirect /dashboard
```

**Puntos clave de seguridad:**
- La clave pública RS256 (`JWT_PUBLIC_KEY`) se importa **una sola vez por instancia** del worker Edge y se cachea en memoria (`_cachedPublicKey`).
- **No se renueva el token automáticamente** (política fail-secure para app de administración).
- `jose.jwtVerify` valida automáticamente `exp` y `nbf`.
- Tokens `HttpOnly` → nunca accesibles desde JavaScript del navegador.

### 3.2 AuthContext

**Archivo:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

Proveedor React que gestiona el estado de autenticación en toda la aplicación cliente.

#### Estado expuesto

```typescript
{
  user: AuthUser | null,        // Datos del usuario autenticado
  isLoading: boolean,           // Cargando sesión inicial
  error: string | null,         // Error (solo errores reales, no 401)
  isAuthenticated: boolean,     // !!user
  isProducer: boolean,          // user.role === 'PRODUCER'
  refreshUser(): Promise<void>,
  setUserFromLogin(email): Promise<AuthUser>,
  setUser(user): void,
  clearUser(): void
}
```

#### Flujo de carga inicial

```
AuthProvider.mount()
    │
    └─ useEffect (solo una vez, !hasTriedLoad && !user)
          │
          └─ refreshUser()
                ├─ GET /auth/userinfo → setUser(userData)
                └─ Error 401 → setUser(null) [silencioso, no setError]
                   Error real → setError(message)
```

#### Mecanismos de cierre de sesión forzado

| Trigger | Mecanismo | Tiempo |
|---|---|---|
| Token expirado (401 desde cliente HTTP) | `window.dispatchEvent('session:expired')` → listener en AuthContext | Inmediato |
| Inactividad del usuario | `useInactivityTimeout` → `handleForceLogout('inactivity')` | 15 min |
| Pestaña oculta prolongada | `useSessionVisibilityGuard` → `handleForceLogout('hidden')` | 30 min |
| Logout manual | `logoutUser()` → `clearUser()` → redirect | Inmediato |

#### `setUserFromLogin` — Reintentos automáticos post-login

Tras el login, existe una ventana de tiempo en la que el gateway puede no haber sincronizado el token. El método usa una estrategia de **reintentos con backoff lineal**:

```
Intento 1 → espera 300ms → Intento 2 → espera 600ms → Intento 3 → throw
```

### 3.3 DashboardLayout — Doble capa de protección

**Archivo:** [src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx)

A pesar de que el middleware ya protege las rutas, el layout añade una **segunda verificación client-side** que redirige a `/auth/login` si:
- `isLoading` es false Y `isAuthenticated` es false → no hay sesión
- `isLoading` es false Y `!isProducer` → el usuario no tiene rol PRODUCER

Esta doble capa evita estados intermedios visibles en pantalla.

---

## 4. Capa de Comunicación con el Backend (API Client)

**Archivo:** [src/lib/api/client.ts](src/lib/api/client.ts)

### `gatewayClient` — Wrapper HTTP centralizado

Todos los módulos de API usan exclusivamente este cliente en lugar de llamar a `fetch` directamente.

```
URL base: NEXT_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000'
Prefijo:  /api/v1{path}
```

#### Características

| Feature | Implementación |
|---|---|
| Serialización automática de `params` | `URLSearchParams` |
| Cookies HttpOnly automáticas (browser) | `credentials: 'include'` |
| Reenvío manual de cookies (SSR) | Header `Cookie` via `options.cookies` |
| Content-Type / Accept JSON | Headers por defecto |
| Parsing JSON condicional | Según `content-type` de la respuesta |
| Error uniformado | `throw new GatewayError(status, message, data)` |
| Manejo 401 con debounce | `dispatchSessionExpired()` — debounce 1s |
| No-renovación de token | Política explícita: cualquier 401 → logout |

#### `GatewayError`

```typescript
class GatewayError extends Error {
  status: number;   // HTTP status code
  data?: unknown;   // Cuerpo completo de la respuesta de error
}
```

#### Métodos expuestos

```typescript
gatewayClient.get<T>(path, options?)
gatewayClient.post<T>(path, body?, options?)
gatewayClient.put<T>(path, body?, options?)
gatewayClient.patch<T>(path, body?, options?)
gatewayClient.delete<T>(path, options?)
```

#### Debounce de `session:expired`

Cuando varias peticiones simultáneas reciben 401, sin debounce se dispararían múltiples eventos `session:expired` y múltiples redirecciones. La función `dispatchSessionExpired()` usa `window.lastSessionExpiredTime` para filtrar eventos con menos de 1 segundo de diferencia.

---

## 5. Módulos de API por Dominio

### 5.1 `auth.ts` — Autenticación

**Archivo:** [src/lib/api/auth.ts](src/lib/api/auth.ts)

| Función | Endpoint | Estado |
|---|---|---|
| `registerProducer(params)` | `POST /auth/register` | ✅ Real |
| `loginUser(params)` | `POST /auth/login` | ✅ Real |
| `logoutUser()` | `POST /auth/logout` | ✅ Real |
| `refreshTokens()` | `POST /auth/refresh` | ✅ Real (no usado activamente) |
| `getCurrentUser()` | `GET /auth/userinfo` | ✅ Real |
| `requestPasswordReset(email)` | `POST /auth/forgot-password` | ✅ Real |

El tipo `AuthUser` incluye: `id`, `email`, `firstName`, `lastName`, `role`, `producerCode`, `onboardingCompleted`, `createdAt`, `updatedAt`.

### 5.2 `onboarding.ts` — Onboarding de productor

**Archivo:** [src/lib/api/onboarding.ts](src/lib/api/onboarding.ts)

| Función | Endpoint | Estado |
|---|---|---|
| `saveStep1(data, locationImageKeys)` | `POST /producers/onboarding/step/1` | ✅ Real |
| `saveStep2(data, teamPhotoKeys)` | `POST /producers/onboarding/step/2` | ✅ Real |
| `saveStep3(keys)` | `POST /producers/onboarding/step/3` | ✅ Real |
| `saveStep4(data)` | `POST /producers/onboarding/step/4` | ✅ Real |
| `saveStep5(data, keys)` | `POST /producers/onboarding/step/5` | ✅ Real |
| `saveStep6(data)` | `POST /producers/onboarding/step/6` | ✅ Real |
| `completeOnboarding()` | `POST /producers/onboarding/complete` | ✅ Real |
| `loadOnboardingData()` | `GET /producers/onboarding/data` | ✅ Real |

### 5.3 `media.ts` — Subida de archivos

**Archivo:** [src/lib/api/media.ts](src/lib/api/media.ts)

| Función | Endpoint | Estado |
|---|---|---|
| `uploadFile(file, category)` | `POST /media/upload` (multipart/form-data) | ✅ Real |

Los archivos de tipo `visual/*` van al bucket S3 **público** (retorna `url`), mientras que los `documents/*` van al bucket **privado** (retorna `url: null`).

### 5.4 `products.ts` — Catálogo de productos

**Archivo:** [src/lib/api/products.ts](src/lib/api/products.ts)

> ⚠️ **Estado: MOCK completo** — Todos los datos provienen de `MOCK_PRODUCTS`. Los delays artificiales simulan latencia de red (400–800ms).

| Función | Descripción |
|---|---|
| `fetchProducts(params?)` | Lista paginada con filtros (search, category, status, stock, sortBy) |
| `fetchProductById(id)` | Producto individual |
| `fetchProductStats()` | Estadísticas agregadas (total, activos, stock bajo, agotados, ingresos, rating) |
| `createProduct(formData)` | Crea producto (genera ID, SKU, slug localmente) |
| `updateProduct(id, data)` | Actualiza producto |
| `deleteProduct(id)` | Elimina producto |
| `saveProductDraft(formData)` | Guarda borrador en localStorage |
| `suggestSku(name, categoryId)` | Genera sugerencia de SKU |
| `validateProductForm(formData)` | Validación del formulario antes de enviar |

El **filtrado** y la **paginación** se realizan completamente en el cliente sobre el array en memoria. El **ordenamiento** soporta: `newest`, `oldest`, `name-asc/desc`, `price-asc/desc`, `stock-asc/desc`, `sales-desc`.

### 5.5 `orders.ts` — Pedidos

**Archivo:** [src/lib/api/orders.ts](src/lib/api/orders.ts)

> ⚠️ **Estado: MOCK completo** con datos de muestra para diferentes estados de pedido.

| Función | Descripción |
|---|---|
| `fetchOrders(params?)` | Lista paginada con filtros |
| `fetchOrderById(id)` | Detalle de un pedido |
| `fetchOrderStats()` | Estadísticas de pedidos |
| `updateOrderStatus(id, status)` | Actualiza estado del pedido |
| `addTrackingNumber(id, data)` | Añade número de seguimiento |

### 5.6 `reviews.ts` — Reseñas

**Archivo:** [src/lib/api/reviews.ts](src/lib/api/reviews.ts)

> ⚠️ **Estado: MOCK completo** — Incluye reseñas de producto y de productor con diferentes estados.

| Función | Descripción |
|---|---|
| `fetchReviews(params?)` | Lista con filtros y estadísticas |
| `approveReview(id)` | Aprueba reseña pendiente |
| `rejectReview(id, reason?)` | Rechaza reseña |
| `respondToReview(id, content)` | Responde a una reseña |
| `flagReview(id, reason, description?)` | Reporta reseña inapropiada |

### 5.7 `notifications.ts` — Notificaciones

**Archivo:** [src/lib/api/notifications.ts](src/lib/api/notifications.ts)

> ⚠️ **Estado: MOCK en memoria** — Array mutable `currentNotifications` que persiste durante la sesión.

| Función | Descripción |
|---|---|
| `fetchNotifications(params?)` | Lista paginada con filtros y stats |
| `markAsRead(id)` | Marca como leída |
| `markAllAsRead()` | Marca todas como leídas |
| `deleteNotification(id)` | Elimina notificación |

---

## 6. Flujo de Onboarding (6 pasos)

**Archivo:** [src/app/onboarding/page.tsx](src/app/onboarding/page.tsx)

El onboarding es el flujo de alta obligatorio para productores nuevos (`user.onboardingCompleted === false`). Se compone de 6 pasos secuenciales con animaciones de transición (Framer Motion).

### Pasos del onboarding

| Paso | Título | Tiempo estimado | Datos |
|---|---|---|---|
| 1 | Ubicación | ~2 min | Dirección, provincia, categorías, año fundación, tamaño equipo, fotos de ubicación |
| 2 | Historia | ~3 min | Nombre del negocio, tagline, descripción, filosofía, valores, certificaciones, fotos del equipo |
| 3 | Perfil visual | ~2 min | Logo, banner, vídeo de presentación |
| 4 | Capacidad y logística | ~2 min | Ruta origen, pedido mínimo, packaging, opciones de envío, zonas |
| 5 | Documentos | ~3 min | CIF, seguro RC, certificado manipulador de alimentos, documentos de certificaciones |
| 6 | Pagos (Stripe) | ~5 min | Conexión cuenta Stripe Express, aceptación de términos |

### Flujo de guardado por paso

```
Usuario completa paso N
    │
    ├─ Archivos (imágenes/documentos)
    │     └─ uploadFile(file, category) → S3 via /media/upload
    │           └─ Retorna { key, url }
    │
    └─ saveStepN(formData, fileKeys)
          └─ POST /producers/onboarding/step/N
                └─ { success: boolean }
```

### Flujo de completar onboarding

```
Paso 6 guardado correctamente
    │
    └─ completeOnboarding()
          └─ POST /producers/onboarding/complete
                └─ { success: boolean, onboardingCompleted: boolean }
                      │
                      └─ refreshUser() → usuario.onboardingCompleted = true
                            └─ router.push('/dashboard')
```

---

## 7. Módulo de Productos

### 7.1 Página de listado

**Archivo:** [src/app/dashboard/products/page.tsx](src/app/dashboard/products/page.tsx)

#### Flujo de carga

```
ProductosPage.mount()
    │
    ├─ fetchProducts(filters) → setProducts
    └─ fetchProductStats()  → setStats
```

El componente usa el hook `useProductFilters` para gestionar el estado de filtros **client-side** y el hook `useProductStats` para las métricas de cabecera.

#### Acciones disponibles

| Acción | Dialog | Llamada API |
|---|---|---|
| Crear producto | — | router.push('/dashboard/products/create') |
| Editar producto | — | router.push('/dashboard/products/[id]') |
| Ajustar stock | `AdjustStockDialog` | `updateProduct` (mock) |
| Eliminar producto | `DeleteProductDialog` | `deleteProduct` (mock) |
| Ver detalle | — | router.push('/dashboard/products/[id]') |

### 7.2 Formulario de creación/edición (7 pasos)

**Hook:** [src/hooks/useProductForm.ts](src/hooks/useProductForm.ts)  
**Página:** [src/app/dashboard/products/create/page.tsx](src/app/dashboard/products/create/page.tsx)

#### Pasos del formulario

| Paso | Componente | Campos clave |
|---|---|---|
| 1 | `StepBasic` | Nombre, descripción corta, descripción completa, categoría, subcategoría, tags |
| 2 | `StepImages` | Galería de imágenes (react-dropzone), imagen principal |
| 3 | `StepPricing` | Precio base, precio de comparación, escalas de precio (`PriceTier`) |
| 4 | `StepNutritional` | Información nutricional (solo para categorías alimenticias) |
| 5 | `StepProduction` | Información de producción, origen, método |
| 6 | `StepInventory` | SKU, barcode, stock, umbral de stock bajo, dimensiones, peso |
| 7 | `StepCertificationsAttributes` | Certificaciones, atributos personalizados |

#### Autosave en creación

```
formData cambia
    │
    └─ useEffect (debounce 2s)
          └─ saveProductDraft(formData)
                └─ localStorage[STORAGE_KEY]
```

#### Flujo de publicación

```
handlePublish()
    │
    ├─ validateProductForm(formData) → errors?
    │
    └─ isEditMode?
          ├─ YES → updateProduct(productId, formDataToProduct(formData))
          └─ NO  → createProduct(formData)
                      └─ Genera ID, SKU, slug localmente (MOCK)
                            └─ router.push('/dashboard/products')
```

### 7.3 Hook `useProductFilters`

**Archivo:** [src/hooks/useProductFilters.ts](src/hooks/useProductFilters.ts)

Gestiona los estados de filtrado **en memoria** con `useMemo` para recalcular los productos filtrados y paginados solo cuando cambian los filtros o el array de productos. No realiza ninguna llamada a la API.

```
products[]
    │
    └─ useMemo
          ├─ filter(searchQuery)     → texto libre en nombre y SKU
          ├─ filter(selectedCategory)
          ├─ filter(selectedStatus)
          ├─ filter(selectedStock)
          ├─ sort(sortBy)
          └─ paginate(currentPage, ITEMS_PER_PAGE=10)
```

---

## 8. Módulo de Pedidos

**Archivos:** [src/app/dashboard/orders/page.tsx](src/app/dashboard/orders/page.tsx), [src/lib/api/orders.ts](src/lib/api/orders.ts)

### Flujo de carga

```
OrdersPage.mount() || filtros cambian
    │
    └─ fetchOrders({ page, limit: 10, filters })
          └─ MOCK: filtra/ordena en memoria + delay 600ms
                └─ { orders, stats, totalPages, total }
```

### Estados de pedido

```
pending → processing → shipped → delivered
                ↘           ↘
              cancelled    refunded
```

### Detalle de pedido (`/dashboard/orders/[id]`)

Carga el pedido completo incluyendo `timeline` (historial de cambios de estado), información de envío con tracking, datos del cliente y líneas de pedido.

---

## 9. Módulo de Reseñas

**Archivo:** [src/lib/api/reviews.ts](src/lib/api/reviews.ts)

### Tipos de reseña

- `product` — Reseña sobre un producto específico
- `producer` — Reseña sobre el productor/vendedor

### Estados de moderación

```
pending → approved
       ↘
        rejected
pending/approved → flagged (reporte de usuario)
```

### Flujo de moderación

```
ReviewsPage
    │
    ├─ fetchReviews(filters) → { reviews, stats, totalPages }
    │
    ├─ approveReview(id)   → status: 'approved'
    ├─ rejectReview(id)    → status: 'rejected'
    ├─ respondToReview(id) → review.response = { ... }
    └─ flagReview(id)      → review.flags.push({ ... })
```

---

## 10. Módulo de Notificaciones

**Archivo:** [src/lib/api/notifications.ts](src/lib/api/notifications.ts)

### Tipos de notificación

| Tipo | Descripción |
|---|---|
| `product` | Stock agotado, stock bajo |
| `order` | Nuevo pedido, pedido enviado |
| `certification` | Certificación aceptada, por caducar |
| `system` | Documentación requerida, mensajes del sistema |

Las notificaciones se almacenan en el módulo en una variable `currentNotifications` (array en memoria), lo que simula persistencia durante la sesión pero se pierde al recargar.

La página `/dashboard/notifications` gestiona **preferencias** (email/push) y es independiente del listado de notificaciones del bell icon del header.

---

## 11. Integración con Stripe Connect

**Archivos:** [src/lib/stripe/config.ts](src/lib/stripe/config.ts), [src/lib/stripe/server.ts](src/lib/stripe/server.ts)

### Configuración

| Parámetro | Variable de entorno |
|---|---|
| Clave pública | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Clave secreta | `STRIPE_SECRET_KEY` |
| Webhook secret | `STRIPE_WEBHOOK_SECRET` |
| Comisión plataforma | `STRIPE_PLATFORM_FEE_PERCENT` (15% por defecto) |
| URL base | `NEXT_PUBLIC_APP_URL` |
| País | ES (España) |
| Tipo cuenta | `express` |
| API version | `2024-12-18.acacia` |

### Flujo de onboarding Stripe (Paso 6)

```
Paso 6 del onboarding
    │
    └─ POST /api/stripe/connect
          ├─ createConnectAccount(sellerId, email, businessName)
          │     └─ stripe.accounts.create({ type: 'express', country: 'ES' })
          └─ createAccountLink(account.id)
                └─ stripe.accountLinks.create({
                     refresh_url: /onboarding/stripe/refresh,
                     return_url:  /onboarding/stripe/complete,
                     type: 'account_onboarding'
                   })
                     └─ Redirect al formulario de Stripe
```

### Payment Intent con comisión

```
createPaymentIntent(amount, sellerStripeAccountId, orderId)
    └─ stripe.paymentIntents.create({
         amount,
         currency: 'eur',
         application_fee_amount: calculatePlatformFee(amount),  // 15%
         transfer_data: { destination: sellerStripeAccountId }
       })
```

> ⚠️ **Nota:** El guardado de `stripeAccountId` en base de datos tiene un `TODO` comentado — no se persiste actualmente.

---

## 12. API Routes Internas de Next.js

### `GET /api/keepalive`

**Archivo:** [src/app/api/keepalive/route.ts](src/app/api/keepalive/route.ts)

Ruta temporal para el plan gratuito de Render. Hace ping en paralelo (`Promise.allSettled`) a los health endpoints de 4 servicios con timeout de 10 segundos cada uno. Activado por el componente `DevKeepAlive` cuando `NEXT_PUBLIC_DEV_KEEPALIVE=true`.

> ⚠️ Marcado explícitamente como temporal — debe eliminarse al pasar a plan de pago o configurar UptimeRobot externo.

### `POST /api/stripe/connect`

Crea una cuenta Stripe Connect Express para un vendedor. Validación de campos requeridos (`sellerId`, `email`, `businessName`). Devuelve `accountId` y `onboardingUrl`.

### `POST /api/sellers/register`

Stub de registro de vendedor. Valida con Zod (`initialRegistrationSchema`) y devuelve un mock con `id: reg_{timestamp}`. Los `TODO` de guardado en BD y envío de email están pendientes.

---

## 13. Estado Global y Providers

**Archivo:** [src/components/providers/Providers.tsx](src/components/providers/Providers.tsx)

El árbol de providers es minimalista:

```
<html>
  <body>
    <Providers>          ← Solo AuthProvider
      {children}
      <DevKeepAlive />   ← Condicional: NEXT_PUBLIC_DEV_KEEPALIVE=true
    </Providers>
  </body>
</html>
```

No existe un provider de temas, internacionalización, ni estado global de UI (e.g. React Query, Zustand, Redux). Cada página gestiona su propio estado local con `useState` + `useEffect`.

---

## 14. Hooks Personalizados

### `useInactivityTimeout`

**Archivo:** [src/hooks/useInactivityTimeout.ts](src/hooks/useInactivityTimeout.ts)

- Timeout: **15 minutos** de inactividad
- Eventos monitorizados: `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`, `click`, `pointermove`
- Listeners con `{ passive: true }` para no bloquear el scroll
- Usa `useRef` para el callback estable (evita re-registro de listeners)

### `useSessionVisibilityGuard`

**Archivo:** [src/hooks/useSessionVisibilityGuard.ts](src/hooks/useSessionVisibilityGuard.ts)

- Timeout: **30 minutos** con la pestaña oculta
- API: `document.visibilityState` + `visibilitychange` event
- Al volver a `visible`: calcula `elapsed = now - hiddenSince` y cierra sesión si `elapsed >= 30min`

### `useProductFilters`

**Archivo:** [src/hooks/useProductFilters.ts](src/hooks/useProductFilters.ts)

Encapsula toda la lógica de filtrado y paginación client-side. Retorna los productos filtrados, paginados, junto con helpers `hasFilters` y `clearFilters`.

### `useProductForm`

**Archivo:** [src/hooks/useProductForm.ts](src/hooks/useProductForm.ts)

Hook completo para el formulario multi-paso de productos. Gestiona:
- Carga desde API (modo edición) o desde localStorage (modo creación con borrador)
- Autosave cada 2 segundos en localStorage
- Transformaciones bidireccionales `Product ↔ ProductFormData`
- SKU en tiempo real
- Acciones `handleSave`, `handlePublish`, `handleCancel`

### `useResponsive`

**Archivo:** [src/hooks/use-responsive.ts](src/hooks/use-responsive.ts)

Devuelve el breakpoint activo basado en `window.innerWidth` con listener de `resize`.

---

## 15. Sistema de Tipos TypeScript

### Tipos principales

| Archivo | Tipos |
|---|---|
| `types/product.ts` | `Product`, `ProductFormData`, `ProductImage`, `NutritionalInfo`, `PriceTier`, `ProductCertification`, `FormStepId` |
| `types/order.ts` | `Order`, `OrderItem`, `OrderStatus`, `OrderPayment`, `OrderShipping`, `OrderTimeline` |
| `types/review.ts` | `Review`, `ReviewStats`, `ReviewStatus`, `ReviewFilters` |
| `types/notification.ts` | `Notification`, `NotificationsResponse` |
| `types/seller.ts` | `SellerStatus` |
| `types/dashboard.ts` | Tipos para métricas del dashboard |
| `types/document.ts` | `DocumentFile` |

### Validaciones Zod (lib/validations/seller.ts)

| Schema | Uso |
|---|---|
| `initialRegistrationSchema` | Formulario de registro de productor |
| `onboardingStep1Schema` | Validación paso 1 (ubicación) |
| `onboardingStep2Schema` | Validación paso 2 (historia) |
| `onboardingStep3Schema` | Validación paso 3 (visual) |
| `onboardingStep4Schema` | Validación paso 4 (capacidad) |

---

## 16. Componentes UI y Diseño

### Átomos UI (`src/components/ui/atoms/`)

Componentes base construidos sobre Radix UI con Tailwind CSS: `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `Toggle`, `Tabs`, `Dialog`, `Accordion`, `Checkbox`, `RadioGroup`, `Progress`, `Separator`, `Label`, `Tooltip`, `Pagination`, `TagsInput`, `Alert`.

### Componentes compartidos (`src/components/shared/`)

- `PageLoader` — Spinner de carga de página completa
- `PageError` — Estado de error con botón de reintento
- Upload utilities

### Componentes de features (`src/components/features/`)

| Feature | Componentes |
|---|---|
| `auth` | `SimpleLogin`, `SessionExpiredModal`, `AuthFooter` |
| `dashboard` | `DashboardShell`, `WelcomeHeader`, `ProducerCard`, `StatsGrid`, `OrdersSummary`, `TopProducts`, `DashboardTabs` + hooks |
| `onboarding` | `StepLocation`, `StepStory`, `StepVisual`, `StepCapacity`, `StepDocuments`, `StepStripe`, `MobileStepperBar`, `MobileNavBar` |
| `registration` | `SimpleRegistration` |
| `landing` | `HeroSection`, `BenefitsSection`, `ProcessSection`, `TestimonialsSection`, `FinalCTASection` |

### Sistema de diseño

- **Paleta de colores** definida en Tailwind: `origen-bosque`, `origen-pino`, `origen-pradera`, `origen-hoja`, `origen-crema`
- **Tipografía:** Inter (sans) + Lora (serif) — variables CSS
- **Modo oscuro:** No implementado (preparado para futuro con `preferences.theme`)
- **Responsive:** Breakpoints estándar Tailwind + hook `useResponsive`

---

## 17. Configuración del Proyecto

### Variables de entorno

| Variable | Contexto | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_GATEWAY_URL` | Cliente + Servidor | URL base del API Gateway |
| `JWT_PUBLIC_KEY` | Solo Servidor (Edge) | Clave pública RS256 PEM para verificar JWT |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Cliente | Clave pública de Stripe |
| `STRIPE_SECRET_KEY` | Solo Servidor | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Solo Servidor | Secret de webhooks de Stripe |
| `STRIPE_PLATFORM_FEE_PERCENT` | Solo Servidor | Comisión plataforma (default: 15) |
| `NEXT_PUBLIC_APP_URL` | Cliente | URL pública de la aplicación |
| `NEXT_PUBLIC_DEV_KEEPALIVE` | Cliente | Activa el ping de desarrollo a Render |

### `next.config.js` — Puntos notables

- `eslint.ignoreDuringBuilds: true` — Los errores de ESLint no bloquean el build
- `typescript.ignoreBuildErrors: true` — Los errores de TypeScript no bloquean el build
- `serverActions.bodySizeLimit: '10mb'` — Para subidas de archivos grandes
- Dominios de imagen permitidos: `localhost`, `storage.googleapis.com`, `res.cloudinary.com`, `images.unsplash.com`

### Despliegue

El proyecto está configurado para desplegarse en **Vercel** (`vercel.json`). Los servicios de backend corren en **Render** (tier gratuito, de ahí el mecanismo de keepalive).

---

## 18. Análisis de Mejoras: Orden, Rendimiento y Seguridad

### 🔴 Crítico — Seguridad

#### S1. `typescript.ignoreBuildErrors: true` en producción

**Problema:** El build de producción ignora errores de TypeScript, lo que puede introducir bugs silenciosos y vulnerabilidades de tipo.  
**Impacto:** Alto — puede pasar código con errores de tipado a producción.  
**Mejora:**
```javascript
// next.config.js
typescript: {
  ignoreBuildErrors: false  // Activar en producción
}
```

#### S2. `eslint.ignoreDuringBuilds: true` en producción

**Problema:** No se aplican reglas de ESLint en el build, incluyendo reglas de seguridad (`no-eval`, `react-hooks/exhaustive-deps`, etc.).  
**Mejora:** Activar en producción y corregir los warnings pendientes.

#### S3. Falta de autorización en `/api/stripe/connect` y `/api/sellers/register`

**Problema:** Las API Routes de Stripe y de registro no validan que el `Request` provenga de un usuario autenticado antes de procesar la operación.  
**Impacto:** Cualquier llamada no autenticada podría crear cuentas Stripe.  
**Mejora:**
```typescript
// En las API Routes, verificar la sesión antes de procesar:
import { cookies } from 'next/headers';
import { importSPKI, jwtVerify } from 'jose';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');
  if (!token || !(await isValidToken(token.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... resto del handler
}
```

#### S4. `stripeAccountId` no se persiste en base de datos

**Problema:** El `TODO` de guardado del `stripeAccountId` en BD está sin implementar. Si el proceso falla tras crear la cuenta Stripe, se genera una cuenta huérfana.  
**Mejora:** Implementar la llamada al backend antes de devolver la respuesta, usando una transacción o un mecanismo de idempotencia con `idempotencyKey`.

#### S5. `console.log` con datos de usuario en desarrollo

**Problema:** Se imprimen datos del usuario (id, email, role) en consola en modo desarrollo, lo que puede ser un vector de exposición en entornos compartidos o si se activan DevTools en staging.  
**Mejora:** Usar un logger estructurado que pueda activarse/desactivarse y que nunca imprima PII en producción.

---

### 🟠 Alto — Rendimiento

#### P1. Todo el estado de módulos con `useState` + `useEffect` raw — sin caché

**Problema:** Cada página re-fetch los datos cada vez que se monta el componente (e.g., al navegar hacia atrás). No hay caching ni deduplicación de peticiones.  
**Impacto:** Experiencia de usuario degradada, llamadas redundantes al backend.  
**Mejora:** Adoptar **TanStack Query** (React Query) o **SWR** para:
- Caché automático con TTL configurable
- Deduplicación de peticiones en vuelo
- Revalidación en background
- Estados `isLoading`, `isFetching`, `isError` unificados

```typescript
// Ejemplo con TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
  staleTime: 30_000,  // 30 segundos de caché
});
```

#### P2. Filtrado y paginación completamente en el cliente

**Problema:** `fetchProducts` carga **todos** los productos del MOCK y filtra en JS. Cuando se integre la API real, debe delegarse al servidor.  
**Impacto:** Escalabilidad — con catálogos grandes esto no es viable.  
**Mejora:** Pasar los parámetros de filtrado directamente al endpoint:
```typescript
fetchProducts({ page: 1, limit: 10, search: 'queso', sortBy: 'price-asc' })
// → GET /api/v1/products?page=1&limit=10&search=queso&sortBy=price-asc
```

#### P3. Delays artificiales encadenados en llamadas MOCK

**Problema:** Los delays de 400–800ms en los módulos MOCK se suman cuando se hacen llamadas en paralelo (e.g., `fetchProducts` + `fetchProductStats` = hasta 1.4s innecesarios en desarrollo).  
**Mejora:** Ejecutar ambas llamadas en paralelo con `Promise.all`:
```typescript
const [productsRes, statsRes] = await Promise.all([
  fetchProducts(filters),
  fetchProductStats(),
]);
```

#### P4. Framer Motion importado sin optimización de bundle

**Problema:** `framer-motion` v12 tiene un peso considerable. Se importa directamente en múltiples páginas del dashboard.  
**Mejora:** Usar `LazyMotion` + `domAnimation` para cargar solo las features necesarias:
```typescript
import { LazyMotion, domAnimation, m } from 'framer-motion';
// Reduce el bundle ~65%
```

#### P5. Falta de `loading.tsx` en las rutas del dashboard

**Problema:** Next.js App Router soporta archivos `loading.tsx` que muestran Suspense boundaries automáticamente. Actualmente cada página gestiona su propio `isLoading` con `useState`.  
**Mejora:** Añadir `loading.tsx` en `/app/dashboard/`, `/app/dashboard/products/`, etc.

#### P6. Fuentes Google cargadas sin `display: 'swap'`

**Problema:** La configuración de fuentes no incluye `display: 'swap'`, lo que puede provocar FOIT (Flash of Invisible Text).  
**Mejora:**
```typescript
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const lora = Lora({ subsets: ['latin'], variable: '--font-serif', weight: ['400', '600', '700'], display: 'swap' });
```

#### P7. `DevKeepAlive` no excluido del bundle de producción en compile time

**Problema:** La condición `process.env.NEXT_PUBLIC_DEV_KEEPALIVE === 'true'` se evalúa en runtime, no en compilación. El código de `DevKeepAlive` se incluye en el bundle aunque no se ejecute.  
**Mejora:**
```typescript
// Solo cargar dinámicamente en desarrollo
{process.env.NEXT_PUBLIC_DEV_KEEPALIVE === 'true' && (
  <Suspense fallback={null}>
    {React.lazy(() => import('@/components/dev/DevKeepAlive'))}
  </Suspense>
)}
```

---

### 🟡 Medio — Orden y Mantenibilidad

#### O1. Datos MOCK mezclados con lógica de negocio en los módulos de API

**Problema:** Los arrays `MOCK_PRODUCTS`, `MOCK_ORDERS`, `MOCK_REVIEWS`, `BASE_NOTIFICATIONS` están definidos directamente en los mismos archivos que las funciones de API. Los archivos son muy extensos (products.ts = 630 líneas).  
**Mejora:** Separar en archivos `__mocks__/` y usar una variable de entorno para alternar entre mock y real:
```
src/lib/api/
  products.ts          ← solo tipos y firmas
  products.real.ts     ← implementación real (gatewayClient)
  __mocks__/
    products.mock.ts   ← datos y lógica mock
```

#### O2. Lógica de generación de SKU, slug e ID en el cliente (MOCK)

**Problema:** `generateProductId()`, `generateSku()` y `generateSlug()` están en el cliente. Pueden generar colisiones entre sesiones.  
**Impacto:** Solo afecta al MOCK, pero puede confundir si se reutiliza la lógica al integrar la API real.  
**Mejora:** Documentar explícitamente como `@internal mock-only` y eliminar cuando se integre el backend.

#### O3. Uso de `any` en puntos críticos

**Problema:** Tipado débil en varios sitios:
- `saveStep6`: `(data as any).stripeAccountId`
- `OrdersPage`: `setStats<any>(null)`
- `ReviewsPage`: `setStats<any>(null)`
- `StepBasic`: `formData?: any`

**Mejora:** Definir interfaces explícitas. Considerar activar `"strict": true` en `tsconfig.json`.

#### O4. `MOCK_PRODUCER_STATUS` hardcodeado en el DashboardLayout

**Problema:** El estado del productor (`pending_verification`) está hardcodeado. El `StatusBanner` que lo consumiría está comentado.  
**Mejora:** Añadir `producerStatus` al `AuthUser` o hacer una llamada específica a `GET /api/v1/producers/me/status`.

#### O5. Formularios de seguridad y preferencias sin llamadas reales a la API

**Problema:** Los botones "Guardar" de `/dashboard/security` solo simulan un delay. Las preferencias de notificación de `/dashboard/notifications` tampoco se persisten.  
**Mejora:** Integrar con endpoints reales del gateway para cambio de contraseña y actualización de preferencias.

#### O6. `window.lastSessionExpiredTime` como propiedad global de `Window`

**Problema:** Patrón frágil que extiende el objeto global `window`.  
**Mejora:** Usar una variable a nivel de módulo:
```typescript
let _lastSessionExpiredTime = 0;

function dispatchSessionExpired() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - _lastSessionExpiredTime > 1000) {
    _lastSessionExpiredTime = now;
    window.dispatchEvent(new CustomEvent('session:expired'));
  }
}
```

#### O7. Schema de validación Zod duplicado para el registro

**Problema:** Existe `initialRegistrationSchema` en `lib/validations/seller.ts` (para la API Route) y el formulario de registro en `registerProducer` (auth.ts) valida sus campos por separado. Los campos y reglas pueden divergir.  
**Mejora:** Un único schema compartido que se usa tanto en la validación de la API Route como en el formulario de registro del frontend.

---

### 🟢 Bajo — Calidad y Observabilidad

#### Q1. Ausencia de React Query / SWR para revalidación periódica

Las métricas del dashboard serán datos en tiempo real cuando se integre el backend. Sería conveniente un **polling silencioso** (e.g., cada 5 minutos) o revalidación al recuperar el foco de la ventana (`refetchOnWindowFocus`).

#### Q2. Sin manejo de estado offline

Si el usuario pierde conectividad, los errores solo se muestran en `PageError` cuando se recarga o re-monta. No hay detección proactiva (`navigator.onLine`, eventos `online`/`offline`) para informar al usuario sin necesidad de acción.

#### Q3. Accesibilidad en diálogos de producto

Los diálogos `AdjustStockDialog` y `DeleteProductDialog` deberían verificar que tienen atributos `aria-labelledby` y `aria-describedby` correctamente vinculados a sus títulos y descripciones (Radix UI lo soporta pero requiere configuración explícita).

#### Q4. Tests unitarios / e2e ausentes

No existe ninguna configuración de testing en el proyecto. Módulos críticos como `middleware.ts`, `AuthContext.tsx`, `client.ts` y `useProductFilters.ts` deberían tener cobertura mínima. Se recomienda:
- **Vitest** para tests unitarios (compatible con Vite/Next.js)
- **Playwright** para tests e2e del flujo de autenticación y onboarding

---

## Resumen Ejecutivo de Mejoras

| # | Área | Severidad | Prioridad |
|---|---|---|---|
| S1 | TypeScript errors ignorados en build | 🔴 Seguridad | Alta |
| S2 | ESLint ignorado en build | 🔴 Seguridad | Alta |
| S3 | API Routes sin autenticación | 🔴 Seguridad | Alta |
| S4 | stripeAccountId sin persistir | 🔴 Seguridad | Alta |
| S5 | PII en console.log desarrollo | 🟠 Seguridad | Media |
| P1 | Sin caché de datos (React Query) | 🟠 Rendimiento | Alta |
| P2 | Filtrado server-side pendiente | 🟠 Rendimiento | Alta |
| P3 | Delays MOCK encadenados | 🟠 Rendimiento | Media |
| P4 | Framer Motion sin LazyMotion | 🟠 Rendimiento | Media |
| P5 | Sin `loading.tsx` en dashboard | 🟡 Rendimiento | Media |
| P6 | Fuentes sin `display: swap` | 🟡 Rendimiento | Baja |
| P7 | DevKeepAlive en bundle producción | 🟡 Rendimiento | Baja |
| O1 | MOCK mezclado con lógica real | 🟡 Orden | Alta |
| O2 | Generación IDs/SKU en cliente | 🟡 Orden | Media |
| O3 | Tipado `any` en código crítico | 🟡 Orden | Media |
| O4 | Estado productor hardcodeado | 🟡 Orden | Baja |
| O5 | Formularios sin llamadas reales | 🟡 Orden | Media |
| O6 | `window.lastSessionExpiredTime` | 🟢 Orden | Baja |
| O7 | Schemas Zod duplicados | 🟢 Orden | Baja |
| Q1 | Sin polling/revalidación | 🟢 Calidad | Baja |
| Q2 | Sin detección estado offline | 🟢 Calidad | Baja |
| Q3 | Accesibilidad diálogos | 🟢 Calidad | Baja |
| Q4 | Sin tests unitarios/e2e | 🟢 Calidad | Media |
