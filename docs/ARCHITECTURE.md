# ARCHITECTURE.md — origen-dashboard
> Fecha: 2026-04-22

## Patrón arquitectónico

`origen-dashboard` sigue el patrón **React Server Components (RSC) first** de Next.js 15:

- **Server Components** (por defecto): Fetching de datos, layouts, páginas
- **Client Components** (`'use client'`): Formularios interactivos, estado local, hooks del navegador
- **Server Actions**: Mutaciones de datos desde formularios de servidor

## Flujo de autenticación

```
Usuario accede a /dashboard/*
  → middleware.ts verifica cookie accessToken
  → Si no existe → redirect a /auth/login
  → Si existe → próxima petición
    → Layout lee perfil desde API Gateway
    → Inyecta contexto de usuario
```

El middleware de Next.js (`middleware.ts`) intercepta todas las rutas bajo `/dashboard/*`, `/onboarding/*` y redirige a login si no hay sesión válida.

## Gestión de estado

| Capa | Tecnología | Uso |
|------|------------|-----|
| Estado del servidor | Server Components + fetch | Datos de productos, pedidos, perfil |
| Estado del cliente | React useState / useReducer | Formularios, modales, UI interactiva |
| Estado global | React Context | Sesión de usuario, notificaciones |
| Formularios | React Hook Form + Zod | Validación cliente antes de enviar |

## Clientes de API (`src/lib/api/`)

Cada archivo del directorio `lib/api/` encapsula las llamadas al gateway para un dominio:

| Archivo | Dominio | Descripción |
|---------|---------|-------------|
| `client.ts` | Base | Configuración base de fetch (URL, headers, cookies) |
| `auth.ts` | Auth | Login, logout, refresh, perfil |
| `products.ts` | Productos | CRUD, publicación, inventario |
| `products-mapper.ts` | Productos | Transformación de respuestas del API |
| `categories.ts` | Categorías | Lista de categorías disponibles |
| `orders.ts` | Pedidos | Lista y detalle de pedidos del productor |
| `producers.ts` | Productores | Perfil, onboarding, configuración |
| `onboarding.ts` | Onboarding | Pasos 1-6 del proceso de alta |
| `media.ts` | Media | Upload de imágenes y documentos |
| `reviews.ts` | Reseñas | Reseñas recibidas y respuestas |
| `notifications.ts` | Notificaciones | Notificaciones in-app, preferencias |

## Hooks personalizados (`src/hooks/`)

| Hook | Descripción |
|------|-------------|
| `useProductFilters` | Gestión de filtros de la lista de productos |
| `useProductForm` | Estado y validación del formulario de crear/editar producto |
| `useInactivityTimeout` | Logout automático por inactividad |
| `useSessionVisibilityGuard` | Verifica la sesión cuando el tab vuelve a estar activo |
| `useStepTips` | Tips contextuales para los pasos del onboarding |

## Flujo de onboarding

```
/onboarding/step-1  → Ubicación productiva
/onboarding/step-2  → Historia y valores de marca
/onboarding/step-3  → Imágenes (logo, banner, galería)
/onboarding/step-4  → Configuración logística y envíos
/onboarding/step-5  → Documentos legales (CIF, Seguro RC, Manipulador)
/onboarding/step-6  → Stripe Connect (cobros)

Al finalizar:
  → Producer.status = PENDING_VERIFICATION
  → Equipo Origen revisa documentos (24-48h)
  → Al aprobar: Producer.status = ACTIVE
```

## Flujo de gestión de productos

```
/dashboard/products              → Lista de productos del productor
/dashboard/products/new          → Crear producto (formulario completo)
/dashboard/products/:id          → Editar producto
/dashboard/products/:id/images   → Gestión de imágenes

Estados del producto:
  DRAFT → (publicar) → PENDING_APPROVAL → (admin aprueba) → ACTIVE
                                         → (admin rechaza) → DRAFT
  ACTIVE → INACTIVE / OUT_OF_STOCK / SCHEDULED
```

## Seguridad

| Medida | Implementación |
|--------|---------------|
| Autenticación | Cookie `accessToken` HttpOnly (gestionada por el gateway) |
| Rutas protegidas | `middleware.ts` redirige a login si no hay sesión |
| Validación de formularios | Zod en cliente + validación en servidor |
| Sin exposición de tokens | Los tokens están en cookies HttpOnly — JS no puede accederlos |
| CORS | Gestionado por el gateway |

## Tests

| Tipo | Framework | Ubicación |
|------|-----------|-----------|
| Unitarios | Vitest + Testing Library | `tests/unit/` |
| Integración | Vitest | `tests/integration/` |
| E2E | Playwright | `tests/e2e/` |
| Smoke tests | Playwright | `tests/e2e/dashboard/` |

Tests e2e principales:
- `producer-complete-flow.spec.ts` — Flujo completo del productor
- `notifications-regression.spec.ts` — Regresión de notificaciones
- `home-sections-smoke.spec.ts` — Smoke test del dashboard
