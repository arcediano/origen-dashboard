# API.md — origen-dashboard
> Fecha: 2026-04-22  
> Todas las llamadas van al API Gateway: `NEXT_PUBLIC_API_GATEWAY_URL`

Este documento lista las rutas de la aplicación Next.js y las llamadas al API Gateway que realiza cada una.

---

## Rutas de la aplicación Next.js

### Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Redirige a `/dashboard` (si tiene sesión) o `/auth/login` |
| `/auth/login` | Formulario de login |
| `/auth/registro` | Formulario de registro de nuevo productor |
| `/aviso-legal` | Aviso legal |
| `/privacidad` | Política de privacidad |
| `/terminos` | Términos y condiciones |
| `/cookies` | Política de cookies |
| `/como-funciona` | Cómo funciona Origen |
| `/casos-exito` | Casos de éxito |
| `/ayuda` | Centro de ayuda |
| `/soporte` | Soporte técnico |
| `/contacto` | Formulario de contacto |

### Rutas protegidas (requieren PRODUCER)

| Ruta | Descripción |
|------|-------------|
| `/onboarding/step-1` | Onboarding: Ubicación |
| `/onboarding/step-2` | Onboarding: Historia y valores |
| `/onboarding/step-3` | Onboarding: Imágenes |
| `/onboarding/step-4` | Onboarding: Logística |
| `/onboarding/step-5` | Onboarding: Documentos |
| `/onboarding/step-6` | Onboarding: Pagos Stripe |
| `/dashboard` | Home: métricas y resumen |
| `/dashboard/products` | Lista de productos |
| `/dashboard/products/new` | Crear producto |
| `/dashboard/products/:id` | Editar producto |
| `/dashboard/orders` | Lista de pedidos |
| `/dashboard/reviews` | Reseñas recibidas |
| `/dashboard/notifications` | Centro de notificaciones |
| `/dashboard/account` | Mi cuenta |
| `/dashboard/account/profile` | Editar perfil |
| `/dashboard/account/security` | Cambio de contraseña |
| `/dashboard/account/notifications` | Preferencias de notificación |
| `/dashboard/business` | Datos del negocio y fiscal |
| `/dashboard/configuracion` | Configuración de alertas |
| `/dashboard/perfil` | Perfil público del productor |

---

## Llamadas al API Gateway por módulo

### Auth (`lib/api/auth.ts`)

| Operación | Método | Endpoint Gateway |
|-----------|--------|-----------------|
| Login | `POST` | `/api/v1/auth/login` |
| Logout | `POST` | `/api/v1/auth/logout` |
| Obtener perfil | `GET` | `/api/v1/auth/me` |
| Cambiar contraseña | `PATCH` | `/api/v1/auth/change-password` |
| Verificar sesión | `GET` | `/api/v1/auth/status` |

### Producers (`lib/api/producers.ts` + `lib/api/onboarding.ts`)

| Operación | Método | Endpoint Gateway |
|-----------|--------|-----------------|
| Registrar productor | `POST` | `/api/v1/auth/register` |
| Obtener perfil del productor | `GET` | `/api/v1/producers/me` |
| Progreso del onboarding | `GET` | `/api/v1/producers/onboarding/progress` |
| Guardar paso 1 | `PATCH` | `/api/v1/producers/onboarding/step-1` |
| Guardar paso 2 | `PATCH` | `/api/v1/producers/onboarding/step-2` |
| Guardar paso 3 | `PATCH` | `/api/v1/producers/onboarding/step-3` |
| Guardar paso 4 | `PATCH` | `/api/v1/producers/onboarding/step-4` |
| Guardar paso 5 | `PATCH` | `/api/v1/producers/onboarding/step-5` |
| Guardar paso 6 | `PATCH` | `/api/v1/producers/onboarding/step-6` |

### Products (`lib/api/products.ts`)

| Operación | Método | Endpoint Gateway |
|-----------|--------|-----------------|
| Listar productos del productor | `GET` | `/api/v1/products?producerId=...` |
| Detalle de producto | `GET` | `/api/v1/products/:slug` |
| Crear producto | `POST` | `/api/v1/products` |
| Actualizar producto | `PATCH` | `/api/v1/products/:id` |
| Eliminar producto | `DELETE` | `/api/v1/products/:id` |
| Publicar (enviar a revisión) | `PATCH` | `/api/v1/products/:id/publish` |
| Listar categorías | `GET` | `/api/v1/products/categories` |
| Catálogo de certificaciones | `GET` | `/api/v1/products/certifications/catalog` |

### Orders (`lib/api/orders.ts`)

| Operación | Método | Endpoint Gateway |
|-----------|--------|-----------------|
| Listar pedidos del productor | `GET` | `/api/v1/orders/producer` |
| Detalle de pedido | `GET` | `/api/v1/orders/:id` |
| Actualizar estado del pedido | `PATCH` | `/api/v1/orders/:id/status` |

### Reviews (`lib/api/reviews.ts`)

| Operación | Método | Endpoint Gateway |
|-----------|--------|-----------------|
| Listar reseñas recibidas | `GET` | `/api/v1/products/reviews` |
| Responder a una reseña | `PATCH` | `/api/v1/products/reviews/:id/respond` |

### Notifications (`lib/api/notifications.ts`)

| Operación | Método | Endpoint Gateway |
|-----------|--------|-----------------|
| Listar notificaciones | `GET` | `/api/v1/notifications` |
| Contador de no leídas | `GET` | `/api/v1/notifications/unread-count` |
| Marcar como leída | `PATCH` | `/api/v1/notifications/:id/read` |
| Marcar todas como leídas | `PATCH` | `/api/v1/notifications/read-all` |
| Obtener preferencias | `GET` | `/api/v1/notifications/preferences` |
| Actualizar preferencias | `PATCH` | `/api/v1/notifications/preferences` |

### Media (`lib/api/media.ts`)

| Operación | Método | Endpoint Gateway |
|-----------|--------|-----------------|
| Subir archivo | `POST` | `/api/v1/media/upload` (multipart/form-data) |
| Borrar archivo | `DELETE` | `/api/v1/media/:id` |

### Stripe (`lib/stripe/`)

| Operación | Descripción |
|-----------|-------------|
| Iniciar Stripe Connect | Redirige al flow de Stripe Connect desde paso 6 del onboarding |
| Verificar estado de conexión | Consulta si `stripeConnected=true` en PaymentConfig |
