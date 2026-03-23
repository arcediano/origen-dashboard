# Testing — origen-dashboard

> **Stack:** Vitest · @testing-library/react · MSW v2 · Playwright
> **Tests activos:** 287 tests (209 unitarios + 78 integración)
> **Cobertura:** Schemas Zod, utilidades, hooks de negocio y seguridad, API de auth y pedidos, formularios de login, registro y recuperación de contraseña
> **Política:** Los tests se ejecutan automáticamente antes de cada despliegue en Vercel. Un fallo en los tests bloquea el deploy.

---

## Índice

1. [Arquitectura del sistema de tests](#1-arquitectura-del-sistema-de-tests)
2. [Comandos disponibles](#2-comandos-disponibles)
3. [Tests unitarios — Schemas Zod](#3-tests-unitarios--schemas-zod)
4. [Tests de integración — Formulario de login](#4-tests-de-integración--formulario-de-login)
5. [Tests de integración — Formulario de registro](#5-tests-de-integración--formulario-de-registro)
6. [Tests E2E — Playwright](#6-tests-e2e--playwright)
7. [MSW — Mocking de API](#7-msw--mocking-de-api)
8. [Factories de datos](#8-factories-de-datos)
9. [Gate de despliegue en Vercel](#9-gate-de-despliegue-en-vercel)
10. [Añadir nuevos tests](#10-añadir-nuevos-tests)

---

## 1. Arquitectura del sistema de tests

```
tests/
├── unit/
│   ├── validations/
│   │   ├── seller.schema.test.ts        # Schemas Zod: registro + onboarding pasos 1,2,4
│   │   └── onboarding-step3.test.ts     # Schema Zod: onboarding paso 3 (perfil visual)
│   ├── utils/
│   │   └── utils.test.ts                # Funciones utilitarias (cn, format*, generate*, etc.)
│   ├── hooks/
│   │   ├── useProductFilters.test.ts    # Hook de filtrado/ordenación/paginación de productos
│   │   ├── useInactivityTimeout.test.ts # Hook de timeout de inactividad (seguridad, 15 min)
│   │   └── useSessionVisibilityGuard.test.ts # Hook de pestaña oculta (seguridad, 30 min)
│   └── api/
│       ├── auth.api.test.ts             # Funciones de API de autenticación (MSW)
│       └── orders.api.test.ts           # Funciones de API de pedidos (mock data)
├── integration/
│   └── auth/
│       ├── login-form.test.tsx          # Formulario de login (validación, redirección, errores)
│       ├── register-form.test.tsx       # Formulario de registro (validación, MSW 409/200)
│       └── forgot-password-form.test.tsx # Formulario de recuperación de contraseña
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts               # E2E flujo de login
│   │   └── register.spec.ts            # E2E flujo de registro
│   └── dashboard/
│       └── products.spec.ts            # E2E listado y creación de productos
├── mocks/
│   ├── server.ts                       # Servidor MSW (node)
│   └── handlers/
│       ├── auth.handlers.ts            # Interceptores de /api/v1/auth/*
│       └── products.handlers.ts        # Interceptores de /api/v1/products/*
├── factories/
│   ├── user.factory.ts                 # Datos de usuario/auth para tests
│   └── product.factory.ts              # Datos de producto para tests
└── helpers/
    └── render.tsx                      # Wrapper de render + mocks globales
```

### Capas y responsabilidades

| Capa | Herramienta | Responsabilidad |
|------|------------|-----------------|
| **Unit** | Vitest | Validar que los schemas Zod rechazan/aceptan los datos correctos |
| **Integration** | Vitest + @testing-library/react | Validar que los componentes React se comportan correctamente con y sin API |
| **E2E** | Playwright | Validar flujos completos en navegador real contra la app corriendo |
| **API Mock** | MSW v2 | Interceptar llamadas `fetch` en tests de integración sin tocar la red ni la BD |

### Decisiones de diseño

- **MSW v2 en modo node**: intercepta `fetch` a nivel de Node.js, no es necesario un service worker. Las peticiones nunca salen de la máquina de tests.
- **happy-dom** en lugar de jsdom: menos dependencias con ESM problemáticas, más rápido.
- **`vi.mock('next/navigation', ...)`** en cada test file: evita conflictos entre el mock global de `render.tsx` y los mocks de router específicos de cada test.

---

## 2. Comandos disponibles

```bash
# Ejecutar todos los tests unitarios e integración (lo que corre en Vercel)
npm test

# Modo watch — re-ejecuta al guardar (desarrollo local)
npm run test:watch

# Solo tests unitarios (schemas Zod)
npm run test:unit

# Solo tests de integración (componentes React)
npm run test:integration

# Informe de cobertura HTML en tests/coverage/
npm run test:coverage

# Tests E2E (requiere la app corriendo en localhost:3001)
npm run test:e2e

# Tests E2E con interfaz visual de Playwright
npm run test:e2e:ui

# Tests E2E con navegador visible (útil para depurar)
npm run test:e2e:headed
```

---

## 3. Tests unitarios — Schemas Zod

**Archivo:** `tests/unit/validations/seller.schema.test.ts`
**Tests:** 53
**Ejecución:** ~30ms

Validan directamente los schemas de `src/lib/validations/seller.ts` sin renderizar ningún componente. Son los tests más rápidos y cubren todas las reglas de negocio de validación.

### Schemas cubiertos

#### `initialRegistrationSchema` — 37 tests

| Campo | Casos probados |
|-------|---------------|
| `contactName` | Mínimo 2 chars, máximo 50 |
| `contactSurname` | Mínimo 2 chars |
| `email` | Email válido, normalización a minúsculas, vacío, sin @ |
| `phone` | Regex español `+34/0034/34` + 9 dígitos, números de otros países, 8 dígitos (corto), prefijo 5xx |
| `password` | Mínimo 8 chars, requiere mayúscula, requiere minúscula, requiere dígito, máximo 72 |
| `confirmPassword` | Coincidencia con `password` (refinement cross-field) |
| `postalCode` | Exactamente 5 dígitos, con letras, 4 dígitos |
| `businessName` | Mínimo 3 chars, máximo 200 |
| `businessType` | Enum `individual` / `company`, valor fuera de enum |
| `producerCategory` | Los 6 valores del enum (`agricola`, `ganadero`, `artesano`, `apicultor`, `viticultor`, `especializado`), valor inválido |
| `whyOrigin` | Mínimo 50 chars, máximo 300 |
| `acceptsTerms` | Rechazo si `false` |
| `acceptsPrivacy` | Rechazo si `false` |

#### `onboardingStep1Schema` — 5 tests

Valida el formulario de ubicación del paso 1 del onboarding: calle, número, CP (5 dígitos), ciudad, provincia, comunidad autónoma y campos opcionales de región turística.

#### `onboardingStep2Schema` — 6 tests

Valida historia del negocio (≥200 chars), filosofía (≥100 chars), prácticas sostenibles (array no vacío) y certificaciones opcionales.

#### `onboardingStep4Schema` — 6 tests

Valida capacidad mensual (>0), radio de entrega (1–200 km), días de entrega (array no vacío) y unidad de capacidad (`kg` / `litros` / `unidades`).

---

## 4. Tests de integración — Formulario de login

**Archivo:** `tests/integration/auth/login-form.test.tsx`
**Tests:** 12
**Componente:** `src/components/features/auth/components/login-form.tsx` (`SimpleLogin`)

### Casos cubiertos

| Test | Qué verifica |
|------|-------------|
| Renderizado | Email, contraseña y botón "Acceder al panel" presentes en DOM |
| Formulario vacío | Muestra error "el email es requerido" al enviar sin datos |
| Email inválido | Muestra error "introduce un email válido" |
| Contraseña corta | Muestra error "mínimo 8 caracteres" |
| Login exitoso → onboarding completado | Llama a `setUserFromLogin` y redirige a `/dashboard` |
| Login exitoso → onboarding pendiente | Redirige a `/onboarding` |
| Credenciales incorrectas (401) | Muestra "credenciales incorrectas", no navega |
| Cuenta no aprobada (403) | Muestra el mensaje del servidor |
| Error de servidor (500) | Muestra "no se pudo conectar con el servidor" |
| Rol no PRODUCER | Llama a `clearUser()` y muestra mensaje de acceso denegado |
| Checkbox "Recordar mi sesión" | Funciona correctamente (on/off) |
| Flujo completo de login | `setUserFromLogin` se llama exactamente una vez y luego navega |

### Notas técnicas

- El MSW intercepta `POST http://localhost:3001/api/v1/auth/login`. Solo acepta `productor@test.es` + `Password1`.
- `useAuth` está mockeado: `setUserFromLogin` es un `vi.fn()` exportado (`mockSetUserFromLogin`) al que los tests le asignan el valor de retorno con `mockResolvedValueOnce`.
- `useRouter` se mockea en cada test con su propio `mockRouterPush` para no compartir estado entre tests.

---

## 5. Tests de integración — Formulario de registro

**Archivo:** `tests/integration/auth/register-form.test.tsx`
**Tests:** 13
**Componente:** `src/components/features/registration/SimpleRegistration.tsx`

### Casos cubiertos

| Test | Qué verifica |
|------|-------------|
| Renderizado | Campos nombre, email, contraseña, teléfono y negocio presentes |
| Botón en estado inválido | Muestra "Completar registro" y está deshabilitado cuando el formulario no es válido |
| Botón en estado válido | Muestra "Enviar solicitud" cuando todos los campos son correctos |
| Checkboxes términos y privacidad | Presentes y desmarcados por defecto |
| Checkboxes interactuables | Click activa/desactiva |
| Textarea de historia | Acepta y muestra el texto escrito |
| Campo email | Acepta texto, tipo correcto |
| Campo código postal | Acepta texto |
| Campo contraseña | `type="password"` por defecto |
| Campo confirmar contraseña | `type="password"` |
| Validación email inválido (react-hook-form) | El input tiene `aria-invalid="true"` tras introducir email incorrecto |
| Validación teléfono (react-hook-form) | El input tiene `aria-invalid="true"` con formato incorrecto |
| MSW 409 email duplicado | El handler devuelve status 409 con mensaje esperado |
| MSW 200 registro exitoso | El handler devuelve `trackingCode: 'TRACK-001'` |

### Mocks necesarios

El componente tiene dependencias de módulos de constantes que se mockean:

```typescript
vi.mock('@/constants/categories', () => ({
  PRODUCER_CATEGORIES: [
    { value: 'agricola', label: 'Agrícola', icon: '🌾', description: 'Cultivos' },
    { value: 'artesano', label: 'Artesano', icon: '🧀', description: 'Artesanía' },
  ],
}));

vi.mock('@/constants/cp-provincias', () => ({
  getProvinciaFromCP: (cp: string) => cp === '40001' ? 'Segovia' : null,
}));

vi.mock('@/components/features/registration/hooks/useAutosave', () => ({
  useAutosave: () => ({ loadDraft: () => null, clearDraft: vi.fn() }),
}));
```

---

## 6. Tests E2E — Playwright

**Directorio:** `tests/e2e/`
**Configuración:** `playwright.config.ts`

Los E2E **requieren que la app esté corriendo** en `http://localhost:3001`. Por defecto, Playwright la arranca automáticamente con `npm run dev`.

### Entornos

| Proyecto Playwright | Dispositivo |
|--------------------|------------|
| `chromium` | Desktop Chrome |
| `mobile-chrome` | Pixel 7 |
| `mobile-safari` | iPhone 14 |

### Tests E2E disponibles

**`tests/e2e/auth/login.spec.ts`**
- Carga correcta de la página `/auth/login`
- Errores de validación (formulario vacío, email inválido, contraseña corta)
- Navegación a "¿Olvidaste la contraseña?"
- Navegación a la página de registro
- Checkbox "Recordar mi sesión"
- Accesibilidad básica (labels en inputs)
- Login exitoso con credenciales reales *(requiere `E2E_TEST_EMAIL`)*

**`tests/e2e/auth/register.spec.ts`**
- Carga de la página `/auth/register`
- Botón deshabilitado con formulario vacío
- Validaciones inline en tiempo real
- Autorrelleno de provincia desde CP
- Checkboxes de términos y privacidad
- Indicador de fortaleza de contraseña
- Registro completo *(desactivado con `test.skip` — requiere API disponible)*

**`tests/e2e/dashboard/products.spec.ts`**
- Listado de productos *(requiere sesión activa)*
- Navegación a "Nuevo producto"
- Filtro de búsqueda
- Formulario multi-step de creación

### Variables de entorno para E2E

```bash
# URL base de la app (por defecto localhost:3001)
PLAYWRIGHT_BASE_URL=http://localhost:3001

# Credenciales para tests de login real (opcionales)
E2E_TEST_EMAIL=productor@test.es
E2E_TEST_PASSWORD=Password1
```

---

## 7. MSW — Mocking de API

**Directorio:** `tests/mocks/`

Los handlers interceptan `fetch` a `http://localhost:3001/api/v1/*` — la misma URL que usa el `gatewayClient` cuando corre en el browser (happy-dom).

### Handlers de auth (`auth.handlers.ts`)

| Método | Ruta | Comportamiento |
|--------|------|---------------|
| POST | `/api/v1/auth/login` | 200 si `productor@test.es` + `Password1`, 401 en otro caso |
| POST | `/api/v1/auth/register` | 409 si `duplicado@test.es`, 200 con `trackingCode` en otro caso |
| GET | `/api/v1/auth/userinfo` | Devuelve usuario PRODUCER hardcodeado |
| POST | `/api/v1/auth/forgot-password` | 200 siempre |
| POST | `/api/v1/auth/logout` | 200 siempre |

**Handlers de error reutilizables** (para `server.use(...)` en tests individuales):

```typescript
import { authErrorHandlers } from '../mocks/handlers/auth.handlers';

// Dentro de un test:
server.use(authErrorHandlers.loginServerError);   // Fuerza 500
server.use(authErrorHandlers.loginForbidden);     // Fuerza 403
server.use(authErrorHandlers.registerConflict);   // Fuerza 409
```

### Handlers de productos (`products.handlers.ts`)

| Método | Ruta | Comportamiento |
|--------|------|---------------|
| GET | `/api/v1/products` | Lista paginada con `buildProductList()` |
| GET | `/api/v1/products/:id` | Producto por ID, 404 si id=9999 |
| POST | `/api/v1/products` | Crea producto con `buildProduct()` |
| PUT | `/api/v1/products/:id` | Actualiza producto |
| DELETE | `/api/v1/products/:id` | 200 con mensaje |
| POST | `/api/v1/products/suggest-sku` | Devuelve SKU generado |

---

## 8. Factories de datos

### `user.factory.ts`

```typescript
import { buildProducerUser, buildNewProducerUser, buildAdminUser, validLoginCredentials, validRegistrationData } from '../factories/user.factory';

// Usuario productor con onboarding completado
buildProducerUser()

// Usuario productor recién registrado (sin producerCode, onboarding: false)
buildNewProducerUser()

// Usuario admin
buildAdminUser()

// Datos válidos para el formulario de login
validLoginCredentials  // { email: 'productor@test.es', password: 'Password1' }

// Datos válidos completos para el formulario de registro
validRegistrationData  // { contactName: 'María', email: 'maria.garcia@test.es', ... }
```

### `product.factory.ts`

```typescript
import { buildProduct, buildProductList, buildOutOfStockProduct, buildDraftProduct } from '../factories/product.factory';

buildProduct()                         // Producto activo con stock
buildProduct({ name: 'Mi Queso' })     // Con overrides
buildProductList(5)                    // Array de 5 productos
buildOutOfStockProduct()               // stock: 0
buildDraftProduct()                    // status: 'draft'
```

---

## 9. Gate de despliegue en Vercel

**Los tests se ejecutan automáticamente como parte del build de Vercel.** Si algún test falla, el despliegue se cancela antes de que el código llegue a producción.

### Cómo funciona

El script `build` en `package.json` ejecuta los tests antes del build de Next.js:

```json
{
  "scripts": {
    "build": "npm test && next build"
  }
}
```

Vercel ejecuta `npm run build` en cada deploy. Si `npm test` falla (exit code ≠ 0), Vercel detiene el proceso y marca el deployment como **FAILED**. El código actual en producción no se ve afectado.

### Flujo completo

```
git push / PR merge
       │
       ▼
  Vercel recibe el trigger
       │
       ▼
  npm run build
  ├── npm test           ← Ejecuta 78 tests (unit + integración)
  │   ├── ✅ PASS → continúa
  │   └── ❌ FAIL → deployment cancelado, producción intacta
  └── next build         ← Solo se ejecuta si los tests pasan
       │
       ▼
  Deploy a producción
```

### Qué tests corren en el build

- ✅ **Tests unitarios** — schemas Zod (53 tests, ~30ms)
- ✅ **Tests de integración** — login form, registro form (25 tests, ~6s)
- ❌ **Tests E2E** — NO corren en Vercel (requieren app corriendo y pueden tener dependencias externas)

Los E2E se ejecutan manualmente en local antes de subir cambios importantes.

### Verificar localmente antes de hacer push

```bash
# Simula exactamente lo que hará Vercel
npm run build
```

Si el comando termina sin error, el despliegue en Vercel también lo hará.

### Tiempo estimado del gate

| Fase | Tiempo |
|------|--------|
| Tests unitarios (53) | ~5s |
| Tests integración (25) | ~8s |
| `next build` | ~90s |
| **Total** | **~2 min** |

---

## 10. Añadir nuevos tests

### Test unitario de un nuevo schema Zod

Añadir casos en `tests/unit/validations/seller.schema.test.ts` siguiendo el patrón existente:

```typescript
describe('miNuevoSchema', () => {
  const datosValidos = { campo: 'valor', ... };

  it('acepta datos válidos', () => {
    expect(miNuevoSchema.safeParse(datosValidos).success).toBe(true);
  });

  it('rechaza campo requerido vacío', () => {
    const result = miNuevoSchema.safeParse({ ...datosValidos, campo: '' });
    expect(result.success).toBe(false);
  });
});
```

### Test de integración de un nuevo componente

1. Crear `tests/integration/<módulo>/<componente>.test.tsx`
2. Importar `render` de `tests/helpers/render.tsx`
3. Mockear `next/navigation` en el propio archivo de test
4. Añadir handlers MSW en `tests/mocks/handlers/` si hay llamadas API

```typescript
import { render } from '../../helpers/render';
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MiComponente } from '@/components/...';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

describe('MiComponente', () => {
  it('renderiza correctamente', () => {
    render(<MiComponente />);
    expect(screen.getByText(/texto esperado/i)).toBeInTheDocument();
  });
});
```

### Añadir handler MSW para un nuevo endpoint

En `tests/mocks/handlers/`:

```typescript
// En el handler correspondiente o en uno nuevo:
http.get(`${BASE}/nuevo-recurso`, () => {
  return HttpResponse.json({ success: true, data: buildNuevoRecurso() });
}),
```

Y registrarlo en `tests/mocks/server.ts`:

```typescript
import { nuevoHandler } from './handlers/nuevo.handlers';
export const server = setupServer(...authHandlers, ...productsHandlers, ...nuevoHandler);
```

---

*Última actualización: marzo 2026*
